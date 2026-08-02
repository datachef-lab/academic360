/**
 * Ongoing delta sync from the legacy IRP MySQL database into the new Postgres.
 *
 * WHY THIS EXISTS. The initial `loadLibrary` in `old-irp-data.ts` is a one-shot
 * import guarded by a boot-migration marker; every edit made in old IRP after
 * that first run is otherwise invisible to the new DB. This service runs every
 * 10 minutes to reconcile — it walks each legacy table, routes new/changed IDs
 * through the existing resolvers (find-or-create → update in place), and diffs
 * full-ID sets to reflect deletes.
 *
 * READ-ONLY OLD DB. Every query issued against `mysqlConnection` here goes
 * through `mysqlSelectQuery()`, which asserts the SQL starts with SELECT after
 * trimming/comments. Nothing in this file writes to MySQL, and the assertion
 * catches it if a future edit tries to.
 *
 * WHAT IT REUSES. The `arr` in `old-irp-data.ts` already owns the (legacy
 * table → resolver → filtered SELECT) mapping, so the sync loop is essentially
 * "for each entry in arr, run its resolver on any ID that came back this
 * tick". The `legacyRow<T>()` cache and per-row worker pool defined there are
 * used verbatim.
 *
 * DELETES. MySQL doesn't tell us what was deleted, so on each tick we also
 * fetch the FULL id set from the source (`SELECT id FROM {table}`, no filter),
 * then delete any new-DB rows whose `legacy_<x>_id` is not in that set. Delete
 * order matches the reverse of the loader's dependency layers so FKs don't
 * trip. FK violations are logged and left for the next tick to retry.
 *
 * SCHEDULING. `startLibrarySyncScheduler()` registers a 30-second first tick
 * then a 10-minute interval. Advisory lock 918360005 keeps the scheduler
 * single-writer across EC2 instances. The lock is also released between ticks
 * — an instance that grabbed the previous tick doesn't hold it, so any
 * instance can win the next one.
 */

import { pool, mysqlConnection, db } from "@/db/index.js";
import { sql } from "drizzle-orm";
import { createLogger } from "@/config/logger.js";
import { getBootMigrationMarker } from "@/db/boot-migration-markers.js";
import { arr as LEGACY_TABLE_MAP, LOAD_LAYERS } from "../old-irp-data.js";
import {
  LIBRARY_LEGACY_MAP,
  type LibraryLegacyMapping,
} from "./library-legacy-mapping.js";
import {
  emitLibraryEvent,
  type LibraryEventName,
} from "./library-realtime.service.js";
import {
  addSchedulerProcessed,
  clearStaleSchedulerRunning,
  writeSchedulerPlanned,
  writeSchedulerRunning,
} from "./library-sync-status.service.js";

const log = createLogger("library-legacy-sync");

const SYNC_LOCK_KEY = 918_360_005;
const INITIAL_LOAD_MARKER = "library-legacy-load-v1";
/** Poll cadence for the scheduler. */
const SYNC_INTERVAL_MS = 10 * 60 * 1000;
/** Delay before first tick so the initial-load lock has time to clear. */
const SYNC_STARTUP_DELAY_MS = 30 * 1000;
/** Max concurrent per-table resolvers within one sync tick. */
const ROW_WORKERS = 8;
/** Cap on how many rows we route through resolvers per table per tick. */
const MAX_ROWS_PER_TABLE_PER_TICK = 20_000;

// Referenced so future edits know to keep the delete priorities in
// `library-legacy-mapping.ts` in step with the loader's layer graph.
void LOAD_LAYERS;

/** Alias — the shared map is authoritative. */
type SyncMapping = LibraryLegacyMapping;
const SYNC_MAP = LIBRARY_LEGACY_MAP;

/**
 * Realtime event to emit for each legacy table after a sync pass produces
 * upserts or deletes. The client's `useLibraryRealtime` hook invalidates
 * `library-*` query keys on any of these, so the specific event doesn't have
 * to be per-panel accurate — it just needs to fire. Choosing the most
 * "obvious" event per table anyway so book-detail / circulation-detail rooms
 * (`library:book:<bookId>`, `library:user:<userId>`) can subscribe later
 * without server-side changes.
 */
