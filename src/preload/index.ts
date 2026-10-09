import { contextBridge, ipcRenderer } from 'electron';
import type { FocusDeckAPI } from '../shared/types/ipc';
import type { PhaseCompleteEvent, TimerPhase, TimerSnapshot } from '../shared/types';

const api: FocusDeckAPI = {
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
  closeToTray: () => ipcRenderer.invoke('window:close-to-tray'),
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
};

contextBridge.exposeInMainWorld('focusDeckAPI', api);
