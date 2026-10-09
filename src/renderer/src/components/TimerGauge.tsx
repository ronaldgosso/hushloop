import type { TimerSnapshot } from '@shared/types';

interface TimerGaugeProps {
  snapshot: TimerSnapshot;
}

export function TimerGauge({ snapshot }: TimerGaugeProps) {
  const { remainingMs, totalDurationMs, phase, state, cycleSessionNumber } = snapshot;

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isBreak = phase === 'short_break' || phase === 'long_break';
  const radius = 145;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalDurationMs > 0 ? (totalDurationMs - remainingMs) / totalDurationMs : 0;
  const strokeDashoffset = circumference * (1 - Math.min(1, Math.max(0, progressRatio)));

  const getPhaseTitle = () => {
    switch (phase) {
      case 'focus':
        return 'Focus Session';
      case 'short_break':
        return 'Short Break';
      case 'long_break':
        return 'Long Recovery';
    }
  };

  const getStatusLabel = () => {
    if (state === 'paused') return 'Paused';
    if (state === 'running') return isBreak ? 'Resting' : 'Deep Focus';
    return 'Ready';
  };

  return (
    <div className="gauge-container">
      <svg className="gauge-svg" width="340" height="340" viewBox="0 0 340 340">
        <defs>
          <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F2FE" />
            <stop offset="100%" stopColor="#4EEDDE" />
          </linearGradient>
          <linearGradient id="breakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4B72" />
            <stop offset="100%" stopColor="#FF6584" />
          </linearGradient>
          <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="8"
              floodColor={isBreak ? '#FF4B72' : '#00F2FE'}
              floodOpacity="0.45"
            />
          </filter>
        </defs>

        {/* Background Track Ring */}
        <circle className="gauge-track" cx="170" cy="170" r={radius} strokeWidth="10" />

        {/* Dynamic Progress Ring */}
        <circle
          className={`gauge-progress ${isBreak ? 'gauge-progress-break' : 'gauge-progress-focus'}`}
          cx="170"
          cy="170"
          r={radius}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          stroke={isBreak ? 'url(#breakGradient)' : 'url(#focusGradient)'}
          filter="url(#glowEffect)"
        />
      </svg>

      <div className="gauge-center-content">
        <span className="gauge-sublabel">{getPhaseTitle()}</span>

        <h2 className="gauge-digits">{formattedTime}</h2>

        <div className={`gauge-pill-badge ${isBreak ? 'pill-break' : 'pill-focus'}`}>
          <span className="pill-dot" />
          <span className="pill-text">{getStatusLabel()}</span>
        </div>

        <span className="gauge-cycle-info">
          Session {cycleSessionNumber} of 4 • {snapshot.progressPercent}%
        </span>
      </div>
    </div>
  );
}
