import { app, BrowserWindow, ipcMain, screen } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TimerEngine } from '../core/timer/timer-engine';
import { TrayManager } from './tray';
import { WindowsSilencer, CrashRecoveryLedger } from './silencer';
import { NotificationManager } from './notifications';
import { StatsStore } from './storage/stats-store';
import { SettingsStore } from './storage/settings-store';
import { GlobalHotkeyManager } from './hotkeys';
import type { TimerPhase } from '../shared/types';
import { DEFAULT_USER_SETTINGS, type UserSettings } from '../shared/types/settings';

// Improve GPU stability and prevent status breakpoint crashes across diverse Windows laptop GPUs
app.commandLine.appendSwitch('disable-gpu-sandbox');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on('uncaughtException', (err) => {
  console.error('[HushLoop] Uncaught exception:', err);
  try {
    const logPath = path.join(app.getPath('userData'), 'crash.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] Uncaught: ${err.stack || err}\n`);
  } catch (logErr) {
    console.error('[HushLoop] Failed to write crash log:', logErr);
  }
});

process.on('unhandledRejection', (reason) => {
  console.error('[HushLoop] Unhandled rejection:', reason);
  try {
    const logPath = path.join(app.getPath('userData'), 'crash.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] Rejection: ${reason}\n`);
  } catch (logErr) {
    console.error('[HushLoop] Failed to write rejection log:', logErr);
  }
});

let mainWindow: BrowserWindow | null = null;
let trayManager: TrayManager | null = null;
let timerEngine: TimerEngine | null = null;
let silencer: WindowsSilencer | null = null;
let recoveryLedger: CrashRecoveryLedger | null = null;
let statsStore: StatsStore | null = null;
let settingsStore: SettingsStore | null = null;
let hotkeyManager: GlobalHotkeyManager | null = null;
let pendingRecoveredVolume: number | null = null;
let isQuitting = false;

function handleGlobalHotkeyTrigger(): void {
  if (!timerEngine) return;
  const current = timerEngine.getSnapshot();
  if (current.state === 'running') {
    timerEngine.pause();
  } else if (current.state === 'paused') {
    timerEngine.resume();
  } else {
    timerEngine.start('focus');
  }
}

async function initSubsystems(): Promise<UserSettings> {
  const ledgerPath = path.join(app.getPath('userData'), 'silencer-session.json');
  recoveryLedger = new CrashRecoveryLedger(ledgerPath);
  silencer = new WindowsSilencer(undefined, recoveryLedger);

  const statsPath = path.join(app.getPath('userData'), 'stats.json');
  statsStore = new StatsStore(statsPath);
  await statsStore.load();

  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  settingsStore = new SettingsStore(settingsPath);
  const settings = await settingsStore.load();

  // Initialize Global Hotkey
  hotkeyManager = new GlobalHotkeyManager();
  hotkeyManager.register(settings.globalHotkey, handleGlobalHotkeyTrigger);

  // Check for crash recovery from an unexpected prior termination
  const recoveryResult = await recoveryLedger.recoverIfNeeded(silencer);
  if (recoveryResult.recovered && recoveryResult.snapshot) {
    pendingRecoveredVolume = recoveryResult.snapshot.volumePercent;
    console.info(
      `[HushLoop] Startup crash recovery: restored system audio to ${pendingRecoveredVolume}%`,
    );
  }

  return settings;
}

function createWindow(settings: UserSettings): void {
  const candidateIconPaths = [
    path.join(process.resourcesPath, 'icon.ico'),
    path.join(process.resourcesPath, 'app.asar.unpacked/dist/icon.ico'),
    path.join(process.resourcesPath, 'app.asar.unpacked/dist/favicon.ico'),
    path.join(app.getAppPath(), 'dist/icon.ico'),
    path.join(app.getAppPath(), 'dist/favicon.ico'),
    path.join(app.getAppPath(), 'build/icon.ico'),
    path.join(__dirname, '../../dist/icon.ico'),
    path.join(__dirname, '../../dist/favicon.ico'),
    path.join(process.resourcesPath, 'dist/icon.ico'),
    path.join(process.resourcesPath, 'dist/favicon.ico'),
  ];
  let appIcon: string | undefined;
  for (const p of candidateIconPaths) {
    if (fs.existsSync(p)) {
      appIcon = p;
      break;
    }
  }

  const candidatePreloadPaths = [
    path.join(__dirname, '../preload/index.cjs'),
    path.join(__dirname, '../preload/index.js'),
    path.join(app.getAppPath(), 'dist-electron/preload/index.cjs'),
    path.join(app.getAppPath(), 'dist-electron/preload/index.js'),
  ];
  let preloadPath = candidatePreloadPaths[0];
  for (const p of candidatePreloadPaths) {
    if (fs.existsSync(p)) {
      preloadPath = p;
      break;
    }
  }

  // Adaptive sizing ensuring window fits comfortably on 1366x768 and smaller laptop displays
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: workWidth, height: workHeight } = primaryDisplay.workAreaSize;
  const initialWidth = Math.min(940, Math.max(760, workWidth - 40));
  const initialHeight = Math.min(660, Math.max(520, workHeight - 40));

  mainWindow = new BrowserWindow({
    width: initialWidth,
    height: initialHeight,
    minWidth: 720,
    minHeight: 480,
    title: 'HushLoop',
    backgroundColor: '#0d1117',
    show: false, // Start hidden to prevent white flashes and guarantee clean DWM display
    center: true,
    frame: false, // Custom frameless glassmorphic header
    autoHideMenuBar: true,
    icon: appIcon,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`[HushLoop] Failed to load URL: ${errorCode} - ${errorDescription}`);
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[HushLoop] Renderer process terminated:', details);
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.info(`[Renderer:L${level}] (${sourceId}:${line}) ${message}`);
  });

  let windowShown = false;
  const showMainWindow = () => {
    if (windowShown || !mainWindow || mainWindow.isDestroyed()) return;
    windowShown = true;
    mainWindow.show();
    mainWindow.focus();
  };

  mainWindow.once('ready-to-show', () => {
    showMainWindow();

    // If crash recovery occurred, alert the renderer UI
    if (pendingRecoveredVolume !== null) {
      mainWindow?.webContents.send('silencer:crash-recovered', pendingRecoveredVolume);
      pendingRecoveredVolume = null;
    }
  });

  // Fallback safety: ensure window is made visible even if ready-to-show event is missed
  setTimeout(() => {
    showMainWindow();
  }, 1000);

  // Handle window close: in production hide to tray if available; in dev, quit so locks aren't retained
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      if (!process.env.VITE_DEV_SERVER_URL && trayManager?.hasTray()) {
        event.preventDefault();
        mainWindow?.hide();
      } else {
        isQuitting = true;
        app.quit();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Initialize Timer Engine with user settings
  timerEngine = new TimerEngine({
    focusDurationMs: settings.focusDurationMinutes * 60 * 1000,
    shortBreakDurationMs: settings.shortBreakDurationMinutes * 60 * 1000,
    longBreakDurationMs: settings.longBreakDurationMinutes * 60 * 1000,
    longBreakInterval: settings.longBreakInterval,
    autoStartBreaks: settings.autoStartBreaks,
    autoStartFocus: settings.autoStartFocus,
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
    // Respects user setting for system silencing
    const currentSettings = settingsStore?.getSettings();
    if (silencer && currentSettings?.systemSilencingEnabled) {
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
        const cur = settingsStore?.getSettings();
        await statsStore.recordFocus(cur?.focusDurationMinutes ?? 25);
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

  // Settings IPC Handlers
  ipcMain.handle('settings:get', async () => {
    return settingsStore?.getSettings();
  });

  ipcMain.handle('settings:update', async (_event, updates: Partial<UserSettings>) => {
    if (!settingsStore) throw new Error('Settings store not ready');
    const updated = await settingsStore.updateSettings(updates);

    // If timer engine is loaded, update durations dynamically
    if (timerEngine) {
      timerEngine.updateConfig({
        focusDurationMs: updated.focusDurationMinutes * 60 * 1000,
        shortBreakDurationMs: updated.shortBreakDurationMinutes * 60 * 1000,
        longBreakDurationMs: updated.longBreakDurationMinutes * 60 * 1000,
        longBreakInterval: updated.longBreakInterval,
        autoStartBreaks: updated.autoStartBreaks,
        autoStartFocus: updated.autoStartFocus,
      });
    }

    // If global hotkey was updated, re-register immediately
    if (updates.globalHotkey && hotkeyManager) {
      hotkeyManager.register(updated.globalHotkey, handleGlobalHotkeyTrigger);
    }

    return updated;
  });

  ipcMain.handle('hotkey:register', async (_event, accelerator: string) => {
    if (!hotkeyManager || !settingsStore) {
      return { success: false, accelerator };
    }
    const success = hotkeyManager.register(accelerator, handleGlobalHotkeyTrigger);
    if (success) {
      await settingsStore.updateSettings({ globalHotkey: accelerator });
    }
    return { success, accelerator: hotkeyManager.getCurrentAccelerator() ?? accelerator };
  });

  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return false;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return false;
    } else {
      mainWindow.maximize();
      return true;
    }
  });

  ipcMain.handle('window:is-maximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });

  ipcMain.handle('window:close-to-tray', () => {
    if (trayManager?.hasTray()) {
      mainWindow?.hide();
    } else {
      isQuitting = true;
      app.quit();
    }
  });

  ipcMain.handle('app:quit', () => {
    isQuitting = true;
    app.quit();
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
    const candidateHtml = [
      path.join(app.getAppPath(), 'dist/index.html'),
      path.join(__dirname, '../../dist/index.html'),
    ];
    let htmlPath = candidateHtml[0];
    for (const p of candidateHtml) {
      if (fs.existsSync(p)) {
        htmlPath = p;
        break;
      }
    }
    mainWindow.loadFile(htmlPath);
  }
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // If user tries to open a second instance, focus, unminimize, and bring window to front
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.setAlwaysOnTop(true);
      mainWindow.focus();
      mainWindow.setAlwaysOnTop(false);
    }
  });

  app.whenReady().then(async () => {
    app.setAppUserModelId('com.hushloop.app');
    let settings: UserSettings;
    try {
      settings = await initSubsystems();
    } catch (err) {
      console.warn('[HushLoop] Subsystem initialization encountered non-fatal error:', err);
      settings = { ...DEFAULT_USER_SETTINGS };
    }
    createWindow(settings);

    app.on('activate', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  }).catch(err => {
    console.error('[HushLoop] Fatal error during app ready:', err);
  });
}

app.on('before-quit', async () => {
  isQuitting = true;
  // Always restore original system volume before application exits
  if (silencer) {
    await silencer.restore();
  }
  hotkeyManager?.destroy();
  timerEngine?.destroy();
  trayManager?.destroy();
});

app.on('window-all-closed', () => {
  // Kept alive in tray unless quitting explicitly or tray unavailable
  if (process.platform !== 'darwin') {
    if (isQuitting || !trayManager?.hasTray()) {
      app.quit();
    }
  }
});
