import { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Settings as SettingsIcon, Globe } from 'lucide-react';
import { ShinyText } from './effects/ShinyText';

interface HeaderProps {
  appName?: string;
  onOpenSettings?: () => void;
}

const LANDING_PAGE_URL = 'https://ronaldgosso.github.io/hushloop_site/';
const AUTHOR_URL = 'https://github.com/ronaldgosso';

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

  const handleOpenLandingPage = () => {
    window.hushLoopAPI?.openExternal(LANDING_PAGE_URL);
  };

  const handleOpenAuthor = (e: React.MouseEvent) => {
    e.preventDefault();
    window.hushLoopAPI?.openExternal(AUTHOR_URL);
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
        <button
          type="button"
          onClick={handleOpenAuthor}
          className="app-author-pill no-drag"
          title="Conceived & Engineered by Ronald Gosso"
          aria-label="Author Profile"
        >
          by Ronald Gosso
        </button>
      </div>

      <div className="window-controls">
        <button
          className="window-btn"
          onClick={handleOpenLandingPage}
          title="Official Landing Page & Documentation"
          aria-label="Landing Page"
        >
          <Globe size={14} />
        </button>
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
