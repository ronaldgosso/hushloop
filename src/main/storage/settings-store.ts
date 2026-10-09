import fs from 'fs/promises';
import path from 'path';
import { DEFAULT_USER_SETTINGS, type UserSettings } from '../../shared/types/settings';

export class SettingsStore {
  private readonly filePath: string;
  private settings: UserSettings;
  private isLoaded = false;

  constructor(customPath?: string) {
    this.filePath = customPath ?? path.join(process.cwd(), 'settings.json');
    this.settings = { ...DEFAULT_USER_SETTINGS };
  }

  public async load(): Promise<UserSettings> {
    if (this.isLoaded) return this.settings;

    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(content) as Partial<UserSettings>;
      this.settings = this.sanitizeSettings(parsed);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('[SettingsStore] Could not read settings file, using defaults:', err);
      }
      this.settings = { ...DEFAULT_USER_SETTINGS };
    }

    this.isLoaded = true;
    return this.settings;
  }

  public async save(): Promise<void> {
    try {
      const data = JSON.stringify(this.settings, null, 2);
      await fs.writeFile(this.filePath, data, 'utf-8');
    } catch (err) {
      console.error('[SettingsStore] Failed to write settings to disk:', err);
    }
  }

  public getSettings(): UserSettings {
    return { ...this.settings };
  }

  public async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    await this.load();
    this.settings = this.sanitizeSettings({ ...this.settings, ...updates });
    await this.save();
    return { ...this.settings };
  }

  private sanitizeSettings(input: Partial<UserSettings>): UserSettings {
    const focus = Math.max(
      1,
      Math.min(
        180,
        Number(input.focusDurationMinutes) || DEFAULT_USER_SETTINGS.focusDurationMinutes,
      ),
    );
    const shortBreak = Math.max(
      1,
      Math.min(
        60,
        Number(input.shortBreakDurationMinutes) || DEFAULT_USER_SETTINGS.shortBreakDurationMinutes,
      ),
    );
    const longBreak = Math.max(
      1,
      Math.min(
        120,
        Number(input.longBreakDurationMinutes) || DEFAULT_USER_SETTINGS.longBreakDurationMinutes,
      ),
    );
    const interval = Math.max(
      1,
      Math.min(12, Number(input.longBreakInterval) || DEFAULT_USER_SETTINGS.longBreakInterval),
    );

    const soundscape = ['alpha_waves', 'rain', 'white_noise', 'off'].includes(
      input.defaultSoundscape as string,
    )
      ? input.defaultSoundscape!
      : DEFAULT_USER_SETTINGS.defaultSoundscape;

    const hotkey =
      typeof input.globalHotkey === 'string' && input.globalHotkey.trim().length > 0
        ? input.globalHotkey.trim()
        : DEFAULT_USER_SETTINGS.globalHotkey;

    return {
      focusDurationMinutes: focus,
      shortBreakDurationMinutes: shortBreak,
      longBreakDurationMinutes: longBreak,
      longBreakInterval: interval,
      autoStartBreaks: Boolean(input.autoStartBreaks),
      autoStartFocus: Boolean(input.autoStartFocus),
      systemSilencingEnabled:
        input.systemSilencingEnabled ?? DEFAULT_USER_SETTINGS.systemSilencingEnabled,
      defaultSoundscape: soundscape,
      globalHotkey: hotkey,
    };
  }
}
