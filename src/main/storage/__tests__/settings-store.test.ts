import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { SettingsStore } from '../settings-store';
import { DEFAULT_USER_SETTINGS } from '../../../shared/types/settings';

describe('SettingsStore', () => {
  let tempSettingsPath: string;
  let store: SettingsStore;

  beforeEach(() => {
    tempSettingsPath = path.join(
      os.tmpdir(),
      `hushloop-settings-test-${Date.now()}-${Math.random().toString(36).substring(7)}.json`,
    );
    store = new SettingsStore(tempSettingsPath);
  });

  afterEach(async () => {
    try {
      await fs.unlink(tempSettingsPath);
    } catch {
      // Ignore
    }
  });

  it('loads default settings when no file exists', async () => {
    const settings = await store.load();
    expect(settings).toEqual(DEFAULT_USER_SETTINGS);
  });

  it('updates partial settings and persists to disk', async () => {
    await store.load();
    const updated = await store.updateSettings({
      focusDurationMinutes: 50,
      globalHotkey: 'Control+Alt+P',
      systemSilencingEnabled: false,
    });

    expect(updated.focusDurationMinutes).toBe(50);
    expect(updated.globalHotkey).toBe('Control+Alt+P');
    expect(updated.systemSilencingEnabled).toBe(false);
    expect(updated.shortBreakDurationMinutes).toBe(5); // Retained default

    // Verify written to disk and can be reloaded
    const store2 = new SettingsStore(tempSettingsPath);
    const reloaded = await store2.load();
    expect(reloaded.focusDurationMinutes).toBe(50);
    expect(reloaded.globalHotkey).toBe('Control+Alt+P');
    expect(reloaded.systemSilencingEnabled).toBe(false);
  });

  it('sanitizes out-of-bound inputs to safe boundaries', async () => {
    await store.load();
    const updated = await store.updateSettings({
      focusDurationMinutes: 9999, // Should bound to 180
      shortBreakDurationMinutes: -10, // Should bound to 1
      defaultSoundscape: 'invalid_noise' as unknown as 'rain', // Should fallback
      globalHotkey: '   ', // Empty hotkey should fallback
    });

    expect(updated.focusDurationMinutes).toBe(180);
    expect(updated.shortBreakDurationMinutes).toBe(1);
    expect(updated.defaultSoundscape).toBe(DEFAULT_USER_SETTINGS.defaultSoundscape);
    expect(updated.globalHotkey).toBe(DEFAULT_USER_SETTINGS.globalHotkey);
  });
});
