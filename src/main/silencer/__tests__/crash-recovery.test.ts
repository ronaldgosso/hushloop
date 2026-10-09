import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { CrashRecoveryLedger } from '../crash-recovery';
import type { SilencerSnapshot, SystemSilencer } from '../silencer-interface';

describe('CrashRecoveryLedger', () => {
  let tempLedgerPath: string;
  let ledger: CrashRecoveryLedger;

  beforeEach(() => {
    tempLedgerPath = path.join(
      os.tmpdir(),
      `focusdeck-test-ledger-${Date.now()}-${Math.random().toString(36).substring(7)}.json`,
    );
    ledger = new CrashRecoveryLedger(tempLedgerPath);
  });

  afterEach(async () => {
    try {
      await fs.unlink(tempLedgerPath);
    } catch {
      // Ignore if file already cleaned
    }
  });

  it('reports hasPendingRecovery as false when no ledger file exists', async () => {
    const hasPending = await ledger.hasPendingRecovery();
    expect(hasPending).toBe(false);

    const pending = await ledger.getPendingRecovery();
    expect(pending).toBeNull();
  });

  it('records session snapshot atomically to disk', async () => {
    const snapshot: SilencerSnapshot = {
      timestamp: 123456789,
      volumePercent: 65,
      isSilenced: true,
      duckPercent: 0,
    };

    await ledger.recordSession(snapshot);

    const hasPending = await ledger.hasPendingRecovery();
    expect(hasPending).toBe(true);

    const pending = await ledger.getPendingRecovery();
    expect(pending).toEqual(snapshot);
  });

  it('clears session ledger cleanly', async () => {
    const snapshot: SilencerSnapshot = {
      timestamp: Date.now(),
      volumePercent: 80,
      isSilenced: true,
      duckPercent: 10,
    };

    await ledger.recordSession(snapshot);
    expect(await ledger.hasPendingRecovery()).toBe(true);

    await ledger.clearSession();
    expect(await ledger.hasPendingRecovery()).toBe(false);
  });

  it('recovers pending session through silencer and cleans up ledger', async () => {
    const snapshot: SilencerSnapshot = {
      timestamp: Date.now(),
      volumePercent: 55,
      isSilenced: true,
      duckPercent: 0,
    };
    await ledger.recordSession(snapshot);

    const mockSilencer: SystemSilencer = {
      silence: vi.fn(),
      restore: vi.fn(),
      restoreFromSnapshot: vi.fn().mockResolvedValue({
        success: true,
        action: 'recovered',
        snapshot,
      }),
      isSilenced: vi.fn().mockReturnValue(true),
      getCurrentVolume: vi.fn().mockResolvedValue(0),
      getSnapshot: vi.fn().mockResolvedValue(snapshot),
    };

    const recoveryResult = await ledger.recoverIfNeeded(mockSilencer);

    expect(recoveryResult.recovered).toBe(true);
    expect(recoveryResult.snapshot?.volumePercent).toBe(55);
    expect(mockSilencer.restoreFromSnapshot).toHaveBeenCalledWith(snapshot);

    // Ledger should be removed after recovery
    expect(await ledger.hasPendingRecovery()).toBe(false);
  });

  it('gracefully discards corrupted or unreadable JSON file', async () => {
    await fs.writeFile(tempLedgerPath, 'INVALID_CORRUPTED_JSON{{{', 'utf-8');

    const pending = await ledger.getPendingRecovery();
    expect(pending).toBeNull();

    // Corrupted file should be deleted
    expect(await ledger.hasPendingRecovery()).toBe(false);
  });
});
