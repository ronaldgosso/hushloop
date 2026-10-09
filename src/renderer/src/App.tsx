import { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { Header } from './components/Header';
import { TimerGauge } from './components/TimerGauge';
import { ControlDock } from './components/ControlDock';
import { TelemetryCard } from './components/TelemetryCard';
import { SettingsModal } from './components/SettingsModal';
import { useTimer } from './hooks/useTimer';
import { useSoundscape } from './hooks/useSoundscape';
import { DEFAULT_USER_SETTINGS, type UserSettings } from '@shared/types/settings';

export default function App() {
  const { snapshot, lastCompletedPhase, start, pause, resume, reset, skip } = useTimer();
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);

  // Load User Preferences on launch
  useEffect(() => {
    const api = window.focusDeckAPI;
    if (api?.getSettings) {
      api.getSettings().then(setSettings);
    }
  }, []);

  const handleSaveSettings = useCallback(async (updates: Partial<UserSettings>) => {
    const api = window.focusDeckAPI;
    if (api?.updateSettings) {
      const updated = await api.updateSettings(updates);
      setSettings(updated);
    }
  }, []);

  // Soundscape audio engine hook
  const { soundscape, setSoundscape, volume, setVolume, isPlaying } = useSoundscape(
    snapshot,
    lastCompletedPhase,
  );

  // Crash recovery listener
  useEffect(() => {
    const api = window.focusDeckAPI;
    if (!api?.onCrashRecovery) return;

    const unsub = api.onCrashRecovery(vol => {
      setRecoveryNotice(`Crash Recovery Active: Original system volume restored to ${vol}%.`);
    });

    return () => unsub();
  }, []);

  // Keyboard shortcut listener within UI
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (snapshot.state === 'running') {
          pause();
        } else if (snapshot.state === 'paused') {
          resume();
        } else {
          start();
        }
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        reset();
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        skip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [snapshot.state, pause, resume, start, reset, skip]);

  return (
    <div className="app-shell">
      <Header appName="HushLoop" onOpenSettings={() => setIsSettingsOpen(true)} />

      {recoveryNotice && (
        <div className="recovery-banner">
          <div className="recovery-content">
            <ShieldAlert size={16} color="#00F2FE" />
            <span>{recoveryNotice}</span>
          </div>
          <button
            className="recovery-close-btn"
            onClick={() => setRecoveryNotice(null)}
            aria-label="Dismiss recovery notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <main className="app-main-content">
        <section className="timer-section">
          <TimerGauge snapshot={snapshot} />
        </section>

        <section className="telemetry-section-wrapper">
          <TelemetryCard snapshot={snapshot} />
        </section>
      </main>

      <ControlDock
        snapshot={snapshot}
        soundscape={soundscape}
        volume={volume}
        isPlaying={isPlaying}
        onSelectSoundscape={setSoundscape}
        onVolumeChange={setVolume}
        onStart={() => start()}
        onPause={pause}
        onResume={resume}
        onReset={reset}
        onSkip={skip}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
