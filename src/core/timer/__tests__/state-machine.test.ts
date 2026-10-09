import { describe, it, expect } from 'vitest';
import { TimerStateMachine, InvalidTransitionError, DEFAULT_TIMER_CONFIG } from '../index';

describe('TimerStateMachine', () => {
  it('initializes with default configuration, idle state, and focus phase', () => {
    const machine = new TimerStateMachine();

    expect(machine.getState()).toBe('idle');
    expect(machine.getPhase()).toBe('focus');
    expect(machine.getCompletedSessions()).toBe(0);
    expect(machine.getCycleSessionNumber()).toBe(1);
    expect(machine.getConfig()).toEqual(DEFAULT_TIMER_CONFIG);
  });

  describe('Valid State Transitions', () => {
    it('transitions idle -> running when start() is called', () => {
      const machine = new TimerStateMachine();
      machine.start();
      expect(machine.getState()).toBe('running');
    });

    it('transitions running -> paused when pause() is called', () => {
      const machine = new TimerStateMachine();
      machine.start();
      machine.pause();
      expect(machine.getState()).toBe('paused');
    });

    it('transitions paused -> running when resume() is called', () => {
      const machine = new TimerStateMachine();
      machine.start();
      machine.pause();
      machine.resume();
      expect(machine.getState()).toBe('running');
    });

    it('transitions running -> idle and resets phase when reset() is called', () => {
      const machine = new TimerStateMachine();
      machine.start('short_break');
      expect(machine.getPhase()).toBe('short_break');
      machine.reset();
      expect(machine.getState()).toBe('idle');
      expect(machine.getPhase()).toBe('focus');
    });

    it('transitions paused -> idle when reset() is called', () => {
      const machine = new TimerStateMachine();
      machine.start();
      machine.pause();
      machine.reset();
      expect(machine.getState()).toBe('idle');
      expect(machine.getPhase()).toBe('focus');
    });
  });

  describe('Invalid Transition Rejections', () => {
    it('rejects pause() when idle', () => {
      const machine = new TimerStateMachine();
      expect(() => machine.pause()).toThrow(InvalidTransitionError);
      expect(() => machine.pause()).toThrow("Cannot execute 'pause' from state 'idle'");
    });

    it('rejects pause() when already paused', () => {
      const machine = new TimerStateMachine();
      machine.start();
      machine.pause();
      expect(() => machine.pause()).toThrow(InvalidTransitionError);
      expect(() => machine.pause()).toThrow("Cannot execute 'pause' from state 'paused'");
    });

    it('rejects resume() when idle', () => {
      const machine = new TimerStateMachine();
      expect(() => machine.resume()).toThrow(InvalidTransitionError);
      expect(() => machine.resume()).toThrow("Cannot execute 'resume' from state 'idle'");
    });

    it('rejects resume() when already running', () => {
      const machine = new TimerStateMachine();
      machine.start();
      expect(() => machine.resume()).toThrow(InvalidTransitionError);
      expect(() => machine.resume()).toThrow("Cannot execute 'resume' from state 'running'");
    });

    it('rejects start() when already running', () => {
      const machine = new TimerStateMachine();
      machine.start();
      expect(() => machine.start()).toThrow(InvalidTransitionError);
      expect(() => machine.start()).toThrow("Cannot execute 'start' from state 'running'");
    });

    it('rejects start() when paused', () => {
      const machine = new TimerStateMachine();
      machine.start();
      machine.pause();
      expect(() => machine.start()).toThrow(InvalidTransitionError);
      expect(() => machine.start()).toThrow("Cannot execute 'start' from state 'paused'");
    });

    it('rejects completeCurrentPhase() when not in running state', () => {
      const machine = new TimerStateMachine();
      expect(() => machine.completeCurrentPhase()).toThrow(InvalidTransitionError);
    });
  });

  describe('Pomodoro Phase Cycle & Long Break Calculation', () => {
    it('advances through 4 focus sessions with 3 short breaks and 1 long break', () => {
      const machine = new TimerStateMachine({ longBreakInterval: 4 });

      // Session 1: Focus
      machine.start();
      expect(machine.getPhase()).toBe('focus');
      expect(machine.getNextPhase()).toBe('short_break');
      const event1 = machine.completeCurrentPhase();
      expect(event1.completedPhase).toBe('focus');
      expect(event1.nextPhase).toBe('short_break');
      expect(event1.completedFocusSessions).toBe(1);
      expect(machine.getPhase()).toBe('short_break');
      expect(machine.getState()).toBe('idle');

      // Break 1: Short Break
      machine.start();
      expect(machine.getNextPhase()).toBe('focus');
      const event2 = machine.completeCurrentPhase();
      expect(event2.completedPhase).toBe('short_break');
      expect(event2.nextPhase).toBe('focus');

      // Session 2: Focus
      machine.start();
      machine.completeCurrentPhase();
      expect(machine.getCompletedSessions()).toBe(2);
      machine.start();
      machine.completeCurrentPhase(); // Break 2

      // Session 3: Focus
      machine.start();
      machine.completeCurrentPhase();
      expect(machine.getCompletedSessions()).toBe(3);
      machine.start();
      machine.completeCurrentPhase(); // Break 3

      // Session 4: Focus -> triggers LONG break!
      machine.start();
      expect(machine.getNextPhase()).toBe('long_break');
      const event4 = machine.completeCurrentPhase();
      expect(event4.completedPhase).toBe('focus');
      expect(event4.nextPhase).toBe('long_break');
      expect(event4.completedFocusSessions).toBe(4);
      expect(machine.getPhase()).toBe('long_break');

      // Long Break finishes -> returns to focus
      machine.start();
      expect(machine.getNextPhase()).toBe('focus');
      const event5 = machine.completeCurrentPhase();
      expect(event5.completedPhase).toBe('long_break');
      expect(event5.nextPhase).toBe('focus');
    });

    it('supports autoStartBreaks and autoStartFocus options', () => {
      const machine = new TimerStateMachine({
        autoStartBreaks: true,
        autoStartFocus: true,
      });

      machine.start(); // focus
      machine.completeCurrentPhase(); // short break starts automatically
      expect(machine.getState()).toBe('running');
      expect(machine.getPhase()).toBe('short_break');

      machine.completeCurrentPhase(); // next focus starts automatically
      expect(machine.getState()).toBe('running');
      expect(machine.getPhase()).toBe('focus');
    });

    it('skips current phase properly', () => {
      const machine = new TimerStateMachine();
      expect(machine.getPhase()).toBe('focus');

      const skipped = machine.skip();
      expect(skipped.previousPhase).toBe('focus');
      expect(skipped.nextPhase).toBe('short_break');
      expect(machine.getCompletedSessions()).toBe(1);
      expect(machine.getPhase()).toBe('short_break');
      expect(machine.getState()).toBe('idle');

      const skippedBreak = machine.skip();
      expect(skippedBreak.previousPhase).toBe('short_break');
      expect(skippedBreak.nextPhase).toBe('focus');
      expect(machine.getPhase()).toBe('focus');
    });

    it('returns correct phase durations based on config', () => {
      const machine = new TimerStateMachine({
        focusDurationMs: 1500000,
        shortBreakDurationMs: 300000,
        longBreakDurationMs: 900000,
      });

      expect(machine.getPhaseDurationMs('focus')).toBe(1500000);
      expect(machine.getPhaseDurationMs('short_break')).toBe(300000);
      expect(machine.getPhaseDurationMs('long_break')).toBe(900000);
    });

    it('dynamically updates config via updateConfig', () => {
      const machine = new TimerStateMachine();
      expect(machine.getPhaseDurationMs('focus')).toBe(25 * 60 * 1000);

      machine.updateConfig({ focusDurationMs: 50 * 60 * 1000, longBreakInterval: 6 });
      expect(machine.getPhaseDurationMs('focus')).toBe(50 * 60 * 1000);
      expect(machine.getConfig().longBreakInterval).toBe(6);
    });
  });
});
