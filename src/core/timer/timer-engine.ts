import { TimerStateMachine } from './state-machine';
import {
  type PhaseCompleteEvent,
  type TimerConfig,
  type TimerPhase,
  type TimerSnapshot,
} from './types';

export type TickListener = (snapshot: TimerSnapshot) => void;
export type StateChangeListener = (snapshot: TimerSnapshot) => void;
export type PhaseCompleteListener = (event: PhaseCompleteEvent) => void;

export class TimerEngine {
  private readonly stateMachine: TimerStateMachine;
  private readonly clock: () => number;

  private startTime: number | null = null;
  private pauseStartTime: number | null = null;
  private totalPausedDurationMs = 0;
  private targetDurationMs = 0;

  private tickIntervalId: NodeJS.Timeout | null = null;

  private readonly tickListeners = new Set<TickListener>();
  private readonly stateChangeListeners = new Set<StateChangeListener>();
  private readonly phaseCompleteListeners = new Set<PhaseCompleteListener>();

  constructor(config?: Partial<TimerConfig>, clockFn?: () => number) {
    this.stateMachine = new TimerStateMachine(config);
    this.clock = clockFn ?? (() => Date.now());
    this.targetDurationMs = this.stateMachine.getPhaseDurationMs();
  }

  public getSnapshot(now = this.clock()): TimerSnapshot {
    const state = this.stateMachine.getState();
    const phase = this.stateMachine.getPhase();
    const totalDurationMs = this.targetDurationMs;

    let elapsedMs = 0;
    let remainingMs = totalDurationMs;

    if (state === 'running' && this.startTime !== null) {
      elapsedMs = Math.max(0, now - this.startTime - this.totalPausedDurationMs);
      remainingMs = Math.max(0, totalDurationMs - elapsedMs);
    } else if (state === 'paused' && this.startTime !== null && this.pauseStartTime !== null) {
      elapsedMs = Math.max(0, this.pauseStartTime - this.startTime - this.totalPausedDurationMs);
      remainingMs = Math.max(0, totalDurationMs - elapsedMs);
    }

    const progressPercent =
      totalDurationMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100)) : 0;

    return {
      state,
      phase,
      remainingMs,
      totalDurationMs,
      elapsedMs,
      completedFocusSessions: this.stateMachine.getCompletedSessions(),
      progressPercent: Number(progressPercent.toFixed(2)),
      cycleSessionNumber: this.stateMachine.getCycleSessionNumber(),
    };
  }

  public start(targetPhase?: TimerPhase): TimerSnapshot {
    const now = this.clock();
    this.stateMachine.start(targetPhase);
    this.targetDurationMs = this.stateMachine.getPhaseDurationMs();
    this.startTime = now;
    this.pauseStartTime = null;
    this.totalPausedDurationMs = 0;

    this.startTicker();
    const snapshot = this.getSnapshot(now);
    this.emitStateChange(snapshot);
    return snapshot;
  }

  public pause(): TimerSnapshot {
    const now = this.clock();
    this.stateMachine.pause();
    this.pauseStartTime = now;

    this.stopTicker();
    const snapshot = this.getSnapshot(now);
    this.emitStateChange(snapshot);
    return snapshot;
  }

  public resume(): TimerSnapshot {
    const now = this.clock();
    this.stateMachine.resume();

    if (this.pauseStartTime !== null) {
      this.totalPausedDurationMs += Math.max(0, now - this.pauseStartTime);
      this.pauseStartTime = null;
    }

    this.startTicker();
    const snapshot = this.getSnapshot(now);
    this.emitStateChange(snapshot);
    return snapshot;
  }

  public reset(): TimerSnapshot {
    this.stopTicker();
    this.stateMachine.reset();
    this.startTime = null;
    this.pauseStartTime = null;
    this.totalPausedDurationMs = 0;
    this.targetDurationMs = this.stateMachine.getPhaseDurationMs();

    const snapshot = this.getSnapshot();
    this.emitStateChange(snapshot);
    return snapshot;
  }

  public skip(): TimerSnapshot {
    this.stopTicker();
    this.stateMachine.skip();
    this.startTime = null;
    this.pauseStartTime = null;
    this.totalPausedDurationMs = 0;
    this.targetDurationMs = this.stateMachine.getPhaseDurationMs();

    const snapshot = this.getSnapshot();
    this.emitStateChange(snapshot);
    return snapshot;
  }

  public tick(forcedNow?: number): TimerSnapshot {
    const now = forcedNow ?? this.clock();
    const snapshot = this.getSnapshot(now);

    if (snapshot.state === 'running' && snapshot.remainingMs === 0) {
      return this.handlePhaseCompletion(now);
    }

    this.emitTick(snapshot);
    return snapshot;
  }

  private handlePhaseCompletion(now: number): TimerSnapshot {
    const completeEvent = this.stateMachine.completeCurrentPhase(now);
    this.emitPhaseComplete(completeEvent);

    if (this.stateMachine.getState() === 'running') {
      // Auto-started next phase
      this.targetDurationMs = this.stateMachine.getPhaseDurationMs();
      this.startTime = now;
      this.pauseStartTime = null;
      this.totalPausedDurationMs = 0;
    } else {
      // Transitioned to idle
      this.stopTicker();
      this.startTime = null;
      this.pauseStartTime = null;
      this.totalPausedDurationMs = 0;
      this.targetDurationMs = this.stateMachine.getPhaseDurationMs();
    }

    const nextSnapshot = this.getSnapshot(now);
    this.emitStateChange(nextSnapshot);
    return nextSnapshot;
  }

  public startTicker(intervalMs = 1000): void {
    if (this.tickIntervalId !== null) return;
    this.tickIntervalId = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  public stopTicker(): void {
    if (this.tickIntervalId !== null) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
  }

  public onTick(listener: TickListener): () => void {
    this.tickListeners.add(listener);
    return () => {
      this.tickListeners.delete(listener);
    };
  }

  public onStateChange(listener: StateChangeListener): () => void {
    this.stateChangeListeners.add(listener);
    return () => {
      this.stateChangeListeners.delete(listener);
    };
  }

  public onPhaseComplete(listener: PhaseCompleteListener): () => void {
    this.phaseCompleteListeners.add(listener);
    return () => {
      this.phaseCompleteListeners.delete(listener);
    };
  }

  private emitTick(snapshot: TimerSnapshot): void {
    for (const listener of this.tickListeners) {
      listener(snapshot);
    }
  }

  private emitStateChange(snapshot: TimerSnapshot): void {
    for (const listener of this.stateChangeListeners) {
      listener(snapshot);
    }
  }

  private emitPhaseComplete(event: PhaseCompleteEvent): void {
    for (const listener of this.phaseCompleteListeners) {
      listener(event);
    }
  }

  public destroy(): void {
    this.stopTicker();
    this.tickListeners.clear();
    this.stateChangeListeners.clear();
    this.phaseCompleteListeners.clear();
  }
}
