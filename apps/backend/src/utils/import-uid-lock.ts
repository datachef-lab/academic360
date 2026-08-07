import os from "os";
import { getRedisCommandClient } from "@/config/redis.js";

/**
 * Per-UID lock for the legacy student import, so the same UID appearing in
 * two uploads (possibly from different machines / backend instances) is never
 * processed twice at once. The lock VALUE carries the holder's identity so a
 * conflicting upload can tell its user WHO is already importing that UID.
 *
 * Redis path mirrors the idcard-sync lock (SET NX EX + compare-and-delete);
 * when Redis is absent or errors, a module-level Map keeps the guarantee
 * within this process (dev/staging run a single backend process).
 */

export type ImportUidLockHolder = {
  userId: string | null;
  userName: string | null;
  startedAt: string; // ISO
};

type StoredLock = ImportUidLockHolder & { token: string };

const LOCK_PREFIX = "a360:lock:import-uid:";
// Safety net if the holder dies mid-import. A single UID takes ~40-120s, so
// 10 minutes covers even a heavily-loaded run without orphaning UIDs long.
const LOCK_TTL_SEC = 600;

// Delete only if we still hold the lock (value unchanged) — a >TTL straggler
// must not delete a successor's lock.
const RELEASE_LUA = `if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end`;

const inProcessLocks = new Map<string, StoredLock>();

export type AcquireImportUidLockResult =
  | { acquired: true; release: () => Promise<void> }
  | { acquired: false; holder: ImportUidLockHolder | null };

export async function acquireImportUidLock(
  uid: string,
  holder: { userId?: string | null; userName?: string | null },
): Promise<AcquireImportUidLockResult> {
  const key = `${LOCK_PREFIX}${uid}`;
  const stored: StoredLock = {
    token: `${os.hostname()}-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userId: holder.userId ?? null,
    userName: holder.userName ?? null,
    startedAt: new Date().toISOString(),
  };
  const serialized = JSON.stringify(stored);

  const redis = getRedisCommandClient();
  if (redis) {
    try {
      const ok = await redis.set(key, serialized, {
        NX: true,
        EX: LOCK_TTL_SEC,
      });
      if (ok === "OK") {
        return {
          acquired: true,
          release: async () => {
            try {
              await redis.eval(RELEASE_LUA, {
                keys: [key],
                arguments: [serialized],
              });
            } catch (e) {
              console.error(
                `[import-uid-lock] release failed for ${uid}:`,
                (e as Error)?.message,
              );
            }
          },
        };
      }
      return { acquired: false, holder: await readHolder(redis, key) };
    } catch (e) {
      // Redis hiccup mid-upload: degrade to the in-process lock rather than
      // failing the whole file (unlike idcard-sync, skipping is worse here).
      console.error(
        `[import-uid-lock] redis error for ${uid}, using in-process lock:`,
        (e as Error)?.message,
      );
    }
  }

  if (!warnedAboutMapFallback) {
    warnedAboutMapFallback = true;
    console.warn(
      "[import-uid-lock] Redis unavailable — using in-process Map fallback. " +
        "This is fine on a single node but WILL race across a multi-instance fleet.",
    );
  }
  const existing = inProcessLocks.get(uid);
  if (existing) {
    const { token: _token, ...holderInfo } = existing;
    return { acquired: false, holder: holderInfo };
  }
  inProcessLocks.set(uid, stored);
  return {
    acquired: true,
    release: async () => {
      const current = inProcessLocks.get(uid);
      if (current?.token === stored.token) inProcessLocks.delete(uid);
    },
  };
}

let warnedAboutMapFallback = false;

/**
 * Acquire with bounded retry. If the UID is held by someone else, back off
 * (jittered) and try again a few times before giving up. Closes the
 * silent-skip class where instance A crashes mid-import (leaves a UID
 * Redis-locked for the full TTL) — the retry lets a partner import through
 * once A's lock either releases normally or expires.
 *
 * Total wait ≤ maxAttempts × avg(backoffMs) so a genuinely-stuck UID still
 * surfaces to the operator's error report reasonably fast.
 */
export async function waitForImportUidLock(
  uid: string,
  holder: { userId?: string | null; userName?: string | null },
  opts?: { maxAttempts?: number; backoffMsSchedule?: number[] },
): Promise<AcquireImportUidLockResult & { attempts: number }> {
  const maxAttempts = Math.max(1, opts?.maxAttempts ?? 3);
  // 2s, 5s, 12s — gives roughly 20s of headroom for a partner import to
  // release a slow UID's lock; anything longer than that isn't a partner run
  // but a stuck holder we want to surface.
  const schedule = opts?.backoffMsSchedule ?? [2000, 5000, 12000];

  let lastResult: AcquireImportUidLockResult = {
    acquired: false,
    holder: null,
  };
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastResult = await acquireImportUidLock(uid, holder);
    if (lastResult.acquired) {
      return { ...lastResult, attempts: attempt };
    }
    if (attempt < maxAttempts) {
      const base =
        schedule[attempt - 1] ?? schedule[schedule.length - 1] ?? 5000;
      const jitter = Math.floor(Math.random() * Math.min(1000, base / 3));
      await new Promise((r) => setTimeout(r, base + jitter));
    }
  }
  return { ...lastResult, attempts: maxAttempts };
}

/**
 * Which of these UIDs are currently locked by an import, and by whom.
 * Used by the pre-check endpoint so the uploader is warned BEFORE starting.
 */
export async function getImportUidLockHolders(
  uids: string[],
): Promise<Map<string, ImportUidLockHolder>> {
  const holders = new Map<string, ImportUidLockHolder>();
  if (uids.length === 0) return holders;

  const redis = getRedisCommandClient();
  if (redis) {
    try {
      const values = await redis.mGet(uids.map((u) => `${LOCK_PREFIX}${u}`));
      values.forEach((v, i) => {
        const parsed = parseStored(v);
        if (parsed) {
          const { token: _token, ...holderInfo } = parsed;
          holders.set(uids[i]!, holderInfo);
        }
      });
      return holders;
    } catch (e) {
      console.error(
        "[import-uid-lock] mget failed, falling back to in-process view:",
        (e as Error)?.message,
      );
    }
  }

  for (const uid of uids) {
    const stored = inProcessLocks.get(uid);
    if (stored) {
      const { token: _token, ...holderInfo } = stored;
      holders.set(uid, holderInfo);
    }
  }
  return holders;
}

async function readHolder(
  redis: NonNullable<ReturnType<typeof getRedisCommandClient>>,
  key: string,
): Promise<ImportUidLockHolder | null> {
  try {
    const parsed = parseStored(await redis.get(key));
    if (!parsed) return null;
    const { token: _token, ...holderInfo } = parsed;
    return holderInfo;
  } catch {
    return null;
  }
}

function parseStored(value: string | null | undefined): StoredLock | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as StoredLock;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
