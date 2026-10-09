import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TimerEngine } from '../timer-engine';

describe('TimerEngine', () => {
  let currentTime: number;
  const mockClock = () => currentTime;

  beforeEach(() => {
    currentTime = 1_000_000; // Base reference timestamp
  });

  it('initializes with idle snapshot matching config duration', () => {
    const engine = new TimerEngine({ focusDurationMs: 25 * 60 * 1000 }, mockClock);

    const snapshot = engine.getSnapshot();
    expect(snapshot.state).toBe('idle');
    expect(snapshot.phase).toBe('focus');
    expect(snapshot.totalDurationMs).toBe(1_500_000);
    expect(snapshot.remainingMs).toBe(1_500_000);
    expect(snapshot.elapsedMs).toBe(0);
    expect(snapshot.progressPercent).toBe(0);
    expect(snapshot.completedFocusSessions).toBe(0);
  });

  describe('Drift Resistance and Timestamp Math', () => {
    it('accurately calculates elapsed time after large time jumps (laptop sleep / minimize)', () => {
      const engine = new TimerEngine({ focusDurationMs: 25 * 60 * 1000 }, mockClock);

      engine.start();

      // Simulate 10 minutes of elapsed time during Windows sleep/suspension
      currentTime += 10 * 60 * 1000; // +600,000ms

      const snapshot = engine.tick();
      expect(snapshot.elapsedMs).toBe(600_000);
      expect(snapshot.remainingMs).toBe(900_000);
      expect(snapshot.progressPercent).toBe(40);
    });

    it('freezes remaining time during pause even across large simulated time jumps', () => {
      const engine = new TimerEngine({ focusDurationMs: 25 * 60 * 1000 }, mockClock);

      engine.start();

      // 5 minutes of focus
      currentTime += 5 * 60 * 1000;
      engine.pause();

      const pausedSnapshot = engine.getSnapshot();
      expect(pausedSnapshot.state).toBe('paused');
      expect(pausedSnapshot.elapsedMs).toBe(300_000);
      expect(pausedSnapshot.remainingMs).toBe(1_200_000);

      // System stays paused for 30 minutes
      currentTime += 30 * 60 * 1000;

      const stillPausedSnapshot = engine.getSnapshot();
      expect(stillPausedSnapshot.remainingMs).toBe(1_200_000);
      expect(stillPausedSnapshot.elapsedMs).toBe(300_000);

      // Resume timer
      engine.resume();

      // Run for another 5 active minutes
      currentTime += 5 * 60 * 1000;
      const resumedSnapshot = engine.getSnapshot();
      expect(resumedSnapshot.elapsedMs).toBe(600_000);
      expect(resumedSnapshot.remainingMs).toBe(900_000);
      expect(resumedSnapshot.progressPercent).toBe(40);
    });
  });

  describe('Phase Completion and Listener Dispatch', () => {
    it('triggers onPhaseComplete listener when remaining time reaches zero', () => {
      const engine = new TimerEngine({ focusDurationMs: 25 * 60 * 1000 }, mockClock);

      const completeListener = vi.fn();
      engine.onPhaseComplete(completeListener);

      engine.start();

      // Advance clock to completion
      currentTime += 25 * 60 * 1000;

      const completionSnapshot = engine.tick();

      expect(completeListener).toHaveBeenCalledTimes(1);
      expect(completeListener).toHaveBeenCalledWith(
        expect.objectContaining({
          completedPhase: 'focus',
          nextPhase: 'short_break',
          completedFocusSessions: 1,
        }),
      );

      expect(completionSnapshot.state).toBe('idle');
      expect(completionSnapshot.phase).toBe('short_break');
      expect(completionSnapshot.completedFocusSessions).toBe(1);
    });

    it('notifies onTick and onStateChange listeners', () => {
      const engine = new TimerEngine({ focusDurationMs: 1000 }, mockClock);

      const tickListener = vi.fn();
      const stateChangeListener = vi.fn();

      const unsubTick = engine.onTick(tickListener);
      const unsubState = engine.onStateChange(stateChangeListener);

      engine.start();
      expect(stateChangeListener).toHaveBeenCalledWith(
        expect.objectContaining({ state: 'running' }),
      );

      currentTime += 500;
      engine.tick();
      expect(tickListener).toHaveBeenCalledWith(expect.objectContaining({ remainingMs: 500 }));

      // Unsubscribe and verify no further calls
      unsubTick();
      unsubState();

      currentTime += 200;
      engine.tick();
      expect(tickListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Reset, Skip, and Destroy', () => {
    it('resets timer back to idle and initial duration', () => {
      const engine = new TimerEngine({ focusDurationMs: 1500000 }, mockClock);

      engine.start();
      currentTime += 50000;
      const resetSnapshot = engine.reset();

      expect(resetSnapshot.state).toBe('idle');
      expect(resetSnapshot.phase).toBe('focus');
      expect(resetSnapshot.remainingMs).toBe(1500000);
      expect(resetSnapshot.elapsedMs).toBe(0);
    });

    it('skips to next phase and stops running', () => {
      const engine = new TimerEngine(
        { focusDurationMs: 1500000, shortBreakDurationMs: 300000 },
        mockClock,
      );

      engine.start();
      currentTime += 10000;
      const skippedSnapshot = engine.skip();

      expect(skippedSnapshot.state).toBe('idle');
      expect(skippedSnapshot.phase).toBe('short_break');
      expect(skippedSnapshot.remainingMs).toBe(300000);
      expect(skippedSnapshot.completedFocusSessions).toBe(1);
    });

    it('cleans up interval ticker and listeners on destroy()', () => {
      const engine = new TimerEngine({}, mockClock);
      const tickListener = vi.fn();
      engine.onTick(tickListener);
      engine.start();

      engine.destroy();

      currentTime += 1000;
      engine.tick();
      expect(tickListener).not.toHaveBeenCalled();
    });

    it('handles phase complete unsubscription and duplicate ticker starts', () => {
      const engine = new TimerEngine({ focusDurationMs: 1000 }, mockClock);
      const phaseListener = vi.fn();
      const unsub = engine.onPhaseComplete(phaseListener);

      // Duplicate startTicker should be a no-op
      engine.startTicker();
      engine.startTicker();

      unsub();

      engine.start();
      currentTime += 1000;
      engine.tick();

      expect(phaseListener).not.toHaveBeenCalled();
      engine.destroy();
    });

    it('auto-starts next phase when configured in autoStartBreaks', () => {
      const engine = new TimerEngine(
        {
          focusDurationMs: 1000,
          shortBreakDurationMs: 500,
          autoStartBreaks: true,
        },
        mockClock,
      );

      engine.start();
      currentTime += 1000;
      const nextSnapshot = engine.tick();

      expect(nextSnapshot.state).toBe('running');
      expect(nextSnapshot.phase).toBe('short_break');
      expect(nextSnapshot.remainingMs).toBe(500);

      engine.destroy();
    });

    it('updates config and refreshes idle snapshot immediately', () => {
      let currentTime = 100000;
      const mockClock = () => currentTime;
      const engine = new TimerEngine({ focusDurationMs: 25 * 60 * 1000 }, mockClock);

      expect(engine.getSnapshot().remainingMs).toBe(25 * 60 * 1000);

      const updatedSnapshot = engine.updateConfig({ focusDurationMs: 45 * 60 * 1000 });
      expect(updatedSnapshot.remainingMs).toBe(45 * 60 * 1000);
      expect(updatedSnapshot.totalDurationMs).toBe(45 * 60 * 1000);

      engine.destroy();
    });
  });
});
