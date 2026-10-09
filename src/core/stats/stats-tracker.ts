export interface DailyRecord {
  date: string; // 'YYYY-MM-DD'
  focusMinutes: number;
  completedFocusSessions: number;
  completedShortBreaks: number;
  completedLongBreaks: number;
}

export interface StatsSummary {
  today: DailyRecord;
  streakDays: number;
  totalFocusMinutes: number;
  totalCompletedSessions: number;
}

export class StatsTracker {
  private records: Map<string, DailyRecord> = new Map();

  constructor(initialRecords: DailyRecord[] = []) {
    this.importHistory(initialRecords);
  }

  public static formatDate(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public getOrCreateRecord(dateStr = StatsTracker.formatDate()): DailyRecord {
    let record = this.records.get(dateStr);
    if (!record) {
      record = {
        date: dateStr,
        focusMinutes: 0,
        completedFocusSessions: 0,
        completedShortBreaks: 0,
        completedLongBreaks: 0,
      };
      this.records.set(dateStr, record);
    }
    return record;
  }

  public recordFocusSession(durationMinutes = 25, dateStr = StatsTracker.formatDate()): void {
    const record = this.getOrCreateRecord(dateStr);
    record.focusMinutes += Math.max(1, Math.round(durationMinutes));
    record.completedFocusSessions += 1;
  }

  public recordBreakSession(isLongBreak: boolean, dateStr = StatsTracker.formatDate()): void {
    const record = this.getOrCreateRecord(dateStr);
    if (isLongBreak) {
      record.completedLongBreaks += 1;
    } else {
      record.completedShortBreaks += 1;
    }
  }

  public calculateStreak(referenceDate: Date = new Date()): number {
    const sortedDates = Array.from(this.records.values())
      .filter(r => r.completedFocusSessions > 0)
      .map(r => r.date)
      .sort()
      .reverse();

    if (sortedDates.length === 0) return 0;

    const todayStr = StatsTracker.formatDate(referenceDate);
    const yesterday = new Date(referenceDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = StatsTracker.formatDate(yesterday);

    let streak = 0;
    let expectedDate = new Date(referenceDate);

    // If today has sessions, start counting from today.
    // If not, check if yesterday has sessions so the streak is not broken midway through the day.
    const todayRecord = this.records.get(todayStr);
    if (todayRecord && todayRecord.completedFocusSessions > 0) {
      // Start from today
      expectedDate = new Date(referenceDate);
    } else {
      const yesterdayRecord = this.records.get(yesterdayStr);
      if (yesterdayRecord && yesterdayRecord.completedFocusSessions > 0) {
        // Start from yesterday
        expectedDate = yesterday;
      } else {
        return 0; // Streak broken
      }
    }

    while (true) {
      const dateCheckStr = StatsTracker.formatDate(expectedDate);
      const rec = this.records.get(dateCheckStr);
      if (rec && rec.completedFocusSessions > 0) {
        streak += 1;
        // Step back one day
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  public getSummary(referenceDate: Date = new Date()): StatsSummary {
    const todayStr = StatsTracker.formatDate(referenceDate);
    const today = this.getOrCreateRecord(todayStr);

    let totalFocusMinutes = 0;
    let totalCompletedSessions = 0;

    for (const record of this.records.values()) {
      totalFocusMinutes += record.focusMinutes;
      totalCompletedSessions += record.completedFocusSessions;
    }

    return {
      today,
      streakDays: this.calculateStreak(referenceDate),
      totalFocusMinutes,
      totalCompletedSessions,
    };
  }

  public importHistory(records: DailyRecord[]): void {
    this.records.clear();
    for (const r of records) {
      if (r && r.date) {
        this.records.set(r.date, { ...r });
      }
    }
  }

  public exportHistory(): DailyRecord[] {
    return Array.from(this.records.values()).sort((a, b) => a.date.localeCompare(b.date));
  }
}
