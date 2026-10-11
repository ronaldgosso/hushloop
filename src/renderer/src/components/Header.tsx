import { Minus, X, Settings as SettingsIcon } from 'lucide-react';
import { ShinyText } from './effects/ShinyText';

interface HeaderProps {
  appName?: string;
  onOpenSettings?: () => void;
}

export function Header({ appName = 'HushLoop', onOpenSettings }: HeaderProps) {
  const handleMinimize = () => {
    const api = window.hushLoopAPI;
    api?.minimizeWindow();
  };

  const handleCloseToTray = () => {
    const api = window.hushLoopAPI;
    api?.closeToTray();
  };

  return (
    <header className="window-header">
      <div className="window-drag-region">
        <div className="status-indicator">
          <div className="status-dot-core" />
          <div className="status-dot-pulse" />
        </div>
        <ShinyText text={appName.toUpperCase()} speed={5} className="app-title-shiny" />
        <span className="app-badge">Windows 11 Edition</span>
      </div>

      <div className="window-controls">
        {onOpenSettings && (
          <button
            className="window-btn"
            onClick={onOpenSettings}
            title="Preferences & Settings"
            aria-label="Preferences"
          >
            <SettingsIcon size={14} />
          </button>
        )}
        <button
          className="window-btn"
          onClick={handleMinimize}
          title="Minimize"
          aria-label="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          className="window-btn window-btn-close"
          onClick={handleCloseToTray}
          title="Close to Tray"
          aria-label="Close to Tray"
        >
          <X size={14} />
        </button>
      </div>
    </header>
  );
}
