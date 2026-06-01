import { socketService } from "@/services/socketService.js";

export type FeesDashboardSocketPayload = {
  updatedAt: string;
  reason: string;
};

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleFeesDashboardBroadcast(reason: string): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    socketService.sendFeesDashboardUpdate({
      updatedAt: new Date().toISOString(),
      reason,
    });
  }, 1200);
}
