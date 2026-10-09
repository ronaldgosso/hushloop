export type TimerState = 'idle' | 'running' | 'paused';
export type TimerPhase = 'focus' | 'short_break' | 'long_break';

export interface TimerConfig {
  focusDurationMs: number;
  shortBreakDurationMs: number;
  longBreakDurationMs: number;
  longBreakInterval: number; // Number of focus sessions before a long break (default: 4)
  autoStartBreaks?: boolean;
  autoStartFocus?: boolean;
}

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  focusDurationMs: 25 * 60 * 1000, // 25 minutes
  shortBreakDurationMs: 5 * 60 * 1000, // 5 minutes
  longBreakDurationMs: 15 * 60 * 1000, // 15 minutes
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
};

export interface TimerSnapshot {
  state: TimerState;
  phase: TimerPhase;
  remainingMs: number;
  totalDurationMs: number;
  elapsedMs: number;
  completedFocusSessions: number;
  progressPercent: number; // 0 to 100
  cycleSessionNumber: number; // 1 to longBreakInterval
}

export interface PhaseCompleteEvent {
  completedPhase: TimerPhase;
  nextPhase: TimerPhase;
  completedFocusSessions: number;
  timestamp: number;
}

export class InvalidTransitionError extends Error {
  readonly fromState: TimerState;
  readonly action: string;

  constructor(fromState: TimerState, action: string, reason?: string) {
    const detail = reason ? `: ${reason}` : '';
    super(`Cannot execute '${action}' from state '${fromState}'${detail}`);
    this.name = 'InvalidTransitionError';
    this.fromState = fromState;
    this.action = action;
  }
}
