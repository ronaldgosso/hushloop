import { Play, Pause, SkipForward, RotateCcw, Volume2 } from 'lucide-react';
import type { TimerSnapshot } from '@shared/types';

interface ControlDockProps {
  snapshot: TimerSnapshot;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export function ControlDock({
  snapshot,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
}: ControlDockProps) {
  const isRunning = snapshot.state === 'running';
  const isPaused = snapshot.state === 'paused';
  const isBreak = snapshot.phase === 'short_break' || snapshot.phase === 'long_break';

  const handleToggle = () => {
    if (isRunning) {
      onPause();
    } else if (isPaused) {
      onResume();
    } else {
      onStart();
    }
  };

  return (
    <nav className="dock-container" aria-label="Timer Controls">
      <div className="pill-dock dock-inner">
        {/* Reset Action */}
        <button
          className="dock-btn dock-btn-secondary"
          onClick={onReset}
          title="Reset Session (R)"
          aria-label="Reset Timer"
          disabled={snapshot.state === 'idle' && snapshot.remainingMs === snapshot.totalDurationMs}
        >
          <RotateCcw size={18} />
        </button>

        {/* Primary Play / Pause Toggle Button */}
        <button
          className={`dock-btn dock-btn-primary ${isBreak ? 'dock-btn-break' : 'dock-btn-focus'}`}
          onClick={handleToggle}
          title={isRunning ? 'Pause (Space)' : isPaused ? 'Resume (Space)' : 'Start (Space)'}
          aria-label={isRunning ? 'Pause Timer' : 'Start Timer'}
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '3px' }} />}
        </button>

        {/* Skip to Next Phase */}
        <button
          className="dock-btn dock-btn-secondary"
          onClick={onSkip}
          title="Skip Phase (S)"
          aria-label="Skip to Next Phase"
        >
          <SkipForward size={18} />
        </button>

        <div className="dock-divider" />

        {/* Soundscape Quick Indicator */}
        <button
          className="dock-btn dock-btn-icon"
          title="Soundscape / Ambient Audio"
          aria-label="Toggle Audio"
        >
          <Volume2 size={18} />
          <span className="dock-btn-tag">Ambient</span>
        </button>
      </div>
    </nav>
  );
}
