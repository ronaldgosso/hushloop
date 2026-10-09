import { app, BrowserWindow, Menu, nativeImage, Tray } from 'electron';
import type { TimerEngine } from '../core/timer/timer-engine';
import type { TimerSnapshot } from '../shared/types';

export class TrayManager {
  private tray: Tray | null = null;
  private readonly mainWindow: BrowserWindow;
  private readonly timerEngine: TimerEngine;

  constructor(mainWindow: BrowserWindow, timerEngine: TimerEngine) {
    this.mainWindow = mainWindow;
    this.timerEngine = timerEngine;
    this.initTray();
  }

  private createTrayIcon(): Electron.NativeImage {
    // 16x16 brand mark data URL: electric cyan Acoustic Loop logo on transparent background
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
        <path fill-rule="evenodd" d="M 128 32 C 74.98 32 32 74.98 32 128 C 32 181.02 74.98 224 128 224 C 181.02 224 224 181.02 224 128 C 224 74.98 181.02 32 128 32 Z M 128 60 C 165.55 60 196 90.45 196 128 C 196 165.55 165.55 196 128 196 C 90.45 196 60 165.55 60 128 C 60 90.45 90.45 60 128 60 Z" fill="#00F2FE"/>
        <rect x="96" y="96" width="18" height="64" rx="9" fill="#00F2FE"/>
        <rect x="122" y="80" width="18" height="96" rx="9" fill="#00F2FE"/>
        <rect x="148" y="104" width="18" height="48" rx="9" fill="#00F2FE"/>
      </svg>
    `.trim();

    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgIcon).toString('base64')}`;
    const image = nativeImage.createFromDataURL(dataUrl);
    return image.resize({ width: 16, height: 16 });
  }

  private initTray(): void {
    const icon = this.createTrayIcon();
    this.tray = new Tray(icon);

    this.tray.setToolTip('HushLoop - Ready to Focus');

    this.tray.on('click', () => {
      this.toggleWindow();
    });

    this.updateContextMenu(this.timerEngine.getSnapshot());
  }

  public update(snapshot: TimerSnapshot): void {
    if (!this.tray) return;

    const formattedTime = this.formatDuration(snapshot.remainingMs);
    const phaseLabel = this.getPhaseLabel(snapshot.phase);

    let tooltip = 'HushLoop - Ready to Focus';
    if (snapshot.state === 'running') {
      tooltip = `HushLoop - ${phaseLabel} (${formattedTime} remaining)`;
    } else if (snapshot.state === 'paused') {
      tooltip = `HushLoop - Paused (${formattedTime} remaining)`;
    }

    this.tray.setToolTip(tooltip);
    this.updateContextMenu(snapshot);
  }

  private updateContextMenu(snapshot: TimerSnapshot): void {
    if (!this.tray) return;

    const formattedTime = this.formatDuration(snapshot.remainingMs);
    const phaseLabel = this.getPhaseLabel(snapshot.phase);

    const isWindowVisible = this.mainWindow.isVisible();

    const contextMenu = Menu.buildFromTemplate([
      {
        label: `HushLoop • ${phaseLabel} (${formattedTime})`,
        enabled: false,
      },
      { type: 'separator' },
      {
        label:
          snapshot.state === 'running'
            ? 'Pause'
            : snapshot.state === 'paused'
              ? 'Resume'
              : 'Start Focus',
        click: () => {
          if (snapshot.state === 'running') {
            this.timerEngine.pause();
          } else if (snapshot.state === 'paused') {
            this.timerEngine.resume();
          } else {
            this.timerEngine.start('focus');
          }
        },
      },
      {
        label: 'Reset Timer',
        enabled: snapshot.state !== 'idle',
        click: () => {
          this.timerEngine.reset();
        },
      },
      {
        label: 'Skip Phase',
        click: () => {
          this.timerEngine.skip();
        },
      },
      { type: 'separator' },
      {
        label: isWindowVisible ? 'Hide to Tray' : 'Open HushLoop',
        click: () => {
          this.toggleWindow();
        },
      },
      { type: 'separator' },
      {
        label: 'Quit HushLoop',
        click: () => {
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  public toggleWindow(): void {
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  private formatDuration(ms: number): string {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  private getPhaseLabel(phase: string): string {
    switch (phase) {
      case 'focus':
        return 'Focus';
      case 'short_break':
        return 'Short Break';
      case 'long_break':
        return 'Long Break';
      default:
        return 'Session';
    }
  }

  public destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
