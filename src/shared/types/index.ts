export type TimerState = 'idle' | 'running' | 'paused';
export type TimerPhase = 'focus' | 'short_break' | 'long_break';

export interface TimerConfig {
  focusDurationMs: number;
  shortBreakDurationMs: number;
  longBreakDurationMs: number;
  longBreakInterval: number; // e.g. every 4 focus sessions
}

export interface TimerSnapshot {
  state: TimerState;
  phase: TimerPhase;
  remainingMs: number;
  totalDurationMs: number;
  elapsedMs: number;
  completedFocusSessions: number;
  progressPercent: number; // 0 - 100
}
