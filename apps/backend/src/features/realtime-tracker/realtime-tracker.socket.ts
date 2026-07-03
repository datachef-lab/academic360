import { createHash } from "crypto";
import { socketService } from "@/services/socketService.js";
import {
  canonicalRealtimeTrackerFilters,
  type RealtimeTrackerFilters,
} from "@/utils/realtime-tracker-filters.js";
import {
  getAffiliationRegistrationData,
  getFeeMisData,
} from "./services/realtime-tracker.service.js";

export type RealtimeTrackerTab = "affiliation" | "fee_mis";

function stableFilterKey(filters: RealtimeTrackerFilters): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalRealtimeTrackerFilters(filters)))
    .digest("hex")
    .slice(0, 16);
}

export function getRealtimeTrackerRoomName(
  tab: RealtimeTrackerTab,
  filters: RealtimeTrackerFilters,
): string {
  return `realtime_tracker:${tab}:${stableFilterKey(filters)}`;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced broadcast after registration or fee activity. */
export function scheduleRealtimeTrackerBroadcast(
  tab: RealtimeTrackerTab,
  reason: string,
  filters: RealtimeTrackerFilters = {},
): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void pushRealtimeTrackerSnapshot(tab, filters, reason);
  }, 400);
}

export async function pushRealtimeTrackerSnapshot(
  tab: RealtimeTrackerTab,
  filters: RealtimeTrackerFilters,
  reason: string,
): Promise<void> {
  try {
    if (tab === "affiliation") {
      const payload = await getAffiliationRegistrationData(filters);
      socketService.sendAffiliationRegistrationUpdate(
        filters as Record<string, unknown>,
        payload as Record<string, unknown>,
        reason,
      );
      // The room above only reaches viewers whose filter hash matches the
      // broadcast's exactly — with the sidebar's rich default filters that
      // almost never happens. Also tell EVERY tracker viewer to refetch with
      // their own filters (the global-refresh pattern that makes Fee MIS
      // reliable). Skip subscribe-time snapshots: those are one-client
      // catch-ups, not data changes.
      if (reason !== "subscribe") {
        socketService.emitAffiliationRefresh(reason);
      }
      return;
    }
    const payload = await getFeeMisData(filters);
    socketService.sendFeeMisUpdate(
      filters as Record<string, unknown>,
      payload as Record<string, unknown>,
      reason,
    );
  } catch (e) {
    console.error("[realtime-tracker] broadcast failed:", e);
  }
}
