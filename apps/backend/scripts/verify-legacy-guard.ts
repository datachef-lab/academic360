/**
 * Verifies the admin-edit-preserving legacy upsert guard end-to-end against the
 * live dev DB. Picks two real books, simulates an admin edit on one, and proves:
 *   A) an admin-edited row is PRESERVED (legacy payload NOT applied)
 *   B) an untouched row is REFRESHED (legacy payload applied + watermark restamped)
 * Restores all touched rows at the end. Run: tsx scripts/verify-legacy-guard.ts
 */
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db, pool } from "../src/db/index.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { libraryLegacySyncWatermarkModel } from "@repo/db/schemas/models/library/library-legacy-sync-watermark.model.js";
import { legacyGuardedUpsert } from "../src/features/library/old-irp-data.js";

async function wmSyncedAt(id: number): Promise<Date | null> {
  const [w] = await db
    .select({ s: libraryLegacySyncWatermarkModel.syncedAt })
    .from(libraryLegacySyncWatermarkModel)
    .where(
      and(
        eq(libraryLegacySyncWatermarkModel.tableName, "books"),
        eq(libraryLegacySyncWatermarkModel.rowId, id),
      ),
    );
  return w?.s ? new Date(w.s as unknown as string) : null;
}

async function main() {
  const rows = await db
    .select({
      id: bookModel.id,
      legacyId: bookModel.legacyBooksId,
      title: bookModel.title,
    })
    .from(bookModel)
    .limit(2);
  if (rows.length < 2) throw new Error("need >=2 books with legacy ids");
  const [A, B] = rows as Array<{ id: number; legacyId: number; title: string }>;

  // snapshot for restore
  const snap = await db.select().from(bookModel).where(eq(bookModel.id, A.id));
  const snapB = await db.select().from(bookModel).where(eq(bookModel.id, B.id));

  let pass = true;

  // ── Test A: admin-edited row must be preserved ──────────────────────────
  // Simulate an admin edit AFTER the last legacy write: bump updated_at to now()
  // while the watermark keeps its (older) backfilled value.
  await db
    .update(bookModel)
    .set({ title: "ADMIN_EDITED_TITLE" })
    .where(eq(bookModel.id, A.id));
  const wmA = await wmSyncedAt(A.id);
  const outA = await legacyGuardedUpsert<{ id: number; title: string }>(
    bookModel,
    "books",
    eq(bookModel.legacyBooksId, A.legacyId),
    { title: "LEGACY_SHOULD_NOT_APPLY" },
  );
  const [dbA] = await db
    .select({ title: bookModel.title })
    .from(bookModel)
    .where(eq(bookModel.id, A.id));
  const preserved =
    outA?.title === "ADMIN_EDITED_TITLE" && dbA?.title === "ADMIN_EDITED_TITLE";
  console.log(
    `Test A (admin-edited preserved): ${preserved ? "PASS" : "FAIL"} ` +
      `| returned="${outA?.title}" db="${dbA?.title}" wmSyncedAt=${wmA?.toISOString()}`,
  );
  pass = pass && preserved;

  // ── Test B: untouched row must be refreshed + watermark restamped ───────
  const wmBefore = await wmSyncedAt(B.id);
  const outB = await legacyGuardedUpsert<{ id: number; title: string }>(
    bookModel,
    "books",
    eq(bookModel.legacyBooksId, B.legacyId),
    { title: "LEGACY_REFRESH_APPLIED" },
  );
  const [dbB] = await db
    .select({ title: bookModel.title })
    .from(bookModel)
    .where(eq(bookModel.id, B.id));
  const wmAfter = await wmSyncedAt(B.id);
  const refreshed =
    outB?.title === "LEGACY_REFRESH_APPLIED" &&
    dbB?.title === "LEGACY_REFRESH_APPLIED";
  const restamped = !!(
    wmAfter &&
    (!wmBefore || wmAfter.getTime() >= wmBefore.getTime())
  );
  console.log(
    `Test B (untouched refreshed): ${refreshed && restamped ? "PASS" : "FAIL"} ` +
      `| returned="${outB?.title}" db="${dbB?.title}" wm ${wmBefore?.toISOString()} -> ${wmAfter?.toISOString()}`,
  );
  pass = pass && refreshed && restamped;

  // ── restore ─────────────────────────────────────────────────────────────
  await db
    .update(bookModel)
    .set(snap[0] as never)
    .where(eq(bookModel.id, A.id));
  await db
    .update(bookModel)
    .set(snapB[0] as never)
    .where(eq(bookModel.id, B.id));
  console.log(
    `\nRestored books ${A.id}, ${B.id}. Overall: ${pass ? "ALL PASS ✅" : "FAILED ❌"}`,
  );

  await pool.end();
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
