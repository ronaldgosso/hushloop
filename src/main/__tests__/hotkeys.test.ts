import { describe, it, expect, vi, beforeEach } from 'vitest';
import { globalShortcut } from 'electron';
import { GlobalHotkeyManager } from '../hotkeys';

const registered = new Map<string, () => void>();

vi.mock('electron', () => {
  return {
    globalShortcut: {
      register: vi.fn((acc: string, cb: () => void) => {
        if (acc === 'Invalid+Key') return false;
        registered.set(acc, cb);
        return true;
      }),
      unregister: vi.fn((acc: string) => {
        registered.delete(acc);
      }),
    },
  };
});

describe('GlobalHotkeyManager', () => {
  let manager: GlobalHotkeyManager;

  beforeEach(() => {
    vi.clearAllMocks();
    registered.clear();
    manager = new GlobalHotkeyManager();
  });

  it('registers an accelerator and triggers callback when invoked', () => {
    let triggered = false;
    const success = manager.register('CommandOrControl+Alt+F', () => {
      triggered = true;
    });

    expect(success).toBe(true);
    expect(manager.getCurrentAccelerator()).toBe('CommandOrControl+Alt+F');

    // Simulate shortcut trigger
    const triggerFn = registered.get('CommandOrControl+Alt+F');
    expect(triggerFn).toBeDefined();
    triggerFn?.();

    expect(triggered).toBe(true);
  });

  it('unregisters previous accelerator when re-registering', () => {
    manager.register('CommandOrControl+Alt+F', () => {});
    expect(manager.getCurrentAccelerator()).toBe('CommandOrControl+Alt+F');

    manager.register('Control+Shift+P', () => {});
    expect(manager.getCurrentAccelerator()).toBe('Control+Shift+P');

    expect(globalShortcut.unregister).toHaveBeenCalledWith('CommandOrControl+Alt+F');
  });

  it('handles registration failure gracefully', () => {
    const success = manager.register('Invalid+Key', () => {});
    expect(success).toBe(false);
    expect(manager.getCurrentAccelerator()).toBe(null);
  });

  it('cleans up on destroy()', () => {
    manager.register('CommandOrControl+Alt+F', () => {});
    manager.destroy();

    expect(manager.getCurrentAccelerator()).toBe(null);
    expect(globalShortcut.unregister).toHaveBeenCalledWith('CommandOrControl+Alt+F');
  });
});
