import { io } from "@/app.js";
import { createLogger } from "@/config/logger.js";

const log = createLogger("idcard-realtime");

/**
 * ID-card realtime events.
 *
 * The Redis adapter is wired in app.ts, so every emit reaches clients on every
 * EC2 instance through pub/sub — the emitter and the receiver need not be on the
 * same node. Multi-instance safe by construction.
 *
 * The payload is always a HINT ({ at, resource, method }), never the row. The
 * ID-card dashboard receives it and invalidates its React Query cache; the
 * refetch that follows hits the same authoritative endpoint as the initial load,
 * so a stale or wrong number can never travel over the socket.
 *
 * Room: `idcard` — every page in the module that wants live updates (the
 * dashboard today) joins this one room.
 */

export type IdCardEventName =
  | "idcard:issue:updated"
  | "idcard:template:updated"
  | "idcard:master:updated";

type EmitOptions = {
  /** Free-form payload; keep small, no PII. */
  detail?: Record<string, unknown>;
};

const IDCARD_ROOM = "idcard";

/** Fire-and-forget: never let a socket failure fail a domain mutation. */
export function emitIdCardEvent(
  event: IdCardEventName,
  opts: EmitOptions = {},
): void {
  try {
    const payload = { at: new Date().toISOString(), ...opts.detail };
    io.to(IDCARD_ROOM).emit(event, payload);
    log.info(
      `emit ${event} -> room [${IDCARD_ROOM}] payload=${JSON.stringify(payload).slice(0, 200)}`,
    );
  } catch (err) {
    log.warn(`emit ${event} failed`, { error: err });
  }
}
