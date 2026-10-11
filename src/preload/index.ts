import { contextBridge, ipcRenderer } from 'electron';
import type { HushLoopAPI } from '../shared/types/ipc';
import type { PhaseCompleteEvent, TimerPhase, TimerSnapshot } from '../shared/types';

const api: HushLoopAPI = {
  startTimer: (phase?: TimerPhase) => ipcRenderer.invoke('timer:start', phase),
  pauseTimer: () => ipcRenderer.invoke('timer:pause'),
  resumeTimer: () => ipcRenderer.invoke('timer:resume'),
  resetTimer: () => ipcRenderer.invoke('timer:reset'),
  skipTimer: () => ipcRenderer.invoke('timer:skip'),
  getSnapshot: () => ipcRenderer.invoke('timer:get-snapshot'),

  onTimerTick: (callback: (snapshot: TimerSnapshot) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, snapshot: TimerSnapshot) => {
      callback(snapshot);
    };
    ipcRenderer.on('timer:tick', handler);
    return () => {
      ipcRenderer.removeListener('timer:tick', handler);
    };
  },

  onStateChange: (callback: (snapshot: TimerSnapshot) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, snapshot: TimerSnapshot) => {
      callback(snapshot);
    };
    ipcRenderer.on('timer:state-change', handler);
    return () => {
      ipcRenderer.removeListener('timer:state-change', handler);
    };
  },

  onPhaseComplete: (callback: (event: PhaseCompleteEvent) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, eventData: PhaseCompleteEvent) => {
      callback(eventData);
    };
    ipcRenderer.on('timer:phase-complete', handler);
    return () => {
      ipcRenderer.removeListener('timer:phase-complete', handler);
    };
  },

  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  isWindowMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  closeToTray: () => ipcRenderer.invoke('window:close-to-tray'),
  quitApp: () => ipcRenderer.invoke('app:quit'),
  toggleWindowVisibility: () => ipcRenderer.invoke('window:toggle-visibility'),
  getAppVersion: () => ipcRenderer.invoke('app:version'),

  onCrashRecovery: (callback: (recoveredVolume: number) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, recoveredVolume: number) => {
      callback(recoveredVolume);
    };
    ipcRenderer.on('silencer:crash-recovered', handler);
    return () => {
      ipcRenderer.removeListener('silencer:crash-recovered', handler);
    };
  },

  getSilencerStatus: () => ipcRenderer.invoke('silencer:status'),
  toggleSilencer: (enable: boolean) => ipcRenderer.invoke('silencer:toggle', enable),
  getStatsSummary: () => ipcRenderer.invoke('stats:get-summary'),

  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: Partial<import('../shared/types/settings').UserSettings>) =>
    ipcRenderer.invoke('settings:update', settings),
  registerHotkey: (accelerator: string) => ipcRenderer.invoke('hotkey:register', accelerator),
};

contextBridge.exposeInMainWorld('hushLoopAPI', api);
