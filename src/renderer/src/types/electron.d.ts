import type { FocusDeckAPI } from '@shared/types/ipc';

declare global {
  interface Window {
    focusDeckAPI?: FocusDeckAPI;
  }
}

export {};
