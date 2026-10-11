import { app, BrowserWindow, Menu, Tray } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { TimerEngine } from '../core/timer/timer-engine';
import type { TimerSnapshot } from '../shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TrayManager {
  private tray: Tray | null = null;
  private readonly mainWindow: BrowserWindow;
  private readonly timerEngine: TimerEngine;

  constructor(mainWindow: BrowserWindow, timerEngine: TimerEngine) {
    this.mainWindow = mainWindow;
    this.timerEngine = timerEngine;
    this.initTray();
  }

  public hasTray(): boolean {
    return this.tray !== null;
  }

  private resolveIconPath(): string | null {
    const candidates = [
      path.join(process.resourcesPath, 'icon.ico'),
      path.join(process.resourcesPath, 'app.asar.unpacked/dist/icon.ico'),
      path.join(process.resourcesPath, 'app.asar.unpacked/dist/favicon.ico'),
      path.join(app.getAppPath(), 'dist/icon.ico'),
      path.join(app.getAppPath(), 'dist/favicon.ico'),
      path.join(app.getAppPath(), 'build/icon.ico'),
      path.join(__dirname, '../../dist/icon.ico'),
      path.join(__dirname, '../../build/icon.ico'),
      path.join(process.cwd(), 'build/icon.ico'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  private initTray(): void {
    try {
      const iconPath = this.resolveIconPath();
      if (!iconPath) {
        console.warn('[HushLoop] No tray icon file found on disk; skipping tray initialization.');
        this.tray = null;
        return;
      }

      this.tray = new Tray(iconPath);
      this.tray.setToolTip('HushLoop - Ready to Focus');

      this.tray.on('click', () => {
        this.toggleWindow();
      });

      this.updateContextMenu(this.timerEngine.getSnapshot());
    } catch (err) {
      console.warn('[HushLoop] Failed to initialize system tray:', err);
      this.tray = null;
    }
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
