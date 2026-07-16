import { sql } from "drizzle-orm";
import { db } from "@/db/index.js";

/**
 * Concurrency helpers for the legacy-import path (and any other code that
 * get-or-creates shared master rows from parallel workers).
 *
 * Two treatments, picked by whether the target table has a DB unique
 * constraint on its natural key:
 *  - NO constraint  -> getOrCreateWithLock(): a Postgres advisory lock
 *    serializes the miss path so exactly one row is created. Works across
 *    processes/hosts (prod runs multiple instances behind the ALB).
 *  - HAS constraint -> findOrCreate(): optimistic insert; on a 23505
 *    unique-violation, re-find and return the row the winner created.
 *
 * Deadlock rule: a critical section holds exactly ONE advisory lock and must
 * never call another lock-taking function while holding it. Nested
 * db.transaction calls check out DIFFERENT pool connections, and advisory
 * locks are only re-entrant within one session — nesting self-deadlocks.
 */

/**
 * Run `fn` while holding a transaction-scoped advisory lock derived from
 * `key`. Blocks until the lock is granted; auto-released on commit/rollback.
 * A hashtext() collision between two keys only over-serializes — never
 * corrupts.
 */
export async function withAdvisoryXactLock<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${key}))`);
    return fn();
  });
}

/**
 * Double-checked get-or-create for tables WITHOUT a unique constraint on the
 * natural key. Hot path is a plain find (no lock). On a miss, the advisory
 * lock serializes concurrent creators; the re-find inside the lock sees any
 * row a previous holder committed (find/create run on their own autocommit
 * connections, which commit before the lock transaction releases).
 */
export async function getOrCreateWithLock<T>(
  key: string,
  find: () => Promise<T | undefined>,
  create: () => Promise<T>,
): Promise<T> {
  const existing = await find();
  if (existing !== undefined && existing !== null) return existing;
  return withAdvisoryXactLock(key, async () => {
    const recheck = await find();
    if (recheck !== undefined && recheck !== null) return recheck;
    return create();
  });
}

/** True when the error (or its cause) is a Postgres unique violation. */
export function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; cause?: { code?: string } };
  return e.code === "23505" || e.cause?.code === "23505";
}

/**
 * Get-or-create for tables WITH a unique constraint on the natural key:
 * find, else try create; if a concurrent worker won the race (23505),
 * re-find and return the winner's row.
 */
export async function findOrCreate<T>(
  find: () => Promise<T | undefined>,
  create: () => Promise<T>,
): Promise<T> {
  const existing = await find();
  if (existing !== undefined && existing !== null) return existing;
  try {
    return await create();
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    const winner = await find();
    if (winner !== undefined && winner !== null) return winner;
    throw err;
  }
}
