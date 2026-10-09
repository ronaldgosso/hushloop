import {
  DEFAULT_TIMER_CONFIG,
  InvalidTransitionError,
  type PhaseCompleteEvent,
  type TimerConfig,
  type TimerPhase,
  type TimerState,
} from './types';

export class TimerStateMachine {
  private currentState: TimerState = 'idle';
  private currentPhase: TimerPhase = 'focus';
  private completedFocusSessions = 0;
  private config: TimerConfig;

  constructor(config: Partial<TimerConfig> = {}) {
    this.config = { ...DEFAULT_TIMER_CONFIG, ...config };
  }

  public updateConfig(updates: Partial<TimerConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public getState(): TimerState {
    return this.currentState;
  }

  public getPhase(): TimerPhase {
    return this.currentPhase;
  }

  public getCompletedSessions(): number {
    return this.completedFocusSessions;
  }

  public getConfig(): Readonly<TimerConfig> {
    return this.config;
  }

  public getCycleSessionNumber(): number {
    const cycle = (this.completedFocusSessions % this.config.longBreakInterval) + 1;
    return cycle;
  }

  public getNextPhase(): TimerPhase {
    if (this.currentPhase === 'focus') {
      const nextCompleted = this.completedFocusSessions + 1;
      return nextCompleted % this.config.longBreakInterval === 0 ? 'long_break' : 'short_break';
    }
    return 'focus';
  }

  public start(targetPhase?: TimerPhase): void {
    if (this.currentState === 'running') {
      throw new InvalidTransitionError('running', 'start', 'Timer is already running');
    }
    if (this.currentState === 'paused') {
      throw new InvalidTransitionError(
        'paused',
        'start',
        'Timer is paused; call resume() to continue or reset() to restart',
      );
    }

    if (targetPhase) {
      this.currentPhase = targetPhase;
    }
    this.currentState = 'running';
  }

  public pause(): void {
    if (this.currentState === 'idle') {
      throw new InvalidTransitionError('idle', 'pause', 'Cannot pause an idle timer');
    }
    if (this.currentState === 'paused') {
      throw new InvalidTransitionError('paused', 'pause', 'Timer is already paused');
    }

    this.currentState = 'paused';
  }

  public resume(): void {
    if (this.currentState === 'idle') {
      throw new InvalidTransitionError(
        'idle',
        'resume',
        'Cannot resume an idle timer; call start() instead',
      );
    }
    if (this.currentState === 'running') {
      throw new InvalidTransitionError('running', 'resume', 'Timer is already running');
    }

    this.currentState = 'running';
  }

  public reset(): void {
    this.currentState = 'idle';
    this.currentPhase = 'focus';
  }

  public skip(): { previousPhase: TimerPhase; nextPhase: TimerPhase } {
    const previous = this.currentPhase;
    const next = this.getNextPhase();

    if (previous === 'focus') {
      this.completedFocusSessions += 1;
    }

    this.currentPhase = next;
    this.currentState = 'idle';

    return { previousPhase: previous, nextPhase: next };
  }

  public completeCurrentPhase(timestamp = Date.now()): PhaseCompleteEvent {
    if (this.currentState !== 'running') {
      throw new InvalidTransitionError(
        this.currentState,
        'completeCurrentPhase',
        'Only a running session can complete',
      );
    }

    const completed = this.currentPhase;
    let next: TimerPhase;

    if (completed === 'focus') {
      this.completedFocusSessions += 1;
      next =
        this.completedFocusSessions % this.config.longBreakInterval === 0
          ? 'long_break'
          : 'short_break';
    } else {
      next = 'focus';
    }

    this.currentPhase = next;

    // Determine if auto-start applies
    const shouldAutoStart =
      (next === 'focus' && this.config.autoStartFocus) ||
      ((next === 'short_break' || next === 'long_break') && this.config.autoStartBreaks);

    this.currentState = shouldAutoStart ? 'running' : 'idle';

    return {
      completedPhase: completed,
      nextPhase: next,
      completedFocusSessions: this.completedFocusSessions,
      timestamp,
    };
  }

  public getPhaseDurationMs(phase = this.currentPhase): number {
    switch (phase) {
      case 'focus':
        return this.config.focusDurationMs;
      case 'short_break':
        return this.config.shortBreakDurationMs;
      case 'long_break':
        return this.config.longBreakDurationMs;
    }
  }
}
