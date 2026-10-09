import { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Waves,
  CloudRain,
  Disc,
  Check,
} from 'lucide-react';
import type { TimerSnapshot } from '@shared/types';
import type { SoundscapeType } from '../audio/soundscape-engine';

interface ControlDockProps {
  snapshot: TimerSnapshot;
  soundscape: SoundscapeType;
  volume: number;
  isPlaying: boolean;
  onSelectSoundscape: (type: SoundscapeType) => void;
  onVolumeChange: (volume: number) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export function ControlDock({
  snapshot,
  soundscape,
  volume,
  isPlaying,
  onSelectSoundscape,
  onVolumeChange,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
}: ControlDockProps) {
  const [showAudioPopover, setShowAudioPopover] = useState(false);

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

  const soundscapes: { id: SoundscapeType; label: string; icon: typeof Waves }[] = [
    { id: 'alpha_waves', label: 'Alpha Waves (432Hz)', icon: Waves },
    { id: 'rain', label: 'Rain Ambience', icon: CloudRain },
    { id: 'white_noise', label: 'White Noise', icon: Disc },
    { id: 'off', label: 'Muted', icon: VolumeX },
  ];

  return (
    <nav className="dock-container" aria-label="Timer Controls">
      {/* Soundscape Popover Menu */}
      {showAudioPopover && (
        <div className="audio-popover glass-panel">
          <div className="popover-header">
            <span className="popover-title">Focus Soundscapes</span>
            <span className="popover-status">{isPlaying ? 'Playing' : 'Standby'}</span>
          </div>

          <div className="soundscape-list">
            {soundscapes.map(s => {
              const Icon = s.icon;
              const isSelected = soundscape === s.id;
              return (
                <button
                  key={s.id}
                  className={`soundscape-item ${isSelected ? 'soundscape-active' : ''}`}
                  onClick={() => {
                    onSelectSoundscape(s.id);
                  }}
                >
                  <div className="soundscape-left">
                    <Icon size={16} />
                    <span>{s.label}</span>
                  </div>
                  {isSelected && <Check size={14} color="#00F2FE" />}
                </button>
              );
            })}
          </div>

          <div className="popover-volume-section">
            <div className="volume-label-row">
              <span className="vol-title">Volume</span>
              <span className="vol-value">{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={e => onVolumeChange(Number(e.target.value))}
              className="volume-slider"
              aria-label="Soundscape Volume"
            />
          </div>
        </div>
      )}

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

        {/* Soundscape Quick Indicator & Popover Trigger */}
        <button
          className={`dock-btn dock-btn-icon ${showAudioPopover ? 'dock-btn-icon-active' : ''}`}
          onClick={() => setShowAudioPopover(!showAudioPopover)}
          title="Soundscapes & Ambient Music"
          aria-label="Toggle Soundscapes Menu"
        >
          {soundscape === 'off' ? <VolumeX size={18} /> : <Volume2 size={18} />}
          <span className="dock-btn-tag">
            {soundscape === 'alpha_waves'
              ? 'Alpha'
              : soundscape === 'rain'
                ? 'Rain'
                : soundscape === 'white_noise'
                  ? 'Noise'
                  : 'Off'}
          </span>
        </button>
      </div>
    </nav>
  );
}
