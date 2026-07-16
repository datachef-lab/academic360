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

// Debounce timers are keyed PER TAB. A single shared timer meant emitting two
// tabs back-to-back (e.g. affiliation + fee_mis after a legacy import) clobbered
// the first — the second call cleared its timer before it fired.
const debounceTimers = new Map<
  RealtimeTrackerTab,
  ReturnType<typeof setTimeout>
>();

/** Debounced broadcast after registration or fee activity. */
export function scheduleRealtimeTrackerBroadcast(
  tab: RealtimeTrackerTab,
  reason: string,
  filters: RealtimeTrackerFilters = {},
): void {
  const existing = debounceTimers.get(tab);
  if (existing) clearTimeout(existing);
  debounceTimers.set(
    tab,
    setTimeout(() => {
      debounceTimers.delete(tab);
      void pushRealtimeTrackerSnapshot(tab, filters, reason);
    }, 400),
  );
}

// Throttle state for long-running batch jobs (per tab).
const throttleLastAt = new Map<RealtimeTrackerTab, number>();
const throttleTrailing = new Map<
  RealtimeTrackerTab,
  ReturnType<typeof setTimeout>
>();

/**
 * Throttled broadcast for long-running batch jobs (e.g. the legacy student
 * import). Unlike the debounced variant — which, in a tight loop, keeps
 * resetting and only fires once the loop finishes — this fires on the LEADING
 * edge and then at most once per `minIntervalMs`, with a guaranteed trailing
 * flush. So a viewer watching the tracker sees the stats climb DURING the run,
 * one student at a time (paced), instead of jumping only at the end.
 */
export function scheduleRealtimeTrackerThrottledBroadcast(
  tab: RealtimeTrackerTab,
  reason: string,
  filters: RealtimeTrackerFilters = {},
  minIntervalMs = 1500,
): void {
  const now = Date.now();
  const last = throttleLastAt.get(tab) ?? 0;
  const elapsed = now - last;
  if (elapsed >= minIntervalMs) {
    throttleLastAt.set(tab, now);
    const trailing = throttleTrailing.get(tab);
    if (trailing) {
      clearTimeout(trailing);
      throttleTrailing.delete(tab);
    }
    void pushRealtimeTrackerSnapshot(tab, filters, reason);
    return;
  }
  // Too soon since the last emit — schedule a single trailing flush so the
  // most recent state still lands.
  const existing = throttleTrailing.get(tab);
  if (existing) clearTimeout(existing);
  throttleTrailing.set(
    tab,
    setTimeout(() => {
      throttleTrailing.delete(tab);
      throttleLastAt.set(tab, Date.now());
      void pushRealtimeTrackerSnapshot(tab, filters, reason);
    }, minIntervalMs - elapsed),
  );
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
    // Same as affiliation: the room above only reaches viewers whose filter
    // hash matches exactly, which rarely happens. Tell EVERY Fee MIS viewer to
    // refetch with their own filters. Skip subscribe-time catch-ups.
    if (reason !== "subscribe") {
      socketService.emitFeeMisRefresh(reason);
    }
  } catch (e) {
    console.error("[realtime-tracker] broadcast failed:", e);
  }
}
