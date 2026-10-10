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
import { ClickSpark } from './effects/ClickSpark';
import { SpotlightCard } from './effects/SpotlightCard';

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
      {/* Soundscape Popover Menu with SpotlightCard */}
      {showAudioPopover && (
        <SpotlightCard
          className="audio-popover glass-panel"
          spotlightColor="rgba(0, 242, 254, 0.22)"
        >
          <div className="popover-header">
            <span className="popover-title">Focus Soundscapes</span>
            <div className="popover-status-badge">
              <span className={`status-pill-dot ${isPlaying ? 'dot-active' : ''}`} />
              <span className="popover-status">{isPlaying ? 'Active Audio' : 'Standby'}</span>
            </div>
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
              <span className="volume-label">Master Ambient Volume</span>
              <span className="volume-percent">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={e => onVolumeChange(parseFloat(e.target.value))}
              className="volume-slider"
              aria-label="Soundscape Volume Slider"
            />
          </div>
        </SpotlightCard>
      )}

      {/* Floating Glassmorphic Dock Pill with ClickSpark */}
      <div className="dock-pill glass-panel">
        {/* Reset Button */}
        <ClickSpark sparkColor="#8B949E" sparkCount={6}>
          <button
            className="dock-btn dock-btn-subtle"
            onClick={onReset}
            title="Reset Timer (R)"
            aria-label="Reset Timer"
          >
            <RotateCcw size={18} />
          </button>
        </ClickSpark>

        {/* Primary Play/Pause Button with Pulsing Specular Halo */}
        <ClickSpark sparkColor={isBreak ? '#FF4B72' : '#00F2FE'} sparkCount={14}>
          <button
            className={`dock-btn dock-btn-primary ${
              isBreak ? 'dock-primary-break' : 'dock-primary-focus'
            } ${isRunning ? 'dock-running' : ''}`}
            onClick={handleToggle}
            title={isRunning ? 'Pause Timer (Space)' : 'Start Timer (Space)'}
            aria-label={isRunning ? 'Pause' : 'Start'}
          >
            <div className="btn-specular-glow" />
            {isRunning ? (
              <Pause size={22} fill="currentColor" />
            ) : (
              <Play size={22} fill="currentColor" style={{ marginLeft: 3 }} />
            )}
          </button>
        </ClickSpark>

        {/* Skip Phase Button */}
        <ClickSpark sparkColor="#4EEDDE" sparkCount={8}>
          <button
            className="dock-btn dock-btn-subtle"
            onClick={onSkip}
            title="Skip to Next Phase (S)"
            aria-label="Skip to Next Phase"
          >
            <SkipForward size={18} />
          </button>
        </ClickSpark>

        <div className="dock-separator" />

        {/* Soundscape Trigger Button with Animated Equalizer Waveform */}
        <ClickSpark sparkColor="#00F2FE" sparkCount={8}>
          <button
            className={`dock-btn dock-btn-audio ${soundscape !== 'off' ? 'dock-audio-active' : ''}`}
            onClick={() => setShowAudioPopover(!showAudioPopover)}
            title="Ambient Focus Soundscapes"
            aria-label="Toggle Soundscapes Menu"
          >
            {soundscape === 'off' ? (
              <VolumeX size={18} />
            ) : (
              <div className="equalizer-icon-wrapper">
                {isPlaying ? (
                  <div className="animated-equalizer" aria-hidden="true">
                    <span className="eq-bar eq-bar-1" />
                    <span className="eq-bar eq-bar-2" />
                    <span className="eq-bar eq-bar-3" />
                  </div>
                ) : (
                  <Volume2 size={18} />
                )}
              </div>
            )}
          </button>
        </ClickSpark>
      </div>
    </nav>
  );
}
