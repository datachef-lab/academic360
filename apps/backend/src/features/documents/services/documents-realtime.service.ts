import { createLogger } from "@/config/logger.js";

const log = createLogger("documents-realtime");

/**
 * Documents module realtime events.
 *
 * The Redis adapter is wired at [app.ts:403], so every `io.to(room).emit(...)`
 * fans out across every backend instance behind the load balancer — the
 * emitter and the receiver do not need to be on the same node.
 *
 * Payloads are HINTS ({ at, meta }), never the row itself. Clients receive
 * the event and invalidate their React Query keys; the refetch that follows
 * hits the authoritative REST endpoint, so we can never ship stale or wrong
 * data through the socket.
 *
 * Rooms:
 *   - `documents`                    — every page in the module (batch
 *                                      receipts list, ledger, etc.)
 *   - `documents:batch:<batchId>`    — a specific batch (edit dialog open
 *                                      on that row, or a batch-scoped list)
 *   - `documents:student:<studentId>` — a specific student's ledger page
 */

export type DocumentsEventName =
  | "documents:batch-receipt:updated"
  | "documents:ledger:updated";

type EmitOptions = {
  batchId?: number | null;
  studentId?: number | null;
  /** Free-form payload; keep small, no PII. */
  detail?: Record<string, unknown>;
};

function targets(opts: EmitOptions): string[] {
  const rooms = ["documents"];
  if (opts.batchId != null) rooms.push(`documents:batch:${opts.batchId}`);
  if (opts.studentId != null) rooms.push(`documents:student:${opts.studentId}`);
  return rooms;
}

/**
 * Fire-and-forget: never let a socket failure fail a domain mutation.
 *
 * `io` is imported dynamically because this module is transitively pulled in
 * by `document-ledger.service.ts`, which sits in the boot-migrations chain
 * loaded during `db/index.ts` initialisation. A top-level `import from
 * "@/app.js"` would close the cycle `app.ts → db/index → boot-migrations →
 * ledger service → this file → app.ts` and re-enter `db/index.ts` before
 * `db` finished initialising, tripping TDZ inside `allowedOrigins.ts`. The
 * lazy import defers the app.js pull-in to first-emit time, well after
 * bootstrap has finished. Emits that fire during boot backfills (before io
 * exists) log a warning and drop, which is fine because no clients are
 * connected yet.
 */
export function emitDocumentsEvent(
  event: DocumentsEventName,
  opts: EmitOptions = {},
): void {
  const payload = { at: new Date().toISOString(), ...opts.detail };
  const rooms = targets(opts);
  void (async () => {
    try {
      const { io } = await import("@/app.js");
      if (!io) {
        log.debug(`emit ${event} skipped — io not yet available`);
        return;
      }
      for (const room of rooms) io.to(room).emit(event, payload);
      log.info(
        `emit ${event} -> rooms [${rooms.join(", ")}] payload=${JSON.stringify(
          payload,
        ).slice(0, 200)}`,
      );
    } catch (err) {
      log.warn(`emit ${event} failed`, { error: err });
    }
  })();
}
