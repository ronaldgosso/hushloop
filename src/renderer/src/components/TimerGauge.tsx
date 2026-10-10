import type { TimerSnapshot } from '@shared/types';
import { ShinyText } from './effects/ShinyText';

interface TimerGaugeProps {
  snapshot: TimerSnapshot;
  onTogglePlay?: () => void;
}

export function TimerGauge({ snapshot, onTogglePlay }: TimerGaugeProps) {
  const { remainingMs, totalDurationMs, phase, state, cycleSessionNumber } = snapshot;

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isBreak = phase === 'short_break' || phase === 'long_break';
  const isRunning = state === 'running';
  const radius = 145;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalDurationMs > 0 ? (totalDurationMs - remainingMs) / totalDurationMs : 0;
  const strokeDashoffset = circumference * (1 - Math.min(1, Math.max(0, progressRatio)));

  // Calculate tip coordinates for the orbiting glowing comet
  const angle = -Math.PI / 2 + Math.min(1, Math.max(0, progressRatio)) * 2 * Math.PI;
  const cometX = 170 + radius * Math.cos(angle);
  const cometY = 170 + radius * Math.sin(angle);

  const getPhaseTitle = () => {
    switch (phase) {
      case 'focus':
        return 'FOCUS SESSION';
      case 'short_break':
        return 'SHORT BREAK';
      case 'long_break':
        return 'LONG RECOVERY';
    }
  };

  const getStatusLabel = () => {
    if (state === 'paused') return 'Paused';
    if (state === 'running') return isBreak ? 'Resting' : 'Deep Focus';
    return 'Ready to Focus';
  };

  return (
    <div className={`gauge-container ${isRunning ? 'gauge-running' : ''}`} onClick={onTogglePlay}>
      {/* Background Breathing Aura */}
      <div className={`gauge-breathing-aura ${isBreak ? 'aura-break' : 'aura-focus'} ${isRunning ? 'aura-active' : ''}`} />

      <svg className="gauge-svg" width="360" height="360" viewBox="0 0 340 340">
        <defs>
          <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F2FE" />
            <stop offset="50%" stopColor="#4EEDDE" />
            <stop offset="100%" stopColor="#38EF7D" />
          </linearGradient>

          <linearGradient id="breakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4B72" />
            <stop offset="50%" stopColor="#FF6584" />
            <stop offset="100%" stopColor="#FFA07A" />
          </linearGradient>

          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="12"
              floodColor={isBreak ? '#FF4B72' : '#00F2FE'}
              floodOpacity="0.6"
            />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Track Halo */}
        <circle className="gauge-track-outer" cx="170" cy="170" r={radius + 8} strokeWidth="1" />

        {/* Background Inset Track */}
        <circle className="gauge-track" cx="170" cy="170" r={radius} strokeWidth="11" />

        {/* Dynamic Progress Ring with Neon Bloom */}
        <circle
          className={`gauge-progress ${isBreak ? 'gauge-progress-break' : 'gauge-progress-focus'}`}
          cx="170"
          cy="170"
          r={radius}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          stroke={isBreak ? 'url(#breakGradient)' : 'url(#focusGradient)'}
          filter="url(#neonGlow)"
        />

        {/* Orbiting Comet Head */}
        {progressRatio > 0.005 && (
          <g className="gauge-comet">
            <circle
              cx={cometX}
              cy={cometY}
              r="7"
              fill={isBreak ? '#FFA07A' : '#FFFFFF'}
              filter="url(#neonGlow)"
            />
            <circle
              cx={cometX}
              cy={cometY}
              r="3.5"
              fill="#FFFFFF"
            />
          </g>
        )}
      </svg>

      <div className="gauge-center-content">
        {/* Shiny Phase Title */}
        <div className="gauge-sublabel-wrapper">
          <ShinyText text={getPhaseTitle()} speed={3.5} className="gauge-sublabel-shiny" />
        </div>

        {/* Precision Digits */}
        <h2 className="gauge-digits">{formattedTime}</h2>

        {/* Status Pill Badge */}
        <div className={`gauge-pill-badge ${isBreak ? 'pill-break' : 'pill-focus'} ${isRunning ? 'pill-active' : ''}`}>
          <span className="pill-dot" />
          <span className="pill-text">{getStatusLabel()}</span>
        </div>

        {/* Cycle Progress Pips */}
        <div className="gauge-cycle-pips" title={`Session ${cycleSessionNumber} of 4`}>
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`cycle-pip ${
                s < cycleSessionNumber
                  ? 'pip-done'
                  : s === cycleSessionNumber
                  ? 'pip-current'
                  : 'pip-next'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
