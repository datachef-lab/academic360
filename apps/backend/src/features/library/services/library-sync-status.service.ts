/**
 * Aggregated view of the delta-sync scheduler for the dashboard banner.
 *
 * Everything is stored in DB (`library_sync_scheduler_state`, single-row) so
 * ANY instance can serve /api/library/dashboard/sync-status with the exact
 * same answer, even if a different instance is the one holding the sync lock
 * and running the tick. Per-instance in-memory flags would give wrong
 * answers behind a load balancer.
 *
 * The frontend banner uses:
 *   - `running` + `startedAt`  → elapsed timer ("Syncing for 42s")
 *   - `lastDurationMs`         → expected-remaining estimate
 *   - `lastSyncedAt` + `intervalMinutes` → "Last synced X min ago · Next
 *     sync in ~Y min"
 *
 * The scheduler is single-writer (advisory lock 918360005) so at most one
 * instance ever has running=true; setting the flag is a plain UPSERT.
 *
 * Belt-and-braces against a crashed-mid-tick "stuck running=true":
 * `library-legacy-sync.service.ts` clears the flag in a `finally` block that
 * runs even if the tick throws.
 */

import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";
import { computePlannedSyncTotal } from "./library-legacy-sync.service.js";

const SYNC_INTERVAL_MINUTES = 10;

export type LibrarySyncStatus = {
  running: boolean;
  /** ISO timestamp of when the currently-running tick started, or null. */
  startedAt: string | null;
  /** Wall-clock duration of the most recent complete tick (ms). */
  lastDurationMs: number | null;
  /**
   * Rows the currently-running tick will process across every table (sum of
   * COUNT(*) on each legacy source). Set once at planning phase. Null when
   * no tick is running or planning hasn't completed yet.
   */
  plannedRows: number | null;
  /**
   * Rows the currently-running tick has processed so far (sum of scanned IDs
   * across tables completed). Used with `plannedRows` and `startedAt` to
   * compute an ETA before the first tick has ever finished.
   */
  processedRows: number | null;
  /** ISO timestamp of the newest successful per-table sync, or null. */
  lastSyncedAt: string | null;
  intervalMinutes: number;
  /** ISO timestamp of the next expected tick, or null before any tick. */
  nextSyncAt: string | null;
  /** Rolled-up summary of the most recent tick across every table. */
  lastTickSummary: {
    tables: number;
    rowsUpdated: number;
    rowsRemoved: number;
    rowsScanned: number;
    slowestTableMs: number;
  };
};

/**
 * Ensure the scheduler-state row exists. Called from every write and from
 * getLibrarySyncStatus so a fresh install serves a valid empty payload without
 * blowing up on the SELECT.
 */
