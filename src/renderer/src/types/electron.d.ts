import type { HushLoopAPI } from '@shared/types/ipc';

declare global {
  interface Window {
    hushLoopAPI?: HushLoopAPI;
  }
}

export {};
