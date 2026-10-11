import { useEffect, useState, useCallback } from 'react';
import type { PhaseCompleteEvent, TimerPhase, TimerSnapshot } from '@shared/types';

const INITIAL_FALLBACK_SNAPSHOT: TimerSnapshot = {
  state: 'idle',
  phase: 'focus',
  remainingMs: 25 * 60 * 1000,
  totalDurationMs: 25 * 60 * 1000,
  elapsedMs: 0,
  completedFocusSessions: 0,
  progressPercent: 0,
  cycleSessionNumber: 1,
};

export function useTimer() {
  const [snapshot, setSnapshot] = useState<TimerSnapshot>(INITIAL_FALLBACK_SNAPSHOT);
  const [lastCompletedPhase, setLastCompletedPhase] = useState<PhaseCompleteEvent | null>(null);

  useEffect(() => {
    const api = window.hushLoopAPI;
    if (!api) return;

    // Fetch authoritative initial snapshot
    api.getSnapshot().then(current => {
      setSnapshot(current);
    });

    // Subscribe to tick events
    const unsubTick = api.onTimerTick(newSnapshot => {
      setSnapshot(newSnapshot);
    });

    // Subscribe to state change events
    const unsubState = api.onStateChange(newSnapshot => {
      setSnapshot(newSnapshot);
    });

    // Subscribe to phase completion
    const unsubComplete = api.onPhaseComplete(event => {
      setLastCompletedPhase(event);
    });

    return () => {
      unsubTick();
      unsubState();
      unsubComplete();
    };
  }, []);

  const start = useCallback((phase?: TimerPhase) => {
    const api = window.hushLoopAPI;
    return api?.startTimer(phase);
  }, []);

  const pause = useCallback(() => {
    const api = window.hushLoopAPI;
    return api?.pauseTimer();
  }, []);

  const resume = useCallback(() => {
    const api = window.hushLoopAPI;
    return api?.resumeTimer();
  }, []);

  const reset = useCallback(() => {
    const api = window.hushLoopAPI;
    return api?.resetTimer();
  }, []);

  const skip = useCallback(() => {
    const api = window.hushLoopAPI;
    return api?.skipTimer();
  }, []);

  return {
    snapshot,
    lastCompletedPhase,
    start,
    pause,
    resume,
    reset,
    skip,
  };
}
