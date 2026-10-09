import { contextBridge, ipcRenderer } from 'electron';
import type { TimerSnapshot } from '../shared/types';

export interface FocusDeckAPI {
  getAppVersion: () => Promise<string>;
  onTimerTick: (callback: (snapshot: TimerSnapshot) => void) => () => void;
}

const api: FocusDeckAPI = {
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  onTimerTick: (callback: (snapshot: TimerSnapshot) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, snapshot: TimerSnapshot) => {
      callback(snapshot);
    };
    ipcRenderer.on('timer:tick', subscription);
    return () => {
      ipcRenderer.removeListener('timer:tick', subscription);
    };
  },
};

contextBridge.exposeInMainWorld('focusDeckAPI', api);
