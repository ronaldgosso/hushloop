export interface SilencerSnapshot {
  timestamp: number;
  volumePercent: number; // 0 - 100
  isSilenced: boolean;
  duckPercent: number; // The target silenced volume (0 = mute)
}

export interface SilencerResult {
  success: boolean;
  action: 'silenced' | 'restored' | 'recovered' | 'no_op';
  snapshot: SilencerSnapshot;
  error?: string;
  limitationsNoted?: string[];
}

export interface SystemSilencer {
  silence(duckPercent?: number): Promise<SilencerResult>;
  restore(): Promise<SilencerResult>;
  restoreFromSnapshot(snapshot: SilencerSnapshot): Promise<SilencerResult>;
  isSilenced(): boolean;
  getCurrentVolume(): Promise<number>;
  getSnapshot(): Promise<SilencerSnapshot>;
}
