import { exec } from 'child_process';
import { promisify } from 'util';
import type { SilencerResult, SilencerSnapshot, SystemSilencer } from './silencer-interface';
import { CrashRecoveryLedger } from './crash-recovery';

const execAsync = promisify(exec);

export interface AudioDriver {
  getVolume(): Promise<number>;
  setVolume(volumePercent: number): Promise<void>;
}

export class WinMMAudioDriver implements AudioDriver {
  private readonly powershellPreamble = `
$ProgressPreference = 'SilentlyContinue'
$src = @'
using System;
using System.Runtime.InteropServices;
public class WinMMAudio {
    [DllImport("winmm.dll")] public static extern int waveOutGetVolume(IntPtr h, out uint v);
    [DllImport("winmm.dll")] public static extern int waveOutSetVolume(IntPtr h, uint v);
    public static int Get() {
        uint v; int r = waveOutGetVolume(IntPtr.Zero, out v);
        if (r != 0) return 100;
        return (int)Math.Round(((v & 0xffff) / 65535.0) * 100);
    }
    public static void Set(int p) {
        int bounded = Math.Max(0, Math.Min(100, p));
        ushort side = (ushort)(bounded * 655.35);
        uint val = (uint)(side | (side << 16));
        waveOutSetVolume(IntPtr.Zero, val);
    }
}
'@
Add-Type -TypeDefinition $src
`.trim();

  private buildEncodedCommand(psCode: string): string {
    const fullScript = `${this.powershellPreamble}\n${psCode}`;
    const base64 = Buffer.from(fullScript, 'utf16le').toString('base64');
    return `powershell -NoProfile -NonInteractive -EncodedCommand ${base64}`;
  }

  public async getVolume(): Promise<number> {
    try {
      const command = this.buildEncodedCommand('[WinMMAudio]::Get()');
      const { stdout } = await execAsync(command);
      const vol = parseInt(stdout.trim(), 10);
      return Number.isNaN(vol) ? 100 : vol;
    } catch (err) {
      console.warn('[WinMMAudioDriver] Failed to read audio volume, defaulting to 100:', err);
      return 100;
    }
  }

  public async setVolume(volumePercent: number): Promise<void> {
    try {
      const bounded = Math.max(0, Math.min(100, Math.round(volumePercent)));
      const command = this.buildEncodedCommand(`[WinMMAudio]::Set(${bounded})`);
      await execAsync(command);
    } catch (err) {
      console.error('[WinMMAudioDriver] Failed to set audio volume:', err);
      throw err;
    }
  }
}

export class MockAudioDriver implements AudioDriver {
  private volume = 75;

  public async getVolume(): Promise<number> {
    return this.volume;
  }

  public async setVolume(volumePercent: number): Promise<void> {
    this.volume = Math.max(0, Math.min(100, Math.round(volumePercent)));
  }
}

export class WindowsSilencer implements SystemSilencer {
  private isCurrentlySilenced = false;
  private originalVolume: number | null = null;
  private readonly audioDriver: AudioDriver;
  private readonly ledger: CrashRecoveryLedger;

  private static readonly HONEST_LIMITATIONS = [
    'Windows 11 Do Not Disturb (DND) has no public Win32 API. Use Win+N to enable visual toast suppression manually.',
    'HushLoop automatically ducks/mutes system master audio and suppresses internal notification sounds.',
  ];

  constructor(driver?: AudioDriver, ledger?: CrashRecoveryLedger) {
    this.audioDriver =
      driver ?? (process.platform === 'win32' ? new WinMMAudioDriver() : new MockAudioDriver());
    this.ledger = ledger ?? new CrashRecoveryLedger();
  }

  public isSilenced(): boolean {
    return this.isCurrentlySilenced;
  }

  public async getCurrentVolume(): Promise<number> {
    return this.audioDriver.getVolume();
  }

  public async getSnapshot(): Promise<SilencerSnapshot> {
    const currentVol = await this.getCurrentVolume();
    return {
      timestamp: Date.now(),
      volumePercent: this.originalVolume ?? currentVol,
      isSilenced: this.isCurrentlySilenced,
      duckPercent: 0,
    };
  }

  public async silence(duckPercent = 0): Promise<SilencerResult> {
    if (this.isCurrentlySilenced) {
      return {
        success: true,
        action: 'no_op',
        snapshot: await this.getSnapshot(),
        limitationsNoted: WindowsSilencer.HONEST_LIMITATIONS,
      };
    }

    try {
      // 1. Capture original system volume
      const currentVol = await this.audioDriver.getVolume();
      this.originalVolume = currentVol;

      const snapshot: SilencerSnapshot = {
        timestamp: Date.now(),
        volumePercent: currentVol,
        isSilenced: true,
        duckPercent,
      };

      // 2. Atomically journal pre-session state before modifying system audio
      await this.ledger.recordSession(snapshot);

      // 3. Apply audio ducking/muting
      await this.audioDriver.setVolume(duckPercent);
      this.isCurrentlySilenced = true;

      return {
        success: true,
        action: 'silenced',
        snapshot,
        limitationsNoted: WindowsSilencer.HONEST_LIMITATIONS,
      };
    } catch (err: unknown) {
      return {
        success: false,
        action: 'no_op',
        snapshot: await this.getSnapshot(),
        error: (err as Error).message,
        limitationsNoted: WindowsSilencer.HONEST_LIMITATIONS,
      };
    }
  }

  public async restore(): Promise<SilencerResult> {
    if (!this.isCurrentlySilenced || this.originalVolume === null) {
      return {
        success: true,
        action: 'no_op',
        snapshot: await this.getSnapshot(),
        limitationsNoted: WindowsSilencer.HONEST_LIMITATIONS,
      };
    }

    try {
      const targetVolume = this.originalVolume;
      await this.audioDriver.setVolume(targetVolume);

      // Clear the crash recovery journal
      await this.ledger.clearSession();

      this.isCurrentlySilenced = false;
      this.originalVolume = null;

      const snapshot: SilencerSnapshot = {
        timestamp: Date.now(),
        volumePercent: targetVolume,
        isSilenced: false,
        duckPercent: 0,
      };

      return {
        success: true,
        action: 'restored',
        snapshot,
        limitationsNoted: WindowsSilencer.HONEST_LIMITATIONS,
      };
    } catch (err: unknown) {
      return {
        success: false,
        action: 'no_op',
        snapshot: await this.getSnapshot(),
        error: (err as Error).message,
        limitationsNoted: WindowsSilencer.HONEST_LIMITATIONS,
      };
    }
  }

  public async restoreFromSnapshot(snapshot: SilencerSnapshot): Promise<SilencerResult> {
    try {
      await this.audioDriver.setVolume(snapshot.volumePercent);
      this.isCurrentlySilenced = false;
      this.originalVolume = null;

      return {
        success: true,
        action: 'recovered',
        snapshot: {
          timestamp: Date.now(),
          volumePercent: snapshot.volumePercent,
          isSilenced: false,
          duckPercent: 0,
        },
        limitationsNoted: WindowsSilencer.HONEST_LIMITATIONS,
      };
    } catch (err: unknown) {
      return {
        success: false,
        action: 'no_op',
        snapshot,
        error: (err as Error).message,
        limitationsNoted: WindowsSilencer.HONEST_LIMITATIONS,
      };
    }
  }
}