const SYNC_EVENT_BY_TABLE: Record<string, LibraryEventName> = {
  issuereturn: "library:circulation:updated",
  copydetailsub: "library:copy:updated",
  bookentry: "library:book:updated",
  libentryexit: "library:entry-exit:updated",
  // Everything else is a "master" as far as the dashboard is concerned —
  // authors, publishers, vendors, holidays, journals, series, statuses, etc.
  // Fine-grained events for those aren't defined; `library:master:updated`
  // triggers the same invalidator on the client.
};

/**
 * Enforced-SELECT wrapper around `mysqlConnection.query`. Rejects any
 * statement whose first non-whitespace, non-comment token isn't SELECT. The
 * old IRP DB must remain read-only from this codebase, so a stray UPDATE /
 * DELETE / DDL emitted by any future edit here fails loudly at call time
 * instead of silently mutating the source.
 */
// In-memory cache of MySQL COUNT(*) per legacy source table (capped at
// MAX_ROWS_PER_TABLE_PER_TICK — a tick never processes more). Refreshed
// every 10 min so getLibrarySyncStatus can hand the banner a "planned rows"
// number even between ticks, and so the tick can order tables smallest-first
// without re-counting.
let cachedPlannedCounts: {
  perTable: Map<string, number>;
  total: number;
  at: number;
} | null = null;
const PLANNED_CACHE_TTL_MS = 10 * 60 * 1000;

