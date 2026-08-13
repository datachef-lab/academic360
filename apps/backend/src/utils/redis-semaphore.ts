import os from "node:os";
import { getRedisCommandClient } from "@/config/redis.js";

/**
 * Fleet-wide worker semaphore (Redis SET-based).
 *
 * The legacy-import orchestrator caps in-process work via `pLimit(35)`, but
 * multiple backend instances behind the ALB each run their own limiter, so N
 * instances × 35 workers can exceed `PG_POOL_MAX=70` under simultaneous
 * uploads and burn through pool connections with timeouts (chaos, not
 * corruption). This semaphore serializes acquisitions across the fleet.
 *
 * Design: each slot is a Redis key `<key>:<slotNumber>` with a TTL. Acquire
 * scans slots 0..capacity-1 and takes the first free one with SET NX EX; the
 * TTL is the crash-safety net (if the holder dies mid-slot, TTL evicts it).
 * Release deletes the specific slot value via compare-and-delete Lua so a
 * >TTL straggler cannot delete a successor's slot.
 *
 * When Redis is unavailable, the caller falls back to their own local limiter
 * (see `refactor-old-migration.service.ts` — the outer `pLimit(35)` stays as
 * the process-local guard).
 */

export interface FleetSlot {
  release: () => Promise<void>;
}

const RELEASE_LUA = `if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end`;

export interface AcquireOptions {
  key: string; // Redis key prefix (e.g. "a360:sem:legacy-import-workers")
  capacity: number;
  slotTtlSec: number; // safety-net for holder crash
  waitForMs?: number; // total time to wait for a slot (default 5 min)
  pollMs?: number; // between scans when full (default 250 ms)
}

/**
 * Acquire one slot. Returns `null` in two indistinguishable "no slot" cases:
 *   (a) Redis is unavailable → caller falls back to its local limiter.
 *   (b) The fleet has been saturated for the full `waitForMs` window →
 *       caller proceeds anyway (deliberate: preferable to hanging an upload
 *       indefinitely; the process-local `pLimit` is still an outer bound).
 *
 * Both cases WARN so a sustained overshoot is visible in logs. The caller's
 * `if (fleetSlot) release()` pattern handles null cleanly, so there is a
 * single "no slot" code path — no sentinel object to distinguish.
 */
export async function acquireFleetSlot(
  opts: AcquireOptions,
): Promise<FleetSlot | null> {
  const redis = getRedisCommandClient();
  if (!redis) return null;

  const {
    key,
    capacity,
    slotTtlSec,
    waitForMs = 5 * 60 * 1000,
    pollMs = 250,
  } = opts;
  if (capacity <= 0) throw new Error("acquireFleetSlot: capacity must be > 0");

  const token = `${os.hostname()}-${process.pid}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const deadline = Date.now() + waitForMs;

  while (Date.now() < deadline) {
    for (let i = 0; i < capacity; i++) {
      const slotKey = `${key}:${i}`;
      try {
        const ok = await redis.set(slotKey, token, {
          NX: true,
          EX: slotTtlSec,
        });
        if (ok === "OK") {
          const release = async (): Promise<void> => {
            try {
              await redis.eval(RELEASE_LUA, {
                keys: [slotKey],
                arguments: [token],
              });
            } catch (e) {
              console.error(
                `[fleet-semaphore] release failed for ${slotKey}:`,
                (e as Error)?.message,
              );
            }
          };
          return { release };
        }
      } catch (e) {
        console.error(
          `[fleet-semaphore] acquire error on ${slotKey}, degrading to no-slot:`,
          (e as Error)?.message,
        );
        return null; // Redis hiccup → caller falls back to local limiter
      }
    }
    await sleep(pollMs + Math.floor(Math.random() * 100));
  }

  // Fleet fully saturated for `waitForMs`. Return null (same code path as
  // "Redis unavailable") so the caller proceeds under only its process-local
  // pLimit — hanging the upload indefinitely is worse than briefly
  // overshooting the fleet cap. WARN so operators see the overshoot.
  console.warn(
    `[fleet-semaphore] SATURATED: no slot on ${opts.key} after ${waitForMs}ms — worker proceeding without fleet slot; fleet cap briefly exceeded`,
  );
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
