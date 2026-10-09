import { useEffect, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { Header } from './components/Header';
import { TimerGauge } from './components/TimerGauge';
import { ControlDock } from './components/ControlDock';
import { TelemetryCard } from './components/TelemetryCard';
import { useTimer } from './hooks/useTimer';

export default function App() {
  const { snapshot, start, pause, resume, reset, skip } = useTimer();
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);

  // Crash recovery listener
  useEffect(() => {
    const api = window.focusDeckAPI;
    if (!api?.onCrashRecovery) return;

    const unsub = api.onCrashRecovery(volume => {
      setRecoveryNotice(`Crash Recovery Active: Original system volume restored to ${volume}%.`);
    });

    return () => unsub();
  }, []);

  // Keyboard shortcut listener within UI
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input field
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
      <Header appName="FocusDeck" />

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
        onStart={() => start()}
        onPause={pause}
        onResume={resume}
        onReset={reset}
        onSkip={skip}
      />
    </div>
  );
}
