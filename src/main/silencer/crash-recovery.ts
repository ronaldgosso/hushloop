import fs from 'fs/promises';
import path from 'path';
import type { SilencerSnapshot, SystemSilencer } from './silencer-interface';

export class CrashRecoveryLedger {
  private readonly ledgerFilePath: string;

  constructor(customPath?: string) {
    this.ledgerFilePath = customPath ?? path.join(process.cwd(), 'silencer-session.json');
  }

  public getFilePath(): string {
    return this.ledgerFilePath;
  }

  public async recordSession(snapshot: SilencerSnapshot): Promise<void> {
    try {
      const data = JSON.stringify(snapshot, null, 2);
      await fs.writeFile(this.ledgerFilePath, data, 'utf-8');
    } catch (err) {
      console.error('[CrashRecoveryLedger] Failed to write session ledger:', err);
      throw err;
    }
  }

  public async clearSession(): Promise<void> {
    try {
      await fs.unlink(this.ledgerFilePath);
    } catch (err: unknown) {
      // Ignore if file already doesn't exist
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('[CrashRecoveryLedger] Failed to clear session ledger:', err);
      }
    }
  }

  public async hasPendingRecovery(): Promise<boolean> {
    try {
      await fs.access(this.ledgerFilePath);
      return true;
    } catch {
      return false;
    }
  }

  public async getPendingRecovery(): Promise<SilencerSnapshot | null> {
    try {
      const content = await fs.readFile(this.ledgerFilePath, 'utf-8');
      const parsed = JSON.parse(content) as SilencerSnapshot;
      if (typeof parsed.volumePercent === 'number' && typeof parsed.timestamp === 'number') {
        return parsed;
      }
      return null;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      console.warn('[CrashRecoveryLedger] Unreadable or corrupted ledger file, discarding:', err);
      await this.clearSession();
      return null;
    }
  }

  public async recoverIfNeeded(
    silencer: SystemSilencer,
  ): Promise<{ recovered: boolean; snapshot?: SilencerSnapshot }> {
    const pending = await this.getPendingRecovery();
    if (!pending) {
      return { recovered: false };
    }

    try {
      await silencer.restoreFromSnapshot(pending);
      await this.clearSession();
      return { recovered: true, snapshot: pending };
    } catch (err) {
      console.error('[CrashRecoveryLedger] Recovery restoration failed:', err);
      return { recovered: false };
    }
  }
}
