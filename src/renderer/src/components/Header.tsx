import { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Settings as SettingsIcon } from 'lucide-react';
import { ShinyText } from './effects/ShinyText';

interface HeaderProps {
  appName?: string;
  onOpenSettings?: () => void;
}

export function Header({ appName = 'HushLoop', onOpenSettings }: HeaderProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    window.hushLoopAPI?.isWindowMaximized().then(setIsMaximized).catch(() => {});
  }, []);

  const handleMinimize = () => {
    window.hushLoopAPI?.minimizeWindow();
  };

  const handleToggleMaximize = async () => {
    const res = await window.hushLoopAPI?.maximizeWindow();
    if (res !== undefined) setIsMaximized(res);
  };

  const handleCloseToTray = () => {
    window.hushLoopAPI?.closeToTray();
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
          className="window-btn"
          onClick={handleToggleMaximize}
          title={isMaximized ? 'Restore' : 'Maximize'}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <Copy size={12} /> : <Square size={12} />}
        </button>
        <button
          className="window-btn window-btn-close"
          onClick={handleCloseToTray}
          title="Close (Minimize to Tray)"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>
    </header>
  );
}
