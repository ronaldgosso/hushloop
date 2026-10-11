import type { PhaseCompleteEvent, TimerPhase, TimerSnapshot } from '../../core/timer/types';
import type { UserSettings } from './settings';

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
  'window:maximize': () => Promise<boolean>;
  'window:is-maximized': () => Promise<boolean>;
  'window:close-to-tray': () => Promise<void>;
  'window:toggle-visibility': () => Promise<void>;
  'app:quit': () => Promise<void>;

  // Silencer Controls
  'silencer:status': () => Promise<{ isSilenced: boolean; currentVolume: number }>;
  'silencer:toggle': (enable: boolean) => Promise<{ success: boolean; isSilenced: boolean }>;

  // Local Daily Stats
  'stats:get-summary': () => Promise<{
    today: {
      date: string;
      focusMinutes: number;
      completedFocusSessions: number;
      completedShortBreaks: number;
      completedLongBreaks: number;
    };
    streakDays: number;
    totalFocusMinutes: number;
    totalCompletedSessions: number;
  }>;

  // Settings Controls
  'settings:get': () => Promise<UserSettings>;
  'settings:update': (settings: Partial<UserSettings>) => Promise<UserSettings>;

  // Global Hotkey
  'hotkey:register': (accelerator: string) => Promise<{ success: boolean; accelerator: string }>;
}

export interface HushLoopAPI {
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

  getStatsSummary: () => Promise<{
    today: {
      date: string;
      focusMinutes: number;
      completedFocusSessions: number;
      completedShortBreaks: number;
      completedLongBreaks: number;
    };
    streakDays: number;
    totalFocusMinutes: number;
    totalCompletedSessions: number;
  }>;

  getSettings: () => Promise<UserSettings>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<UserSettings>;
  registerHotkey: (accelerator: string) => Promise<{ success: boolean; accelerator: string }>;

  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<boolean>;
  isWindowMaximized: () => Promise<boolean>;
  closeToTray: () => Promise<void>;
  quitApp: () => Promise<void>;
  toggleWindowVisibility: () => Promise<void>;
  getAppVersion: () => Promise<string>;
}

