import { Notification } from 'electron';
import type { TimerPhase } from '../shared/types';

export class NotificationManager {
  public static showPhaseCompleteNotification(
    completedPhase: TimerPhase,
    nextPhase: TimerPhase,
  ): void {
    if (!Notification.isSupported()) return;

    if (completedPhase === 'focus') {
      const isLong = nextPhase === 'long_break';
      const notification = new Notification({
        title: '🎯 Focus Session Complete!',
        body: isLong
          ? 'Exceptional streak! Time for a restorative 15-minute recovery break.'
          : 'Great work! Take a 5-minute break to stretch and hydrate.',
        silent: false,
        urgency: 'normal',
      });
      notification.show();
    } else {
      const notification = new Notification({
        title: '⚡ Break Ended!',
        body: 'Your break has finished. Ready to jump back into deep focus?',
        silent: false,
        urgency: 'normal',
      });
      notification.show();
    }
  }
}
