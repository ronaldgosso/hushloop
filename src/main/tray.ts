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
    // 16x16 raster PNG base64: electric cyan Acoustic Loop icon
    // Using PNG data URL guarantees Windows CreateIconIndirect produces a valid HICON
    const pngBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABiElEQVR4nIzTyyvEURQH8DPMzEosrCxkMdQgeeSdpNSElZQNZWEtCxv5I6wIGxsrJewYsRF5JDJ5Td52dnbyiPH9ds8vp9/8lFufmd+5c+/93XvumbBktwLogkqo0L4LSEESXu3gkG9yP8xCoQS3ZxiG9aAFRmDKxCtwps9V0KfPGRiARbtAK+xqvAOjcOp7ez1MQxO8Qy1ccUIupKEUjnRARie1QC+MaxwWlwvmZhs6uEA3rMEHlMM9xCAONTABeWYndXDsHS0HHwkNkjqZbRLmzaQeuIEInMCh9ie4QJEGj2bCA7yZuFiPGNE4rd9xnulTA7vN/7YoF3jSoMH8wCR+m5hHuxOXfbY2b6c8wpYGvOtmfZ4RVxde29QjfInLWUz7N7gDXgevphoWxF3drXqBfLMQ8+Ull4k88AqpEfbE1cQlDEp2IbXrC0rEXTnnpGwps8bn5DfT57APUXGVWqb9vJ0hWGLg/zOxeFiunRLcVmFMzJWH/hjIOmcJM7FMHItnGa79A38AAAD//1W2+FcAAAAGSURBVAMAfa1OFxO+OlAAAAAASUVORK5CYII=';

    const image = nativeImage.createFromDataURL(pngBase64);
    return image.resize({ width: 16, height: 16 });
  }

  private initTray(): void {
    try {
      const icon = this.createTrayIcon();
      this.tray = new Tray(icon);

      this.tray.setToolTip('HushLoop - Ready to Focus');

      this.tray.on('click', () => {
        this.toggleWindow();
      });

      this.updateContextMenu(this.timerEngine.getSnapshot());
    } catch (err) {
      console.warn('[HushLoop] Failed to initialize system tray:', err);
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
