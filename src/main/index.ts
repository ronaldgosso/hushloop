import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { TimerEngine } from '../core/timer/timer-engine';
import { TrayManager } from './tray';
import { WindowsSilencer, CrashRecoveryLedger } from './silencer';
import { NotificationManager } from './notifications';
import { StatsStore } from './storage/stats-store';
import type { TimerPhase } from '../shared/types';

let mainWindow: BrowserWindow | null = null;
let trayManager: TrayManager | null = null;
let timerEngine: TimerEngine | null = null;
let silencer: WindowsSilencer | null = null;
let recoveryLedger: CrashRecoveryLedger | null = null;
let statsStore: StatsStore | null = null;
let pendingRecoveredVolume: number | null = null;
let isQuitting = false;

async function initSilencerAndRecovery(): Promise<void> {
  const ledgerPath = path.join(app.getPath('userData'), 'silencer-session.json');
  recoveryLedger = new CrashRecoveryLedger(ledgerPath);
  silencer = new WindowsSilencer(undefined, recoveryLedger);

  const statsPath = path.join(app.getPath('userData'), 'stats.json');
  statsStore = new StatsStore(statsPath);
  await statsStore.load();

  // Check for crash recovery from an unexpected prior termination
  const recoveryResult = await recoveryLedger.recoverIfNeeded(silencer);
  if (recoveryResult.recovered && recoveryResult.snapshot) {
    pendingRecoveredVolume = recoveryResult.snapshot.volumePercent;
    console.info(
      `[FocusDeck] Startup crash recovery: restored system audio to ${pendingRecoveredVolume}%`,
    );
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 720,
    minWidth: 840,
    minHeight: 640,
    backgroundColor: '#0d1117',
    show: false,
    frame: false, // Custom frameless glassmorphic header
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();

    // If crash recovery occurred, alert the renderer UI
    if (pendingRecoveredVolume !== null && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('silencer:crash-recovered', pendingRecoveredVolume);
      pendingRecoveredVolume = null;
    }
  });

  // Intercept window close to minimize to tray instead of exiting
  mainWindow.on('close', event => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Initialize Timer Engine
  timerEngine = new TimerEngine({
    focusDurationMs: 25 * 60 * 1000,
    shortBreakDurationMs: 5 * 60 * 1000,
    longBreakDurationMs: 15 * 60 * 1000,
    longBreakInterval: 4,
  });

  // Initialize Tray
  trayManager = new TrayManager(mainWindow, timerEngine);

  // Broadcast timer events to renderer, manage silencer, and update tray
  timerEngine.onTick(snapshot => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('timer:tick', snapshot);
    }
    trayManager?.update(snapshot);
  });

  timerEngine.onStateChange(async snapshot => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('timer:state-change', snapshot);
    }
    trayManager?.update(snapshot);

    // Active Silencing logic:
    // Silence when in active running focus session; restore on breaks, pause, or reset.
    if (silencer) {
      if (snapshot.state === 'running' && snapshot.phase === 'focus') {
        await silencer.silence(0); // Duck/mute system distractions
      } else {
        await silencer.restore(); // Restore original system audio
      }
    }
  });

  timerEngine.onPhaseComplete(async event => {
    // 1. Notify Windows 11 Desktop
    NotificationManager.showPhaseCompleteNotification(event.completedPhase, event.nextPhase);

    // 2. Persist session stats
    if (statsStore) {
      if (event.completedPhase === 'focus') {
        await statsStore.recordFocus(25);
      } else {
        await statsStore.recordBreak(event.completedPhase === 'long_break');
      }
    }

    // 3. Inform renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('timer:phase-complete', event);
    }
  });

  // Register IPC Handlers
  ipcMain.handle('timer:start', (_event, phase?: TimerPhase) => {
    return timerEngine?.start(phase);
  });

  ipcMain.handle('timer:pause', () => {
    return timerEngine?.pause();
  });

  ipcMain.handle('timer:resume', () => {
    return timerEngine?.resume();
  });

  ipcMain.handle('timer:reset', () => {
    return timerEngine?.reset();
  });

  ipcMain.handle('timer:skip', () => {
    return timerEngine?.skip();
  });

  ipcMain.handle('timer:get-snapshot', () => {
    return timerEngine?.getSnapshot();
  });

  // Silencer IPC Handlers
  ipcMain.handle('silencer:status', async () => {
    return {
      isSilenced: silencer?.isSilenced() ?? false,
      currentVolume: (await silencer?.getCurrentVolume()) ?? 100,
    };
  });

  ipcMain.handle('silencer:toggle', async (_event, enable: boolean) => {
    if (!silencer) return { success: false, isSilenced: false };
    const res = enable ? await silencer.silence(0) : await silencer.restore();
    return { success: res.success, isSilenced: silencer.isSilenced() };
  });

  // Stats IPC Handlers
  ipcMain.handle('stats:get-summary', async () => {
    if (!statsStore) {
      return {
        today: {
          date: new Date().toISOString().split('T')[0],
          focusMinutes: 0,
          completedFocusSessions: 0,
          completedShortBreaks: 0,
          completedLongBreaks: 0,
        },
        streakDays: 0,
        totalFocusMinutes: 0,
        totalCompletedSessions: 0,
      };
    }
    return statsStore.getSummary();
  });

  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:close-to-tray', () => {
    mainWindow?.hide();
  });

  ipcMain.handle('window:toggle-visibility', () => {
    trayManager?.toggleWindow();
  });

  ipcMain.handle('app:version', () => {
    return app.getVersion();
  });

  // Load URL
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  await initSilencerAndRecovery();
  createWindow();

  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });
});

app.on('before-quit', async () => {
  isQuitting = true;
  // Always restore original system volume before application exits
  if (silencer) {
    await silencer.restore();
  }
  timerEngine?.destroy();
  trayManager?.destroy();
});

app.on('window-all-closed', () => {
  // Kept alive in tray unless quitting explicitly
  if (process.platform !== 'darwin' && isQuitting) {
    app.quit();
  }
});
