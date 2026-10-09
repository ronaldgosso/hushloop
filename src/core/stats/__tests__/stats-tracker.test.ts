import { describe, it, expect } from 'vitest';
import { StatsTracker, type DailyRecord } from '../stats-tracker';

describe('StatsTracker', () => {
  it('initializes with empty records and zeroes', () => {
    const tracker = new StatsTracker();
    const summary = tracker.getSummary();

    expect(summary.today.focusMinutes).toBe(0);
    expect(summary.today.completedFocusSessions).toBe(0);
    expect(summary.streakDays).toBe(0);
    expect(summary.totalFocusMinutes).toBe(0);
    expect(summary.totalCompletedSessions).toBe(0);
  });

  it('records focus sessions and updates today totals', () => {
    const tracker = new StatsTracker();
    tracker.recordFocusSession(25);
    tracker.recordFocusSession(25);

    const summary = tracker.getSummary();
    expect(summary.today.completedFocusSessions).toBe(2);
    expect(summary.today.focusMinutes).toBe(50);
    expect(summary.totalFocusMinutes).toBe(50);
    expect(summary.streakDays).toBe(1);
  });

  it('records short breaks and long breaks', () => {
    const tracker = new StatsTracker();
    tracker.recordBreakSession(false); // short
    tracker.recordBreakSession(true); // long

    const today = tracker.getOrCreateRecord();
    expect(today.completedShortBreaks).toBe(1);
    expect(today.completedLongBreaks).toBe(1);
  });

  describe('Streak Calculation Invariants', () => {
    it('calculates 3-day streak when consecutive days are completed', () => {
      const records: DailyRecord[] = [
        {
          date: '2026-10-07',
          focusMinutes: 50,
          completedFocusSessions: 2,
          completedShortBreaks: 2,
          completedLongBreaks: 0,
        },
        {
          date: '2026-10-08',
          focusMinutes: 75,
          completedFocusSessions: 3,
          completedShortBreaks: 3,
          completedLongBreaks: 0,
        },
        {
          date: '2026-10-09',
          focusMinutes: 25,
          completedFocusSessions: 1,
          completedShortBreaks: 1,
          completedLongBreaks: 0,
        },
      ];

      const tracker = new StatsTracker(records);
      const referenceDate = new Date('2026-10-09T12:00:00');
      expect(tracker.calculateStreak(referenceDate)).toBe(3);
    });

    it('preserves yesterday streak if today has not completed sessions yet', () => {
      const records: DailyRecord[] = [
        {
          date: '2026-10-07',
          focusMinutes: 50,
          completedFocusSessions: 2,
          completedShortBreaks: 2,
          completedLongBreaks: 0,
        },
        {
          date: '2026-10-08',
          focusMinutes: 50,
          completedFocusSessions: 2,
          completedShortBreaks: 2,
          completedLongBreaks: 0,
        },
      ];

      const tracker = new StatsTracker(records);
      // Today is 2026-10-09 with 0 sessions
      const referenceDate = new Date('2026-10-09T08:00:00');
      expect(tracker.calculateStreak(referenceDate)).toBe(2);
    });

    it('resets streak to 0 if a day was skipped', () => {
      const records: DailyRecord[] = [
        {
          date: '2026-10-06',
          focusMinutes: 50,
          completedFocusSessions: 2,
          completedShortBreaks: 0,
          completedLongBreaks: 0,
        },
        // Skipped 2026-10-07 and 2026-10-08!
      ];

      const tracker = new StatsTracker(records);
      const referenceDate = new Date('2026-10-09T08:00:00');
      expect(tracker.calculateStreak(referenceDate)).toBe(0);
    });
  });

  it('exports and re-imports history correctly', () => {
    const tracker1 = new StatsTracker();
    tracker1.recordFocusSession(30, '2026-10-01');
    tracker1.recordFocusSession(25, '2026-10-02');

    const exported = tracker1.exportHistory();
    expect(exported).toHaveLength(2);

    const tracker2 = new StatsTracker(exported);
    expect(tracker2.exportHistory()).toEqual(exported);
  });
});
