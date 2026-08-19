import { socketService } from "@/services/socketService.js";
import { bumpSnapshotEpoch } from "@/services/snapshot-cache.js";
import {
  stableRealtimeTrackerFilterKey as stableFilterKey,
  type RealtimeTrackerFilters,
} from "@/utils/realtime-tracker-filters.js";
import {
  getAffiliationRegistrationDataCached,
  getExamFormDeclarationDataCached,
  getFeeMisDataCached,
} from "./services/realtime-tracker.service.js";

export type RealtimeTrackerTab =
  | "affiliation"
  | "fee_mis"
  | "exam_form_declaration";

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
  // Invalidate BEFORE the debounce: any read landing in the 400ms window must
  // already see the new epoch and recompute. "cross_instance" is a relay of a
  // mutation that already bumped on the originating instance — bumping again
  // would orphan the entry that instance just cached and double the work.
  if (reason !== "cross_instance") bumpSnapshotEpoch(`rt:${tab}`);
  const existing = debounceTimers.get(tab);
  if (existing) clearTimeout(existing);
  debounceTimers.set(
    tab,
    setTimeout(() => {
      debounceTimers.delete(tab);
      void fireSnapshot(tab, filters, reason);
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
  // Same invalidation rule as the debounced variant (see comment there).
  if (reason !== "cross_instance") bumpSnapshotEpoch(`rt:${tab}`);
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
    void fireSnapshot(tab, filters, reason);
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
      void fireSnapshot(tab, filters, reason);
    }, minIntervalMs - elapsed),
  );
}

/**
 * Fire and signal: emit this instance's snapshot and signal all other instances
 * to also fire their local throttles. Idle instances emit immediately (leading edge).
 */
async function fireSnapshot(
  tab: RealtimeTrackerTab,
  filters: RealtimeTrackerFilters,
  reason: string,
): Promise<void> {
  // Signal other instances to also fire their throttle for this tab
  socketService.crossInstanceSignal("tracker_update_needed", { tab });
  // Then emit this instance's snapshot
  await pushRealtimeTrackerSnapshot(tab, filters, reason);
}

export async function pushRealtimeTrackerSnapshot(
  tab: RealtimeTrackerTab,
  filters: RealtimeTrackerFilters,
  reason: string,
): Promise<void> {
  try {
    if (tab === "affiliation") {
      const payload = await getAffiliationRegistrationDataCached(filters);
      socketService.sendAffiliationRegistrationUpdate(
        filters as Record<string, unknown>,
        { ...payload, _ts: Date.now() } as Record<string, unknown>,
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
    if (tab === "exam_form_declaration") {
      const payload = await getExamFormDeclarationDataCached(filters);
      socketService.sendExamFormDeclarationUpdate(
        filters as Record<string, unknown>,
        { ...payload, _ts: Date.now() } as Record<string, unknown>,
        reason,
      );
      // Same as the other tabs: the filter-hash room only reaches viewers whose
      // filters match the broadcast's exactly, so also tell EVERY viewer to
      // refetch with their own filters. Skip subscribe-time catch-ups.
      if (reason !== "subscribe") {
        socketService.emitExamFormDeclarationRefresh(reason);
      }
      return;
    }
    const payload = await getFeeMisDataCached(filters);
    socketService.sendFeeMisUpdate(
      filters as Record<string, unknown>,
      { ...payload, _ts: Date.now() } as Record<string, unknown>,
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
