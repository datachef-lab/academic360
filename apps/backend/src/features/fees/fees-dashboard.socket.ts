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
    socketService.emitFeeMisRefresh(reason);
    void broadcastFeeDependentTrackerTabs(reason);
  }, 400);
}

/**
 * Realtime-tracker tabs whose numbers are derived from fee state must refresh
 * whenever fees change. Hooking this here — rather than at each of the ~8 fee
 * mutation call sites — means every current AND future fee mutation that already
 * refreshes the fees dashboard also refreshes the tracker, for free.
 *
 * Only the "exam_form_declaration" tab is scheduled here: its "Fee Pending / Due"
 * and "Fee Declarations" columns both derive from the unpaid fee-mapping
 * predicate (`buildFeeDueExistsSql`). The "fee_mis" tab is deliberately NOT
 * scheduled — `emitFeeMisRefresh` above already tells every Fee MIS viewer to
 * refetch, so adding it would double up the work.
 *
 * No academic-year-scoped room is fired: the reason string carries no year and
 * resolving one would mean a DB query on the payment path. The unfiltered room
 * plus the global `exam_form_declaration_refresh` (emitted by
 * `pushRealtimeTrackerSnapshot` for any reason other than "subscribe") is what
 * actually reaches viewers whose filter hash does not match, so scoped rooms buy
 * nothing here.
 *
 * Lazy import + try/catch: a broadcast failure must never fail a payment.
 */
async function broadcastFeeDependentTrackerTabs(reason: string): Promise<void> {
  try {
    const { scheduleRealtimeTrackerBroadcast } =
      await import("@/features/realtime-tracker/realtime-tracker.socket.js");
    scheduleRealtimeTrackerBroadcast("exam_form_declaration", reason, {});
  } catch (e) {
    console.error(
      "[fees-dashboard] tracker broadcast failed:",
      (e as Error)?.message,
    );
  }
}
