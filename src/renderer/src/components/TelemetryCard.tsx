import { useEffect, useState } from 'react';
import { Flame, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { TimerSnapshot } from '@shared/types';
import { SpotlightCard } from './effects/SpotlightCard';
import { CountUp } from './effects/CountUp';
import { ShinyText } from './effects/ShinyText';

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
    const api = window.hushLoopAPI;
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
    <SpotlightCard
      className="telemetry-card glass-panel"
      contentClassName="telemetry-content-flow"
      spotlightColor="rgba(0, 242, 254, 0.15)"
      aria-label="Session Telemetry"
    >
      <div className="telemetry-header">
        <div className="telemetry-title-group">
          <ShinyText text="CYCLE TELEMETRY" speed={4} className="telemetry-title" />
          <span className="telemetry-subtitle">Pomodoro Block 1 • Windows 11</span>
        </div>
        <div className="telemetry-badge-active">
          <span className="telemetry-badge-dot" />
          <span>BLOCK {cycleSessionNumber}/4</span>
        </div>
      </div>

      {/* 4-Step Cycle Segmented Bar */}
      <div className="telemetry-section">
        <div className="telemetry-row">
          <span className="telemetry-label">Active Block</span>
          <span className="telemetry-value">
            <span className="telemetry-cyan">{cycleSessionNumber}</span> / 4
          </span>
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

      {/* Session Progress Gauge */}
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

      {/* Daily Stats Grid with CountUp */}
      <div className="telemetry-stats-grid">
        <div className="stat-box">
          <div className="stat-top">
            <Clock size={13} className="stat-icon-cyan" />
            <span className="stat-label">Focus Time</span>
          </div>
          <div className="stat-number">
            <CountUp to={todayMinutes} duration={0.6} suffix="m" />
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-top">
            <CheckCircle2 size={13} className="stat-icon-mint" />
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-number">
            <CountUp to={todaySessions} duration={0.6} />
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-top">
            <Flame size={13} className="stat-icon-coral" />
            <span className="stat-label">Day Streak</span>
          </div>
          <div className="stat-number stat-streak">
            <CountUp to={streakDays} duration={0.6} suffix="d" />
          </div>
        </div>
      </div>

      {/* Background Distraction Shield Status */}
      <div className="telemetry-footer-shield">
        <div className="shield-icon-badge">
          <ShieldCheck size={14} color="#4EEDDE" />
        </div>
        <div className="shield-text-group">
          <span className="shield-text-title">Audio Silencing Guard</span>
          <span className="shield-text-status">Active • Windows 11 Ducking</span>
        </div>
      </div>
    </SpotlightCard>
  );
}
