import fs from 'fs/promises';
import path from 'path';
import { StatsTracker, type DailyRecord, type StatsSummary } from '../../core/stats/stats-tracker';

export class StatsStore {
  private readonly filePath: string;
  private readonly tracker: StatsTracker;
  private isLoaded = false;

  constructor(customPath?: string) {
    this.filePath = customPath ?? path.join(process.cwd(), 'stats.json');
    this.tracker = new StatsTracker();
  }

  public async load(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const records = JSON.parse(content) as DailyRecord[];
      if (Array.isArray(records)) {
        this.tracker.importHistory(records);
      }
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('[StatsStore] Could not read existing stats.json, starting fresh:', err);
      }
    }

    this.isLoaded = true;
  }

  public async save(): Promise<void> {
    try {
      const history = this.tracker.exportHistory();
      const data = JSON.stringify(history, null, 2);
      await fs.writeFile(this.filePath, data, 'utf-8');
    } catch (err) {
      console.error('[StatsStore] Failed to write stats to disk:', err);
    }
  }

  public async recordFocus(minutes = 25): Promise<StatsSummary> {
    await this.load();
    this.tracker.recordFocusSession(minutes);
    await this.save();
    return this.tracker.getSummary();
  }

  public async recordBreak(isLongBreak: boolean): Promise<StatsSummary> {
    await this.load();
    this.tracker.recordBreakSession(isLongBreak);
    await this.save();
    return this.tracker.getSummary();
  }

  public async getSummary(): Promise<StatsSummary> {
    await this.load();
    return this.tracker.getSummary();
  }
}
