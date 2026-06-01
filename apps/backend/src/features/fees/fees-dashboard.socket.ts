import { socketService } from "@/services/socketService.js";
import { clearFeesDashboardScopeCache } from "./services/fees-dashboard.service.js";

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
    clearFeesDashboardScopeCache();
    socketService.sendFeesDashboardUpdate({
      updatedAt: new Date().toISOString(),
      reason,
    });
  }, 400);
}
