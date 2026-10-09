import { Minus, X } from 'lucide-react';

interface HeaderProps {
  appName?: string;
}

export function Header({ appName = 'FocusDeck' }: HeaderProps) {
  const handleMinimize = () => {
    window.focusDeckAPI?.minimizeWindow();
  };

  const handleCloseToTray = () => {
    window.focusDeckAPI?.closeToTray();
  };

  return (
    <header className="window-header">
      <div className="window-drag-region">
        <div className="status-indicator">
          <div className="status-dot-core" />
          <div className="status-dot-pulse" />
        </div>
        <span className="app-title">{appName}</span>
        <span className="app-badge">Windows 11 Edition</span>
      </div>

      <div className="window-controls">
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
