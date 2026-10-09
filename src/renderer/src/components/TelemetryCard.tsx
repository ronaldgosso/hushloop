import { useEffect, useState } from 'react';
import { Shield, Sparkles, Flame, Clock } from 'lucide-react';
import type { TimerSnapshot } from '@shared/types';

interface StatsSummary {
  today: {
    date: string;
    focusMinutes: number;
    completedFocusSessions: number;
    completedShortBreaks: number;
    completedLongBreaks: number;
  };
  streakDays: number;
  totalFocusMinutes: number;
  totalCompletedSessions: number;
}

interface TelemetryCardProps {
  snapshot: TimerSnapshot;
}

export function TelemetryCard({ snapshot }: TelemetryCardProps) {
  const { cycleSessionNumber, progressPercent } = snapshot;
  const [stats, setStats] = useState<StatsSummary | null>(null);

  const fetchStats = () => {
    const api = window.focusDeckAPI;
    if (api?.getStatsSummary) {
      api.getStatsSummary().then(setStats);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [snapshot.completedFocusSessions, snapshot.phase]);

  const cycleSessions = [1, 2, 3, 4];
  const todayMinutes = stats?.today.focusMinutes ?? snapshot.completedFocusSessions * 25;
  const todaySessions = stats?.today.completedFocusSessions ?? snapshot.completedFocusSessions;
  const streakDays = stats?.streakDays ?? (todaySessions > 0 ? 1 : 0);

  return (
    <aside className="telemetry-card glass-panel" aria-label="Session Telemetry">
      <div className="telemetry-header">
        <div className="telemetry-icon-wrap">
          <Sparkles size={16} color="#00F2FE" />
        </div>
        <div className="telemetry-title-group">
          <h3 className="telemetry-title">Cycle Telemetry</h3>
          <span className="telemetry-subtitle">Pomodoro Block 1</span>
        </div>
      </div>

      {/* 4-Step Cycle Segmented Bar */}
      <div className="telemetry-section">
        <div className="telemetry-row">
          <span className="telemetry-label">Active Block</span>
          <span className="telemetry-value">{cycleSessionNumber} / 4</span>
        </div>

        <div className="telemetry-steps">
          {cycleSessions.map(step => {
            const isCompleted = step < cycleSessionNumber;
            const isCurrent = step === cycleSessionNumber;
            return (
              <div
                key={step}
                className={`telemetry-step ${
                  isCompleted ? 'step-completed' : isCurrent ? 'step-current' : 'step-pending'
                }`}
                title={`Session ${step}`}
              >
                <div className="step-bar" />
                <span className="step-num">{step}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="telemetry-divider" />

      {/* Daily Progress Gauge */}
      <div className="telemetry-section">
        <div className="telemetry-row">
          <span className="telemetry-label">Session Progress</span>
          <span className="telemetry-value telemetry-cyan">{progressPercent}%</span>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      </div>

      <div className="telemetry-divider" />

      {/* Daily Stats Grid */}
      <div className="telemetry-stats-grid">
        <div className="stat-pill">
          <Flame size={14} color="#FF6584" />
          <span className="stat-pill-label">Streak:</span>
          <span className="stat-pill-val">
            {streakDays} {streakDays === 1 ? 'day' : 'days'}
          </span>
        </div>
        <div className="stat-pill">
          <Clock size={14} color="#00F2FE" />
          <span className="stat-pill-label">Focused:</span>
          <span className="stat-pill-val">{todayMinutes}m</span>
        </div>
      </div>

      {/* Windows 11 Silencing Telemetry */}
      <div className="silencer-telemetry-badge">
        <Shield size={14} className="silencer-badge-icon" />
        <div className="silencer-badge-text">
          <span className="silencer-status-title">Windows 11 Silencer</span>
          <span className="silencer-status-sub">
            {snapshot.state === 'running' && snapshot.phase === 'focus'
              ? 'Distractions Ducked'
              : 'Standby / Restored'}
          </span>
        </div>
      </div>

      <div className="telemetry-stats-footer">
        <span className="footer-stat-label">Total Completed Today:</span>
        <span className="footer-stat-number">{todaySessions}</span>
      </div>
    </aside>
  );
}
