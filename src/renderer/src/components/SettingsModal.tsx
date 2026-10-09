import React, { useState } from 'react';
import { X, Sliders, Shield, Keyboard, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { DEFAULT_USER_SETTINGS, type UserSettings } from '@shared/types/settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (updates: Partial<UserSettings>) => Promise<void>;
}

export function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const [focusMin, setFocusMin] = useState(settings.focusDurationMinutes);
  const [shortMin, setShortMin] = useState(settings.shortBreakDurationMinutes);
  const [longMin, setLongMin] = useState(settings.longBreakDurationMinutes);
  const [silencing, setSilencing] = useState(settings.systemSilencingEnabled);
  const [hotkey, setHotkey] = useState(settings.globalHotkey);
  const [hotkeyStatus, setHotkeyStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        focusDurationMinutes: focusMin,
        shortBreakDurationMinutes: shortMin,
        longBreakDurationMinutes: longMin,
        systemSilencingEnabled: silencing,
        globalHotkey: hotkey,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setFocusMin(DEFAULT_USER_SETTINGS.focusDurationMinutes);
    setShortMin(DEFAULT_USER_SETTINGS.shortBreakDurationMinutes);
    setLongMin(DEFAULT_USER_SETTINGS.longBreakDurationMinutes);
    setSilencing(DEFAULT_USER_SETTINGS.systemSilencingEnabled);
    setHotkey(DEFAULT_USER_SETTINGS.globalHotkey);
  };

  const handleTestHotkey = async () => {
    if (!window.focusDeckAPI?.registerHotkey) return;
    const res = await window.focusDeckAPI.registerHotkey(hotkey);
    if (res.success) {
      setHotkeyStatus('Hotkey registered successfully!');
    } else {
      setHotkeyStatus('Could not register shortcut; it may conflict with Windows.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Sliders size={18} color="#00F2FE" />
            <h2 className="modal-title">FocusDeck Preferences</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close Settings">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-body">
          {/* Section 1: Durations */}
          <section className="settings-section">
            <h3 className="section-title">Session Durations</h3>

            <div className="setting-row">
              <label htmlFor="focus-slider" className="setting-label">
                Focus Session
              </label>
              <div className="setting-control-group">
                <input
                  id="focus-slider"
                  type="range"
                  min="5"
                  max="90"
                  step="5"
                  value={focusMin}
                  onChange={e => setFocusMin(Number(e.target.value))}
                  className="setting-slider"
                  aria-label="Focus Session Duration Slider"
                />
                <span className="setting-val-badge">{focusMin} min</span>
              </div>
            </div>

            <div className="setting-row">
              <label htmlFor="short-break-slider" className="setting-label">
                Short Break
              </label>
              <div className="setting-control-group">
                <input
                  id="short-break-slider"
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={shortMin}
                  onChange={e => setShortMin(Number(e.target.value))}
                  className="setting-slider"
                  aria-label="Short Break Duration Slider"
                />
                <span className="setting-val-badge">{shortMin} min</span>
              </div>
            </div>

            <div className="setting-row">
              <label htmlFor="long-break-slider" className="setting-label">
                Long Break
              </label>
              <div className="setting-control-group">
                <input
                  id="long-break-slider"
                  type="range"
                  min="5"
                  max="45"
                  step="5"
                  value={longMin}
                  onChange={e => setLongMin(Number(e.target.value))}
                  className="setting-slider"
                  aria-label="Long Break Duration Slider"
                />
                <span className="setting-val-badge">{longMin} min</span>
              </div>
            </div>
          </section>

          {/* Section 2: Windows 11 Silencing */}
          <section className="settings-section">
            <div className="section-header-row">
              <div className="section-title-with-icon">
                <Shield size={16} color="#00F2FE" />
                <h3 className="section-title">Windows 11 Silencing</h3>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={silencing}
                  onChange={e => setSilencing(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            <p className="setting-hint">
              Automatically ducks system master volume and notification sounds during focus
              sessions. Restores sound when breaking.
            </p>
          </section>

          {/* Section 3: Global Hotkey */}
          <section className="settings-section">
            <div className="section-title-with-icon">
              <Keyboard size={16} color="#00F2FE" />
              <h3 className="section-title">Global Windows Shortcut</h3>
            </div>
            <div className="hotkey-input-row">
              <input
                type="text"
                value={hotkey}
                onChange={e => {
                  setHotkey(e.target.value);
                  setHotkeyStatus(null);
                }}
                className="hotkey-text-input"
                placeholder="e.g. CommandOrControl+Alt+F"
              />
              <button type="button" className="hotkey-test-btn" onClick={handleTestHotkey}>
                Validate
              </button>
            </div>
            {hotkeyStatus && (
              <div className="hotkey-feedback-row">
                {hotkeyStatus.includes('successfully') ? (
                  <Check size={14} color="#4EEDDE" />
                ) : (
                  <AlertCircle size={14} color="#FF6584" />
                )}
                <span>{hotkeyStatus}</span>
              </div>
            )}
            <p className="setting-hint">
              Press this shortcut anywhere in Windows to immediately toggle Play/Pause.
            </p>
          </section>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button type="button" className="modal-btn-secondary" onClick={handleResetDefaults}>
              <RotateCcw size={14} />
              <span>Defaults</span>
            </button>

            <div className="modal-footer-right">
              <button type="button" className="modal-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="modal-btn-save" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