export async function ensureSchedulerStateTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS library_sync_scheduler_state (
      -- Single-row constraint via a CHECK-locked PK: only "true" is allowed.
      only_row          boolean PRIMARY KEY DEFAULT true,
      running           boolean NOT NULL DEFAULT false,
      started_at        timestamptz,
      ended_at          timestamptz,
      last_duration_ms  integer,
      planned_rows      integer,
      processed_rows    integer,
      updated_at        timestamptz NOT NULL DEFAULT NOW(),
      CONSTRAINT library_sync_scheduler_state_only_row CHECK (only_row = true)
    )
  `);
  // Backfill columns on installs that predate this schema.
  await db.execute(sql`
    ALTER TABLE library_sync_scheduler_state ADD COLUMN IF NOT EXISTS planned_rows integer
  `);
  await db.execute(sql`
    ALTER TABLE library_sync_scheduler_state ADD COLUMN IF NOT EXISTS processed_rows integer
  `);
  await db.execute(sql`
    INSERT INTO library_sync_scheduler_state (only_row, running)
    VALUES (true, false)
    ON CONFLICT (only_row) DO NOTHING
  `);
}

/**
 * Set planned row count at the start of a tick's planning phase. Also resets
 * processed to 0. The tick then increments processed as each table finishes.
 */
export async function writeSchedulerPlanned(
  plannedRows: number,
): Promise<void> {
  await ensureSchedulerStateTable();
  await db.execute(sql`
    UPDATE library_sync_scheduler_state
       SET planned_rows   = ${plannedRows},
           processed_rows = 0,
           updated_at     = NOW()
     WHERE only_row = true
  `);
}

/** Bump processed_rows by the given delta. Called after each table finishes. */
export async function addSchedulerProcessed(delta: number): Promise<void> {
  if (delta <= 0) return;
  await db.execute(sql`
    UPDATE library_sync_scheduler_state
       SET processed_rows = COALESCE(processed_rows, 0) + ${delta},
           updated_at     = NOW()
     WHERE only_row = true
  `);
}

/**
 * Clear a running=true flag left behind by a process that died mid-tick
 * (nodemon restart, crash) WITHOUT stamping last_duration_ms — the partial
 * elapsed of a crashed tick isn't a real duration and would corrupt the
 * banner's "usually takes ~X" estimate. Only call when the caller has
 * proven no tick is live (e.g. it briefly held the sync advisory lock).
 */
export async function clearStaleSchedulerRunning(): Promise<void> {
  await ensureSchedulerStateTable();
  await db.execute(sql`
    UPDATE library_sync_scheduler_state
       SET running = false, updated_at = NOW()
     WHERE only_row = true AND running = true
  `);
}

/**
 * Write running=true (or false), and stamp started/ended accordingly.
 * Called from `library-legacy-sync.service.ts` around each tick.
 */
export async function writeSchedulerRunning(running: boolean): Promise<void> {
  await ensureSchedulerStateTable();
  if (running) {
    // Reset planned/processed so a fresh tick doesn't inherit the previous
    // tick's counters — planning phase will populate `plannedRows` next.
    await db.execute(sql`
      UPDATE library_sync_scheduler_state
         SET running        = true,
             started_at     = NOW(),
             ended_at       = NULL,
             planned_rows   = NULL,
             processed_rows = 0,
             updated_at     = NOW()
       WHERE only_row = true
    `);
  } else {
    // Compute duration relative to started_at so the number is authoritative
    // regardless of which instance flipped the flag on vs off (it's always
    // the same instance today, but this is future-proof).
    await db.execute(sql`
      UPDATE library_sync_scheduler_state
         SET running          = false,
             ended_at         = NOW(),
             last_duration_ms = CASE
               WHEN started_at IS NULL THEN last_duration_ms
               ELSE (EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000)::int
             END,
             updated_at       = NOW()
       WHERE only_row = true
    `);
  }
}

export async function getLibrarySyncStatus(): Promise<LibrarySyncStatus> {
  await ensureSchedulerStateTable();

  const [schedulerRow, aggregateRow] = await Promise.all([
    db.execute(sql`
      SELECT running, started_at, last_duration_ms, planned_rows, processed_rows, updated_at
      FROM library_sync_scheduler_state
      WHERE only_row = true
    `),
    db.execute(sql`
      SELECT
        COUNT(*)::int                          AS tables,
        MAX(last_success_at)                   AS last_synced_at,
        COALESCE(SUM(last_upserts), 0)::int    AS rows_updated,
        COALESCE(SUM(last_deletes), 0)::int    AS rows_removed,
        COALESCE(SUM(last_scanned), 0)::int    AS rows_scanned,
        COALESCE(MAX(last_duration_ms), 0)::int AS slowest_table_ms,
        -- Sum of per-table durations, used as a fallback estimate for the
        -- whole tick before we've recorded one via library_sync_scheduler_state.
        -- The two are close but not identical (this sum misses the between-
        -- table overhead in one tick); good enough for the banner's ETA.
        COALESCE(SUM(last_duration_ms), 0)::int AS sum_table_ms,
        -- Rows scanned SINCE the current tick started — used as a fallback
        -- for processedRows when the running tick pre-dated the
        -- scheduler-state processed_rows counter.
        COALESCE(SUM(last_scanned) FILTER (WHERE last_success_at >= (
          SELECT started_at FROM library_sync_scheduler_state WHERE only_row = true
        )), 0)::int                            AS scanned_this_tick
      FROM library_sync_state
    `),
  ]);

  const sched = (schedulerRow.rows[0] ?? {}) as {
    running?: boolean;
    started_at?: Date | string | null;
    last_duration_ms?: number | null;
    planned_rows?: number | null;
    processed_rows?: number | null;
    updated_at?: Date | string | null;
  };
  const agg = (aggregateRow.rows[0] ?? {}) as {
    tables?: number;
    last_synced_at?: Date | string | null;
    rows_updated?: number;
    rows_removed?: number;
    rows_scanned?: number;
    slowest_table_ms?: number;
    sum_table_ms?: number;
    scanned_this_tick?: number;
  };

  const toISO = (v: Date | string | null | undefined): string | null =>
    v == null
      ? null
      : v instanceof Date
        ? v.toISOString()
        : new Date(v).toISOString();

  const lastSyncedAt = toISO(agg.last_synced_at);
  const nextSyncAt = lastSyncedAt
    ? new Date(
        new Date(lastSyncedAt).getTime() + SYNC_INTERVAL_MINUTES * 60_000,
      ).toISOString()
    : null;

  // Prefer the scheduler-level duration (whole tick, including between-table
  // overhead). Fall back to the sum of per-table durations from
  // library_sync_state on the very first tick before the scheduler row has a
  // value recorded — otherwise the banner has no "usually takes ~Xs" to show.
  const lastDurationMs =
    sched.last_duration_ms != null && Number(sched.last_duration_ms) > 0
      ? Number(sched.last_duration_ms)
      : agg.sum_table_ms != null && Number(agg.sum_table_ms) > 0
        ? Number(agg.sum_table_ms)
        : null;

  // If the currently-running tick was started under an older build that
  // didn't write `planned_rows`, or if the banner is called between ticks
  // and wants a rough "next sync will process ~N rows" hint, fall back to
  // the live MySQL COUNT(*) total (cached 10 min). Never blocks the
  // response if the fallback throws.
  let plannedRows =
    sched.planned_rows == null ? null : Number(sched.planned_rows);
  if (plannedRows == null || plannedRows === 0) {
    try {
      const total = await computePlannedSyncTotal();
      if (total > 0) plannedRows = total;
    } catch {
      // ignore; leave plannedRows as null and the banner falls back to
      // its historical/typical estimates.
    }
  }

  // Prefer the scheduler-state counter (updated by the new tick code); fall
  // back to summing library_sync_state.last_scanned for rows scanned since
  // the current tick started (so a running tick that pre-dates the new
  // counter still surfaces meaningful progress).
  const processedFromState =
    sched.processed_rows == null ? null : Number(sched.processed_rows);
  const scannedThisTick = Number(agg.scanned_this_tick ?? 0);
  const processedRows =
    processedFromState && processedFromState > 0
      ? processedFromState
      : scannedThisTick > 0
        ? scannedThisTick
        : (processedFromState ?? 0);

  // Stale-running guard: a live tick refreshes updated_at every few seconds
  // (per-batch processed_rows writes), so a running=true row whose
  // updated_at is >10 min old means the process crashed mid-tick before the
  // finally-block could clear the flag. Report it as not running so the
  // banner doesn't show a forever-climbing elapsed with zero progress.
  const STALE_RUNNING_MS = 10 * 60_000;
  const updatedAtMs =
    sched.updated_at == null ? null : new Date(sched.updated_at).getTime();
  const running =
    sched.running === true &&
    (updatedAtMs == null || Date.now() - updatedAtMs < STALE_RUNNING_MS);

  return {
    running,
    startedAt: toISO(sched.started_at),
    lastDurationMs,
    plannedRows,
    processedRows,
    lastSyncedAt,
    intervalMinutes: SYNC_INTERVAL_MINUTES,
    nextSyncAt,
    lastTickSummary: {
      tables: Number(agg.tables ?? 0),
      rowsUpdated: Number(agg.rows_updated ?? 0),
      rowsRemoved: Number(agg.rows_removed ?? 0),
      rowsScanned: Number(agg.rows_scanned ?? 0),
      slowestTableMs: Number(agg.slowest_table_ms ?? 0),
    },
  };
}
