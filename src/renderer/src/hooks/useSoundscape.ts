import { useState, useEffect, useCallback } from 'react';
import { globalSoundscape, type SoundscapeType } from '../audio/soundscape-engine';
import type { PhaseCompleteEvent, TimerSnapshot } from '@shared/types';

export function useSoundscape(
  snapshot: TimerSnapshot,
  lastCompletedPhase: PhaseCompleteEvent | null,
) {
  const [soundscape, setSoundscapeState] = useState<SoundscapeType>(
    globalSoundscape.getSoundscape(),
  );
  const [volume, setVolumeState] = useState<number>(Math.round(globalSoundscape.getVolume() * 100));

  // Sync ambient music with timer state
  useEffect(() => {
    if (snapshot.state === 'running' && snapshot.phase === 'focus') {
      if (soundscape !== 'off') {
        globalSoundscape.play();
      }
    } else {
      globalSoundscape.stop();
    }
  }, [snapshot.state, snapshot.phase, soundscape]);

  // Play chime on phase completion
  useEffect(() => {
    if (lastCompletedPhase) {
      globalSoundscape.playChime();
    }
  }, [lastCompletedPhase]);

  const setSoundscape = useCallback((type: SoundscapeType) => {
    globalSoundscape.setSoundscape(type);
    setSoundscapeState(type);
  }, []);

  const setVolume = useCallback((volPercent: number) => {
    const bounded = Math.max(0, Math.min(100, volPercent));
    globalSoundscape.setVolume(bounded / 100);
    setVolumeState(bounded);
  }, []);

  return {
    soundscape,
    setSoundscape,
    volume,
    setVolume,
    isPlaying: globalSoundscape.isPlaying(),
  };
}
