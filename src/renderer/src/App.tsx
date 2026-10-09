import { useEffect } from 'react';
import { Header } from './components/Header';
import { TimerGauge } from './components/TimerGauge';
import { ControlDock } from './components/ControlDock';
import { TelemetryCard } from './components/TelemetryCard';
import { useTimer } from './hooks/useTimer';

export default function App() {
  const { snapshot, start, pause, resume, reset, skip } = useTimer();

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
