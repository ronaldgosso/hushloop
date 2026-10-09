import type { PhaseCompleteEvent, TimerPhase, TimerSnapshot } from '../../core/timer/types';

export interface IPCChannels {
  // Timer Invocation Channels (Renderer -> Main)
  'timer:start': (phase?: TimerPhase) => Promise<TimerSnapshot>;
  'timer:pause': () => Promise<TimerSnapshot>;
  'timer:resume': () => Promise<TimerSnapshot>;
  'timer:reset': () => Promise<TimerSnapshot>;
  'timer:skip': () => Promise<TimerSnapshot>;
  'timer:get-snapshot': () => Promise<TimerSnapshot>;

  // Window Controls
  'window:minimize': () => Promise<void>;
  'window:close-to-tray': () => Promise<void>;
  'window:toggle-visibility': () => Promise<void>;

  // Silencer Controls
  'silencer:status': () => Promise<{ isSilenced: boolean; currentVolume: number }>;
  'silencer:toggle': (enable: boolean) => Promise<{ success: boolean; isSilenced: boolean }>;
}

export interface FocusDeckAPI {
  startTimer: (phase?: TimerPhase) => Promise<TimerSnapshot>;
  pauseTimer: () => Promise<TimerSnapshot>;
  resumeTimer: () => Promise<TimerSnapshot>;
  resetTimer: () => Promise<TimerSnapshot>;
  skipTimer: () => Promise<TimerSnapshot>;
  getSnapshot: () => Promise<TimerSnapshot>;

  onTimerTick: (callback: (snapshot: TimerSnapshot) => void) => () => void;
  onStateChange: (callback: (snapshot: TimerSnapshot) => void) => () => void;
  onPhaseComplete: (callback: (event: PhaseCompleteEvent) => void) => () => void;
  onCrashRecovery: (callback: (recoveredVolume: number) => void) => () => void;

  getSilencerStatus: () => Promise<{ isSilenced: boolean; currentVolume: number }>;
  toggleSilencer: (enable: boolean) => Promise<{ success: boolean; isSilenced: boolean }>;

  minimizeWindow: () => Promise<void>;
  closeToTray: () => Promise<void>;
  toggleWindowVisibility: () => Promise<void>;
  getAppVersion: () => Promise<string>;
}
