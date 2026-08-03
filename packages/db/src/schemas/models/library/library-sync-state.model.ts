import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

/**
 * One row per legacy source table — anchors the ongoing delta sync from the
 * legacy IRP MySQL database into the new Postgres.
 *
 * The initial `loadLibrary` in `old-irp-data.ts` is a one-shot import guarded
 * by a boot-migration marker; any edits made in old IRP after that first run
 * are otherwise invisible to the new DB. The sync scheduler runs every 10
 * minutes to reconcile — this table is where each per-table run persists its
 * watermark, counters, and last-error so the dashboard can surface progress
 * and the scheduler can resume after a restart.
 *
 * The old IRP database is read-only for this codebase; nothing here or in the
 * sync service writes to MySQL.
 */
export const librarySyncStateModel = pgTable("library_sync_state", {
    // Old IRP source table name (e.g. "bookentry", "issuereturn"). Serves as
    // the natural key — one row per legacy table.
    tableName: varchar("table_name", { length: 120 }).primaryKey(),
    // Watermark used by delta filters when the source table exposes an
    // updated_at (or equivalent). When no such column is available the
    // scheduler still advances this on every successful pass — it doubles as
    // "last time we successfully reconciled this table".
    lastSyncedAt: timestamp("last_synced_at").notNull(),
    // Last successful completion. Nullable so a first-ever run in error state
    // is visible in the dashboard. Cleared on every subsequent success write.
    lastSuccessAt: timestamp("last_success_at"),
    // Single-line message captured on the most recent failure. Cleared on the
    // next success so the operator sees only currently-relevant errors.
    lastError: text("last_error"),
    // Per-run counters, REPLACED (not added) on each pass. The dashboard
    // shows "N upserts, M deletes this run", not lifetime totals.
    lastUpserts: integer("last_upserts").notNull().default(0),
    lastDeletes: integer("last_deletes").notNull().default(0),
    lastScanned: integer("last_scanned").notNull().default(0),
    lastDurationMs: integer("last_duration_ms").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createLibrarySyncStateSchema = createInsertSchema(librarySyncStateModel);

export type LibrarySyncState = z.infer<typeof createLibrarySyncStateSchema>;

export type LibrarySyncStateT = typeof createLibrarySyncStateSchema._type;
