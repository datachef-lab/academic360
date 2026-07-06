import { socketService } from "@/services/socketService.js";

/**
 * Debounced live-update broadcast for the main-console Notifications dashboard
 * (mirrors fees-dashboard.socket.ts). Fired from the backend enqueue funnel;
 * worker-side status flips (SENT/FAILED happen in the notification-system
 * service) are covered by the frontend's periodic silent refresh.
 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleNotificationsDashboardBroadcast(reason: string): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    socketService.sendNotificationsDashboardUpdate({
      updatedAt: new Date().toISOString(),
      reason,
    });
  }, 400);
}
