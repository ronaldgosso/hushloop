export interface UserSettings {
  focusDurationMinutes: number; // default: 25
  shortBreakDurationMinutes: number; // default: 5
  longBreakDurationMinutes: number; // default: 15
  longBreakInterval: number; // default: 4
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  systemSilencingEnabled: boolean; // default: true
  defaultSoundscape: 'alpha_waves' | 'rain' | 'white_noise' | 'off';
  globalHotkey: string; // default: 'CommandOrControl+Alt+F'
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  focusDurationMinutes: 25,
  shortBreakDurationMinutes: 5,
  longBreakDurationMinutes: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  systemSilencingEnabled: true,
  defaultSoundscape: 'alpha_waves',
  globalHotkey: 'CommandOrControl+Alt+F',
};
