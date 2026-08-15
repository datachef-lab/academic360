import { integer, pgTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

/**
 * Per-row provenance for the library legacy load/upsert.
 *
 * When the loader writes a row (insert or update) from the old IRP system it
 * stamps `syncedAt = now()` here for that (table, row). An admin/staff edit in
 * the new system bumps the row's own `updatedAt` (via `$onUpdate`) but does NOT
 * touch this watermark. So the loader can tell an admin-edited row apart:
 *   row is admin-edited  ⇔  row.updatedAt > watermark.syncedAt (+ tolerance)
 * and preserve it instead of overwriting it with legacy values.
 *
 * A polymorphic side table (one row per synced library row, keyed by table
 * name + row id) keeps the mechanism in one place without adding a column to
 * every library model. No FK is possible across the ~24 target tables; orphan
 * rows after a delete are harmless.
 */
export const libraryLegacySyncWatermarkModel = pgTable(
  "library_legacy_sync_watermark",
  {
    id: serial().primaryKey(),
    tableName: varchar("table_name", { length: 128 }).notNull(),
    rowId: integer("row_id").notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tableRowUnique: uniqueIndex("library_legacy_sync_watermark_table_row_unique").on(
      t.tableName,
      t.rowId,
    ),
  }),
);

export const createLibraryLegacySyncWatermarkSchema = createInsertSchema(
  libraryLegacySyncWatermarkModel,
);

export type LibraryLegacySyncWatermark = z.infer<
  typeof createLibraryLegacySyncWatermarkSchema
>;
export type LibraryLegacySyncWatermarkT =
  typeof createLibraryLegacySyncWatermarkSchema._type;
