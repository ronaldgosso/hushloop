import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { TimerEngine } from '../core/timer/timer-engine';
import { TrayManager } from './tray';
import type { TimerPhase } from '../shared/types';

let mainWindow: BrowserWindow | null = null;
let trayManager: TrayManager | null = null;
let timerEngine: TimerEngine | null = null;
let isQuitting = false;

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

  // Broadcast timer events to renderer and update tray
  timerEngine.onTick(snapshot => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('timer:tick', snapshot);
    }
    trayManager?.update(snapshot);
  });

  timerEngine.onStateChange(snapshot => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('timer:state-change', snapshot);
    }
    trayManager?.update(snapshot);
  });

  timerEngine.onPhaseComplete(event => {
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

app.whenReady().then(() => {
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

app.on('before-quit', () => {
  isQuitting = true;
  timerEngine?.destroy();
  trayManager?.destroy();
});

app.on('window-all-closed', () => {
  // Kept alive in tray unless quitting explicitly
  if (process.platform !== 'darwin' && isQuitting) {
    app.quit();
  }
});
