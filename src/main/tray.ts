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
    // 16x16 brand mark data URL: electric cyan Sonic Shutter logo on transparent background
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
        <rect x="46" y="48" width="32" height="160" rx="16" fill="#00F2FE"/>
        <path d="M 106 64 C 106 50 122 41 134 48 L 202 88 C 214 95 214 113 202 120 L 134 160 C 122 167 106 158 106 144 Z" fill="#00F2FE" transform="matrix(1 0 0 1.5 0 -48)"/>
      </svg>
    `.trim();

    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgIcon).toString('base64')}`;
    const image = nativeImage.createFromDataURL(dataUrl);
    return image.resize({ width: 16, height: 16 });
  }

  private initTray(): void {
    const icon = this.createTrayIcon();
    this.tray = new Tray(icon);

    this.tray.setToolTip('FocusDeck - Ready to Focus');

    this.tray.on('click', () => {
      this.toggleWindow();
    });

    this.updateContextMenu(this.timerEngine.getSnapshot());
  }

  public update(snapshot: TimerSnapshot): void {
    if (!this.tray) return;

    const formattedTime = this.formatDuration(snapshot.remainingMs);
    const phaseLabel = this.getPhaseLabel(snapshot.phase);

    let tooltip = 'FocusDeck - Ready to Focus';
    if (snapshot.state === 'running') {
      tooltip = `FocusDeck - ${phaseLabel} (${formattedTime} remaining)`;
    } else if (snapshot.state === 'paused') {
      tooltip = `FocusDeck - Paused (${formattedTime} remaining)`;
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
        label: `FocusDeck • ${phaseLabel} (${formattedTime})`,
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
        label: isWindowVisible ? 'Hide to Tray' : 'Open FocusDeck',
        click: () => {
          this.toggleWindow();
        },
      },
      { type: 'separator' },
      {
        label: 'Quit FocusDeck',
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
