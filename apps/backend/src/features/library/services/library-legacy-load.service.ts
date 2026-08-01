import { pool } from "@/db/index.js";
import { createLogger } from "@/config/logger.js";
import {
  getBootMigrationMarker,
  setBootMigrationMarker,
} from "@/db/boot-migration-markers.js";
import { loadLibrary, type LoadLibraryResult } from "../old-irp-data.js";

const log = createLogger("library-legacy-load");

/**
 * Advisory lock for the library IRP load.
 *
 * Production runs several EC2 instances and every one of them runs boot
 * migrations on startup. This load is NOT a short state-based heal — it walks
 * ~200,000 legacy rows and writes across two dozen tables — so two instances
 * running it together is the difference between a clean import and a mangled
 * one. Each resolver is a find-or-create keyed on its legacy id, which makes a
 * *sequential* re-run safe but does nothing against two concurrent runners:
 * both would miss on the same select and both would insert. None of the legacy
 * id columns carry a unique constraint, so the database would not catch it
 * either.
 *
 * `pg_try_advisory_lock` returns immediately rather than queueing — a losing
 * instance skips and gets on with booting, which is right because the work is
 * resumable: the next boot picks up wherever this one stopped.
 *
 * Arbitrary but fixed; do not reuse. (918360001 is the boot-migration runner
 * lock, 918360002 the board-subject dedupe.)
 */
const LIBRARY_LOAD_LOCK_KEY = 918360003;

const MARKER_NAME = "library-legacy-load-v1";

export type LibraryLegacyLoadResult =
  | { skipped: true; reason: string }
  | (LoadLibraryResult & { durationMs: number });

/**
 * Load the library data from the IRP database.
 *
 * Marker-guarded as well as locked. The load is idempotent, but it is also slow
 * and hammers both databases, so running it on every boot of every instance
 * forever would be a standing tax for no gain. Once it completes, the marker
 * stops it; pass `{ force: true }` to run it again after new legacy data lands.
 *
 * Boot is not blocked by this: `connectToDatabase` fires `runBootMigrations()`
 * without awaiting it, and `httpServer.listen` happens independently — so the
 * server is serving while this runs in the background on one instance.
 *
 * Set `LIBRARY_LEGACY_LOAD=off` to disable it outright.
 */
export async function runLibraryLegacyLoad(options?: {
  force?: boolean;
  limitPerTable?: number;
}): Promise<LibraryLegacyLoadResult> {
  if ((process.env.LIBRARY_LEGACY_LOAD ?? "").toLowerCase() === "off") {
    return { skipped: true, reason: "LIBRARY_LEGACY_LOAD=off" };
  }

  if (!options?.force) {
    const marker = await getBootMigrationMarker(MARKER_NAME);
    if (marker) {
      return {
        skipped: true,
        reason: `already ran on ${marker.ran_at.toISOString()}; pass force to re-run`,
      };
    }
  }

  // The lock is held on its own connection for the whole load — advisory locks
  // belong to a session, and the pooled query connections come and go.
  const lockClient = await pool.connect();
  let holdsLock = false;

  try {
    const lockRes = await lockClient.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock($1) AS locked",
      [LIBRARY_LOAD_LOCK_KEY],
    );
    holdsLock = lockRes.rows[0]?.locked === true;
    if (!holdsLock) {
      return {
        skipped: true,
        reason: "another instance is already running the library load",
      };
    }

    const started = Date.now();
    log.info("starting the library IRP load — this runs for a while");

    // Seed the in-memory snapshot so a dashboard mounting during the load
    // has something to show even if it missed the first per-table emits.
    const { markLoadRunning } = await import("./library-realtime.service.js");
    markLoadRunning(true);

    const result = await loadLibrary({
      limitPerTable: options?.limitPerTable,
      onProgress: (msg) => log.info(msg),
    });

    const durationMs = Date.now() - started;
    markLoadRunning(false);
    log.info(
      `library load finished in ${Math.round(durationMs / 1000)}s — ${result.totalLoaded} rows loaded, ${result.totalFailed} skipped/failed`,
    );

    // Only mark a FULL load as done. A partial (smoke-test) run must not stop
    // the real one from happening on the next boot.
    if (!options?.limitPerTable) {
      await setBootMigrationMarker(MARKER_NAME, {
        totalLoaded: result.totalLoaded,
        totalFailed: result.totalFailed,
        durationMs,
        tables: result.tables,
      });
    }

    return { ...result, durationMs };
  } finally {
    if (holdsLock) {
      await lockClient
        .query("SELECT pg_advisory_unlock($1)", [LIBRARY_LOAD_LOCK_KEY])
        .catch(() => undefined);
    }
    lockClient.release();
  }
}
