import { globalShortcut } from 'electron';

export class GlobalHotkeyManager {
  private currentAccelerator: string | null = null;
  private triggerCallback: (() => void) | null = null;

  public register(accelerator: string, onTrigger: () => void): boolean {
    this.triggerCallback = onTrigger;

    // Unregister existing hotkey if any
    if (this.currentAccelerator) {
      try {
        globalShortcut.unregister(this.currentAccelerator);
      } catch {
        // Ignore unregister errors
      }
    }

    try {
      const success = globalShortcut.register(accelerator, () => {
        if (this.triggerCallback) {
          this.triggerCallback();
        }
      });

      if (success) {
        this.currentAccelerator = accelerator;
        return true;
      }
      console.warn(`[GlobalHotkeyManager] Failed to register global shortcut '${accelerator}'`);
      return false;
    } catch (err) {
      console.error(
        `[GlobalHotkeyManager] Error registering global shortcut '${accelerator}':`,
        err,
      );
      return false;
    }
  }

  public unregister(): void {
    if (this.currentAccelerator) {
      try {
        globalShortcut.unregister(this.currentAccelerator);
      } catch {
        // Ignore
      }
      this.currentAccelerator = null;
    }
  }

  public getCurrentAccelerator(): string | null {
    return this.currentAccelerator;
  }

  public destroy(): void {
    this.unregister();
    this.triggerCallback = null;
  }
}
