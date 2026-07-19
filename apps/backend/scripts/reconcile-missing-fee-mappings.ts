/**
 * Finds students who have an ACTIVE promotion but ZERO fee-student mappings
 * and re-runs the idempotent per-uid legacy fee load for them.
 *
 * This is the safety net for import-time fee failures: the Jul 15-16 staging
 * import lost the fees of 79 PG students to legacy-DB timeouts whose errors
 * lived only in a dismissed HTTP response. Run this any time to backfill.
 *
 *   DRY_RUN=1 npx tsx scripts/reconcile-missing-fee-mappings.ts   # list only
 *   npx tsx scripts/reconcile-missing-fee-mappings.ts             # backfill
 *   UID_LIKE=1104240% npx tsx scripts/reconcile-missing-fee-mappings.ts
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, pool, mysqlConnection } from "../src/db/index.js";
import { loadStudentFeesForUid } from "../src/features/fees/services/legacy-fees-data.service.js";

const dryRun = process.env.DRY_RUN === "1";
const uidLike = process.env.UID_LIKE || "%";

async function main() {
  const found = await db.execute(sql`
    SELECT DISTINCT s.uid
      FROM students s
      JOIN promotions p ON p.student_id_fk = s.id
     WHERE p.end_date IS NULL
       AND COALESCE(p.is_deprecated, false) = false
       AND s.uid IS NOT NULL
       AND s.uid LIKE ${uidLike}
       AND NOT EXISTS (SELECT 1 FROM fee_student_mappings f WHERE f.student_id_fk = s.id)
     ORDER BY s.uid`);
  const rows = ((found as any).rows ?? found) as { uid: string }[];

  console.log(
    `${rows.length} student(s) with an active promotion but no fee mappings`,
  );
  if (dryRun) {
    rows.forEach((r) => console.log("  " + r.uid));
    console.log("\nDRY_RUN=1 — nothing loaded.");
  } else {
    let ok = 0;
    let skippedNoRows = 0;
    let failed = 0;
    for (const { uid } of rows) {
      try {
        const res = await loadStudentFeesForUid(uid);
        if (res.errors.length) {
          failed++;
          console.log(`  ${uid}  ERROR: ${res.errors.join("; ")}`);
        } else if (res.noLegacyRows) {
          skippedNoRows++;
          console.log(`  ${uid}  skipped (no legacy fee rows)`);
        } else {
          ok++;
          console.log(`  ${uid}  loaded ${res.loaded}, skipped ${res.skipped}`);
        }
      } catch (e) {
        failed++;
        console.log(`  ${uid}  THREW: ${(e as Error)?.message}`);
      }
    }
    console.log(
      `\nDONE: ${ok} loaded, ${skippedNoRows} without legacy rows, ${failed} failed`,
    );
  }

  await pool.end();
  await mysqlConnection.end().catch(() => {});
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