async function computePlannedSyncCounts(): Promise<{
  perTable: Map<string, number>;
  total: number;
}> {
  if (
    cachedPlannedCounts &&
    Date.now() - cachedPlannedCounts.at < PLANNED_CACHE_TTL_MS
  ) {
    return cachedPlannedCounts;
  }
  const perTable = new Map<string, number>();
  let total = 0;
  await Promise.all(
    SYNC_MAP.map(async (m) => {
      try {
        const [row] = await mysqlSelectQuery<{ c: number }>(
          `SELECT COUNT(*) AS c FROM ${m.legacyTable}`,
        );
        const n = Number(row?.c ?? 0);
        // Cap each table's contribution at the per-tick scan limit —
        // otherwise planned totals 1.6M+ while a tick scans ≤20k/table and
        // the banner's percent/ETA are off by 50x.
        const capped = Number.isFinite(n)
          ? Math.min(n, MAX_ROWS_PER_TABLE_PER_TICK)
          : 0;
        perTable.set(m.legacyTable, capped);
        total += capped;
      } catch (err) {
        log.warn(
          `computePlannedSyncCounts: count failed for ${m.legacyTable}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }),
  );
  cachedPlannedCounts = { perTable, total, at: Date.now() };
  return cachedPlannedCounts;
}

/**
 * Sum of the per-table planned counts. Callable from anywhere (the
 * /sync-status endpoint uses it as a fallback); failures per-table are
 * logged and treated as 0 so a broken count query never poisons the number.
 */
export async function computePlannedSyncTotal(): Promise<number> {
  return (await computePlannedSyncCounts()).total;
}

async function mysqlSelectQuery<T = Record<string, unknown>>(
  raw: string,
  params: unknown[] = [],
): Promise<T[]> {
  const stripped = raw
    .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
    .replace(/^\s*(--[^\n]*\n?)+/g, "") // leading line comments
    .trimStart();
  if (!/^select\b/i.test(stripped)) {
    throw new Error(
      `library-legacy-sync: refusing to run non-SELECT statement against old IRP DB — first token was ${stripped
        .slice(0, 40)
        .replace(/\s+/g, " ")}…`,
    );
  }
  const [rows] = (await mysqlConnection.query(raw, params)) as [T[], unknown];
  return rows;
}

// ── State table ─────────────────────────────────────────────────────────────

async function ensureStateTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS library_sync_state (
      table_name         varchar(120) PRIMARY KEY,
      last_synced_at     timestamp NOT NULL,
      last_success_at    timestamp,
      last_error         text,
      last_upserts       integer NOT NULL DEFAULT 0,
      last_deletes       integer NOT NULL DEFAULT 0,
      last_scanned       integer NOT NULL DEFAULT 0,
      last_duration_ms   integer NOT NULL DEFAULT 0,
      created_at         timestamp NOT NULL DEFAULT NOW(),
      updated_at         timestamp NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS library_sync_state_last_success_at_idx
      ON library_sync_state (last_success_at)
  `);
}

type SyncStateRow = {
  table_name: string;
  last_synced_at: Date;
  last_success_at: Date | null;
  last_error: string | null;
};

async function readSyncState(
  tableName: string,
  fallback: Date,
): Promise<SyncStateRow> {
  const rows = (
    await db.execute(sql`
    SELECT table_name, last_synced_at, last_success_at, last_error
    FROM library_sync_state
    WHERE table_name = ${tableName}
    LIMIT 1
  `)
  ).rows as unknown as SyncStateRow[];
  if (rows[0]) return rows[0];
  await db.execute(sql`
    INSERT INTO library_sync_state (table_name, last_synced_at)
    VALUES (${tableName}, ${fallback})
    ON CONFLICT (table_name) DO NOTHING
  `);
  return {
    table_name: tableName,
    last_synced_at: fallback,
    last_success_at: null,
    last_error: null,
  };
}

async function writeSyncSuccess(
  tableName: string,
  now: Date,
  metrics: {
    upserts: number;
    deletes: number;
    scanned: number;
    durationMs: number;
  },
): Promise<void> {
  await db.execute(sql`
    INSERT INTO library_sync_state (
      table_name, last_synced_at, last_success_at,
      last_error, last_upserts, last_deletes, last_scanned, last_duration_ms,
      updated_at
    )
    VALUES (
      ${tableName}, ${now}, ${now},
      NULL, ${metrics.upserts}, ${metrics.deletes}, ${metrics.scanned}, ${metrics.durationMs},
      NOW()
    )
    ON CONFLICT (table_name) DO UPDATE SET
      last_synced_at    = EXCLUDED.last_synced_at,
      last_success_at   = EXCLUDED.last_success_at,
      last_error        = NULL,
      last_upserts      = EXCLUDED.last_upserts,
      last_deletes      = EXCLUDED.last_deletes,
      last_scanned      = EXCLUDED.last_scanned,
      last_duration_ms  = EXCLUDED.last_duration_ms,
      updated_at        = NOW()
  `);
}

async function writeSyncFailure(
  tableName: string,
  err: unknown,
): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  await db.execute(sql`
    INSERT INTO library_sync_state (table_name, last_synced_at, last_error)
    VALUES (${tableName}, NOW(), ${message})
    ON CONFLICT (table_name) DO UPDATE SET
      last_error = EXCLUDED.last_error,
      updated_at = NOW()
  `);
}

// ── Per-table sync ──────────────────────────────────────────────────────────

type LegacyEntry = (typeof LEGACY_TABLE_MAP)[number];

async function findLegacyEntry(table: string): Promise<LegacyEntry | null> {
  return LEGACY_TABLE_MAP.find((e: LegacyEntry) => e.table === table) ?? null;
}

/**
 * Route each supplied legacy id through its resolver with bounded concurrency.
 * The resolvers are find-or-create so this both loads new rows and updates
 * existing ones — the sync doesn't need a separate "update path".
 */
const PROGRESS_BATCH = 500;

async function upsertIds(
  entry: LegacyEntry,
  ids: number[],
  onProgress?: (delta: number) => void,
): Promise<{ upserted: number; failed: number }> {
  let cursor = 0;
  let upserted = 0;
  let failed = 0;
  // Rows processed since the last onProgress call. Reported every
  // PROGRESS_BATCH rows so the banner's ETA moves DURING a big table, not
  // only after it completes (issuereturn alone can take minutes).
  let sinceReport = 0;
  const report = () => {
    if (sinceReport > 0 && onProgress) {
      onProgress(sinceReport);
      sinceReport = 0;
    }
  };
  const runOne = async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= ids.length) return;
      const id = ids[idx];
      try {
        const res = await entry.fn(id);
        if (res) upserted++;
        else failed++;
      } catch (err) {
        failed++;
        log.warn(
          `resolver ${entry.table} #${id} failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
      sinceReport++;
      if (sinceReport >= PROGRESS_BATCH) report();
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(ROW_WORKERS, ids.length) }, runOne),
  );
  report();
  return { upserted, failed };
}

/**
 * Detect which new-DB rows point at legacy ids that no longer exist upstream,
 * and delete them. Returns the count actually deleted; anything that trips a
 * FK is logged and skipped so the next tick can retry once its dependents
 * are gone.
 */
async function reconcileDeletes(
  mapping: SyncMapping,
  liveLegacyIds: Set<number>,
): Promise<number> {
  const rows = (
    await db.execute(
      sql.raw(`
    SELECT ${mapping.legacyIdColumn} AS legacy_id
    FROM ${mapping.newTable}
    WHERE ${mapping.legacyIdColumn} IS NOT NULL
  `),
    )
  ).rows as Array<{ legacy_id: number }>;
  const toDelete: number[] = [];
  for (const r of rows) {
    const id = Number(r.legacy_id);
    if (Number.isFinite(id) && !liveLegacyIds.has(id)) toDelete.push(id);
  }
  if (toDelete.length === 0) return 0;

  let deleted = 0;
  // Delete one at a time so a single FK failure doesn't abort the whole
  // batch. Slower but safer while we don't yet have a full FK-cascade path.
  for (const id of toDelete) {
    try {
      const res = await db.execute(
        sql.raw(
          `DELETE FROM ${mapping.newTable} WHERE ${mapping.legacyIdColumn} = ${id}`,
        ),
      );
      // pg `execute` returns { rowCount } for DELETE.
      deleted += Number((res as { rowCount?: number }).rowCount ?? 0);
    } catch (err) {
      log.warn(
        `delete skipped for ${mapping.newTable}.${mapping.legacyIdColumn} = ${id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
  return deleted;
}

/**
 * Sync one table:
 *   1. Fetch the filtered "in-scope" id set from old IRP using the loader's
 *      existing SELECT (respects the student-filter joins on issuereturn /
 *      libentryexit).
 *   2. Route those ids through the resolver — resolver is find-or-create so
 *      it inserts new rows and updates existing ones.
 *   3. Fetch the FULL id set (unfiltered) from old IRP for delete detection.
 *      Delete any new-DB row whose legacy id isn't in that set.
 */
async function syncOneTable(
  mapping: SyncMapping,
): Promise<{ changed: boolean; scanned: number }> {
  const started = Date.now();
  try {
    const entry = await findLegacyEntry(mapping.legacyTable);
    if (!entry) {
      log.warn(`no legacy entry found for ${mapping.legacyTable}, skipping`);
      return { changed: false, scanned: 0 };
    }

    const inScopeRows = await mysqlSelectQuery<{ id: number }>(entry.sql);
    const inScopeIds = inScopeRows
      .map((r) => Number(r.id))
      .filter((n) => Number.isFinite(n));
    // Cap per-tick work — a run that returns 200k ids would overrun the
    // 10-minute cadence. Bookmark not needed: the next tick just re-scans.
    const scannedIds = inScopeIds.slice(0, MAX_ROWS_PER_TABLE_PER_TICK);

    // Persist progress mid-table (fire-and-forget so workers never block on
    // the counter write) and nudge the banner at most every 5s.
    let lastProgressEmit = 0;
    const { upserted } = await upsertIds(entry, scannedIds, (delta) => {
      void addSchedulerProcessed(delta).catch(() => undefined);
      const now = Date.now();
      if (now - lastProgressEmit >= 5_000) {
        lastProgressEmit = now;
        emitLibraryEvent("library:sync-status:updated", {
          detail: { at: new Date().toISOString(), running: true },
        });
      }
    });

    // Unfiltered id set for delete detection. Sourced from a plain "SELECT id
    // FROM <table>" — no filter — so anything actually removed upstream shows
    // up as missing regardless of whether it would pass the loader's filter.
    const liveRows = await mysqlSelectQuery<{ id: number }>(
      `SELECT id FROM ${mapping.legacyTable}`,
    );
    const liveIds = new Set<number>(
      liveRows.map((r) => Number(r.id)).filter((n) => Number.isFinite(n)),
    );
    const deleted = await reconcileDeletes(mapping, liveIds);

    const durationMs = Date.now() - started;
    await writeSyncSuccess(mapping.legacyTable, new Date(), {
      upserts: upserted,
      deletes: deleted,
      scanned: scannedIds.length,
      durationMs,
    });
    const changed = upserted > 0 || deleted > 0;
    if (changed) {
      log.info(
        `[${mapping.legacyTable}] scanned=${scannedIds.length} upserts=${upserted} deletes=${deleted} in ${durationMs}ms`,
      );
      // Fire the per-table realtime hint so dashboards pick up the change
      // immediately — the sync writes bypass the HTTP layer, so the usual
      // library-broadcast middleware never sees these writes and would not
      // otherwise emit anything. `useLibraryRealtime` on the client
      // invalidates `library-*` query keys on any of these events.
      const eventName =
        SYNC_EVENT_BY_TABLE[mapping.legacyTable] ?? "library:master:updated";
      emitLibraryEvent(eventName, {
        detail: {
          source: "legacy-sync",
          legacyTable: mapping.legacyTable,
          newTable: mapping.newTable,
          upserts: upserted,
          deletes: deleted,
        },
      });
    }
    return { changed, scanned: scannedIds.length };
  } catch (err) {
    await writeSyncFailure(mapping.legacyTable, err);
    log.warn(
      `[${mapping.legacyTable}] sync failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return { changed: false, scanned: 0 };
  }
}

// ── Tick + scheduler ────────────────────────────────────────────────────────

/**
 * Run one full sync tick. Grabs the advisory lock; if another instance holds
 * it, returns immediately. Also short-circuits when the initial-load marker
 * hasn't been written yet — no point delta-syncing when the base load hasn't
 * completed.
 */
export async function runLibrarySyncTick(): Promise<{
  skipped?: string;
  tables?: number;
}> {
  if ((process.env.LIBRARY_LEGACY_SYNC ?? "").toLowerCase() === "off") {
    return { skipped: "LIBRARY_LEGACY_SYNC=off" };
  }

  const initialMarker = await getBootMigrationMarker(INITIAL_LOAD_MARKER);
  if (!initialMarker) {
    return { skipped: "initial library load hasn't completed yet" };
  }

  const lockClient = await pool.connect();
  let holdsLock = false;
  try {
    const lockRes = await lockClient.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock($1) AS locked",
      [SYNC_LOCK_KEY],
    );
    holdsLock = lockRes.rows[0]?.locked === true;
    if (!holdsLock) return { skipped: "another instance is running the tick" };

    // Bookend the tick so /api/library/dashboard/sync-status can flip the
    // dashboard banner between "Auto-syncing · Next sync in ~N min" and
    // "Syncing for Ns…". State is DB-backed so every instance in the fleet
    // reads the same value (per-instance memory would give wrong answers
    // behind a load balancer).
    await writeSchedulerRunning(true);
    emitLibraryEvent("library:sync-status:updated", {
      detail: { at: new Date().toISOString(), running: true },
    });

    await ensureStateTable();

    // Seed each table's watermark with the initial-load's marker timestamp on
    // first sight (the user picked "initial-load completion time" as the
    // watermark origin). Subsequent runs just carry the previous value
    // forward — the delta filter isn't wired yet (full-scan mode), but the
    // watermark still records "last time we successfully touched this table".
    const fallback = initialMarker.ran_at;
    for (const mapping of SYNC_MAP) {
      await readSyncState(mapping.legacyTable, fallback);
    }

    // Planning phase — hand off to `computePlannedSyncCounts` so the tick
    // and the getLibrarySyncStatus fallback share the same cached numbers.
    const planned = await computePlannedSyncCounts();
    const plannedTotal = planned.total;

    // Sort so tables with more dependents are DELETED last (deletePriority
    // ASC means leaves first). Within the same priority group order by
    // SMALLEST planned count first — the big tables (issuereturn ~200k)
    // spend minutes in their remote in-scope SELECT with zero visible
    // progress; letting the small tables finish first gets `processedRows`
    // moving within seconds, so the banner's live ETA appears immediately
    // instead of after the first giant fetch. Safe: same-priority tables
    // never reference each other, and upserts are find-or-create anyway.
    const ordered = [...SYNC_MAP].sort(
      (a, b) =>
        a.deletePriority - b.deletePriority ||
        (planned.perTable.get(a.legacyTable) ?? 0) -
          (planned.perTable.get(b.legacyTable) ?? 0),
    );
    await writeSchedulerPlanned(plannedTotal);
    emitLibraryEvent("library:sync-status:updated", {
      detail: {
        at: new Date().toISOString(),
        running: true,
        plannedRows: plannedTotal,
      },
    });

    let anyChanged = false;
    for (const mapping of ordered) {
      // Processed counter is bumped per-batch inside syncOneTable/upsertIds
      // (every PROGRESS_BATCH rows) — no per-table add here or rows would
      // double-count.
      const { changed } = await syncOneTable(mapping);
      if (changed) anyChanged = true;
      // Nudge every listener so the banner re-fetches sync-status and its
      // elapsed / remaining recompute mid-tick.
      emitLibraryEvent("library:sync-status:updated", {
        detail: { at: new Date().toISOString(), running: true },
      });
    }

    // Belt-and-braces: one final aggregate `library:master:updated` so any
    // client-side panel that listens on that catch-all (rather than a
    // specific per-table event) refreshes exactly once per tick regardless
    // of which tables changed. Per-table events above give panel-level
    // routing; this covers the "invalidate everything" case.
    if (anyChanged) {
      emitLibraryEvent("library:master:updated", {
        detail: { source: "legacy-sync-tick" },
      });
    }

    return { tables: ordered.length };
  } finally {
    if (holdsLock) {
      await lockClient
        .query("SELECT pg_advisory_unlock($1)", [SYNC_LOCK_KEY])
        .catch(() => undefined);
      // Only clear the running flag on the instance that actually held the
      // lock (the one that ran the tick). Losers of the try-lock skip fast
      // and never flipped the flag in the first place. `.catch(() => ...)`
      // guards against a bad-day DB failure never leaving the flag stuck.
      await writeSchedulerRunning(false).catch((err) =>
        log.warn(
          `failed to clear scheduler running flag: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
      emitLibraryEvent("library:sync-status:updated", {
        detail: { at: new Date().toISOString(), running: false },
      });
    }
    lockClient.release();
  }
}

let schedulerHandle: NodeJS.Timeout | null = null;
let firstTickTimer: NodeJS.Timeout | null = null;

/**
 * Start the in-process scheduler. Idempotent — repeated calls no-op. Meant to
 * be called once during boot, AFTER `runBootMigrations` has kicked off the
 * initial load: the tick guards on the initial-load marker, so calling this
 * early is safe (the first ticks just skip until the marker lands).
 */
export function startLibrarySyncScheduler(): void {
  if ((process.env.LIBRARY_LEGACY_SYNC ?? "").toLowerCase() === "off") {
    log.info("LIBRARY_LEGACY_SYNC=off — scheduler not started");
    return;
  }
  if (schedulerHandle) return;
  log.info(
    `scheduler starting: first tick in ${Math.round(SYNC_STARTUP_DELAY_MS / 1000)}s, then every ${Math.round(SYNC_INTERVAL_MS / 60000)} min`,
  );
  // Boot reconcile: a previous process that died mid-tick (nodemon restart,
  // crash) leaves running=true stuck in the scheduler-state row. If we can
  // briefly take the sync advisory lock, no instance anywhere is ticking, so
  // the flag is provably stale — clear it now instead of making the banner
  // wait out the 10-min staleness window.
  void (async () => {
    const client = await pool.connect();
    try {
      const res = await client.query<{ locked: boolean }>(
        "SELECT pg_try_advisory_lock($1) AS locked",
        [SYNC_LOCK_KEY],
      );
      if (res.rows[0]?.locked === true) {
        await clearStaleSchedulerRunning();
        await client.query("SELECT pg_advisory_unlock($1)", [SYNC_LOCK_KEY]);
      }
    } catch (err) {
      log.warn(
        `boot reconcile of scheduler running flag failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      client.release();
    }
  })();
  const fire = () => {
    runLibrarySyncTick()
      .then((r) => {
        if (r.skipped) log.info(`tick skipped: ${r.skipped}`);
        else log.info(`tick complete: ${r.tables} tables reconciled`);
      })
      .catch((err) =>
        log.warn(
          `tick threw: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
  };
  firstTickTimer = setTimeout(() => {
    firstTickTimer = null;
    fire();
    schedulerHandle = setInterval(fire, SYNC_INTERVAL_MS);
  }, SYNC_STARTUP_DELAY_MS);
}

/** Test hook — stops the scheduler cleanly. Not currently called from prod. */
export function stopLibrarySyncScheduler(): void {
  if (firstTickTimer) {
    clearTimeout(firstTickTimer);
    firstTickTimer = null;
  }
  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
  }
}
