import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { WindowsSilencer, MockAudioDriver } from '../windows-silencer';
import { CrashRecoveryLedger } from '../crash-recovery';

describe('WindowsSilencer', () => {
  let tempLedgerPath: string;
  let ledger: CrashRecoveryLedger;
  let mockDriver: MockAudioDriver;
  let silencer: WindowsSilencer;

  beforeEach(() => {
    tempLedgerPath = path.join(
      os.tmpdir(),
      `focusdeck-silencer-test-${Date.now()}-${Math.random().toString(36).substring(7)}.json`,
    );
    ledger = new CrashRecoveryLedger(tempLedgerPath);
    mockDriver = new MockAudioDriver();
    mockDriver.setVolume(70); // Set initial mock volume to 70%
    silencer = new WindowsSilencer(mockDriver, ledger);
  });

  afterEach(async () => {
    try {
      await fs.unlink(tempLedgerPath);
    } catch {
      // Ignore
    }
  });

  it('captures initial volume, ducks audio, and writes crash ledger on silence()', async () => {
    expect(await mockDriver.getVolume()).toBe(70);
    expect(silencer.isSilenced()).toBe(false);

    const result = await silencer.silence(0);

    expect(result.success).toBe(true);
    expect(result.action).toBe('silenced');
    expect(result.snapshot.volumePercent).toBe(70);
    expect(result.snapshot.duckPercent).toBe(0);
    expect(silencer.isSilenced()).toBe(true);

    // Audio should now be ducked to 0%
    expect(await mockDriver.getVolume()).toBe(0);

    // Crash ledger must exist on disk!
    expect(await ledger.hasPendingRecovery()).toBe(true);
    const recorded = await ledger.getPendingRecovery();
    expect(recorded?.volumePercent).toBe(70);

    // Honest limitations documented
    expect(result.limitationsNoted).toBeDefined();
    expect(result.limitationsNoted?.[0]).toContain('Do Not Disturb');
  });

  it('restores original volume and purges ledger on restore()', async () => {
    await silencer.silence(10); // Duck to 10%
    expect(await mockDriver.getVolume()).toBe(10);
    expect(await ledger.hasPendingRecovery()).toBe(true);

    const restoreResult = await silencer.restore();

    expect(restoreResult.success).toBe(true);
    expect(restoreResult.action).toBe('restored');
    expect(silencer.isSilenced()).toBe(false);

    // Audio must be restored back to 70%
    expect(await mockDriver.getVolume()).toBe(70);

    // Ledger must be deleted
    expect(await ledger.hasPendingRecovery()).toBe(false);
  });

  it('returns no_op for redundant silence() or restore() calls', async () => {
    await silencer.silence(0);
    const secondSilence = await silencer.silence(0);
    expect(secondSilence.action).toBe('no_op');

    await silencer.restore();
    const secondRestore = await silencer.restore();
    expect(secondRestore.action).toBe('no_op');
  });

  it('restores volume from external crash snapshot via restoreFromSnapshot()', async () => {
    const crashSnapshot = {
      timestamp: Date.now(),
      volumePercent: 85,
      isSilenced: true,
      duckPercent: 0,
    };

    const result = await silencer.restoreFromSnapshot(crashSnapshot);

    expect(result.success).toBe(true);
    expect(result.action).toBe('recovered');
    expect(await mockDriver.getVolume()).toBe(85);
  });
});
