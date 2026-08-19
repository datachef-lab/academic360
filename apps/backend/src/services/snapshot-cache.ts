import { getRedisCommandClient } from "@/config/redis.js";
import { createLogger } from "@/config/logger.js";

const log = createLogger("snapshot-cache");

/**
 * Epoch-keyed shared snapshot cache for expensive dashboard/tracker
 * aggregations (2026-08-19 RDS incident follow-up: N viewers each recomputing
 * the same whole-table aggregation pinned the DB at 99% CPU).
 *
 * Staleness contract (hard requirement): a mutation must never be masked.
 * The epoch is PART of the data key — `bumpSnapshotEpoch(scope)` INCRs the
 * epoch counter, so every reader (which always fetches the epoch first)
 * immediately stops seeing pre-mutation entries, and an in-flight computation
 * started under the old epoch writes to a key no future reader can construct.
 * There is no delete-then-set window and nothing to race. The TTL is only a
 * memory bound, not a staleness bound.
 *
 * Redis-down behavior: fail OPEN — compute directly (deduped per process via
 * the in-flight map). Requests never fail and nothing stale can be served
 * because nothing is cached.
 */

const epochKey = (scope: string) => `a360:cache:epoch:${scope}`;
const dataKey = (scope: string, epoch: string, variant: string) =>
  `a360:cache:${scope}:${epoch}:${variant}`;

// Per-process single-flight: concurrent requests for the same key share one
// computation. Keyed by the full data key (epoch included), so a bump
// naturally orphans old flights; bump also clears them eagerly.
const inflight = new Map<string, Promise<unknown>>();

let warnedRedisDown = false;

function singleFlight<T>(key: string, compute: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const p = compute().finally(() => {
    if (inflight.get(key) === p) inflight.delete(key);
  });
  inflight.set(key, p);
  return p;
}

export async function getCachedSnapshot<T>(
  scope: string,
  variantKey: string,
  ttlSec: number,
  compute: () => Promise<T>,
): Promise<T> {
  const redis = getRedisCommandClient();
  if (!redis) {
    if (!warnedRedisDown) {
      warnedRedisDown = true;
      log.warn(`Redis unavailable — ${scope} served by direct compute`);
    }
    return singleFlight(dataKey(scope, "noredis", variantKey), compute);
  }

  try {
    const epoch = (await redis.get(epochKey(scope))) ?? "0";
    const key = dataKey(scope, epoch, variantKey);
    const cached = await redis.get(key);
    if (cached !== null) return JSON.parse(cached) as T;

    return await singleFlight(key, async () => {
      const value = await compute();
      try {
        await redis.set(key, JSON.stringify(value), { EX: ttlSec });
      } catch {
        // cache write is best-effort
      }
      return value;
    });
  } catch (error) {
    if (!warnedRedisDown) {
      warnedRedisDown = true;
      log.warn(`Redis error — ${scope} served by direct compute`, { error });
    }
    return singleFlight(dataKey(scope, "noredis", variantKey), compute);
  }
}

/**
 * Invalidate a scope after a mutation. Fire-and-forget by design: it must be
 * called BEFORE any broadcast debounce so the recompute (and any reader that
 * lands meanwhile) sees the new epoch. The ~1ms INCR round-trip window is
 * covered by the follow-up `*_refresh` push, same as any read racing a commit.
 */
export function bumpSnapshotEpoch(scope: string): void {
  const prefix = `a360:cache:${scope}:`;
  for (const key of [...inflight.keys()]) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
  const redis = getRedisCommandClient();
  if (!redis) return;
  redis.incr(epochKey(scope)).catch((error) => {
    log.debug(`epoch bump failed for ${scope}`, { error });
  });
}
