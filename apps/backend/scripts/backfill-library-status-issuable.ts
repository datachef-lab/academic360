// Backfill `library_statuses.is_issuable`.
//
// This flag is pure admin-editable metadata (Statuses master page) that was
// never populated by the legacy import, so every status row landed on the
// column default (false) — including "In Library", the normal circulating
// stock. That makes any report/UI that colors by "not issuable" highlight
// literally everything, which is what surfaced this.
//
// Classification (confirmed with the librarian/admin):
//   - "In Library" and "IN LIBRARY (REPLACED)" -> issuable (normal stock,
//     including a copy that replaced a lost/damaged original).
//   - Everything else (Discarded, Obsolete, Irrecoverable, Damage, Price
//     Update, and all department "... SEMINAR LIBRARY" reference
//     collections) -> not issuable. Seminar-library copies are kept in the
//     department room for reference only, not issued out to students.
//
// Idempotent: re-run safe, only flips rows that don't already match.
//
// Usage: pnpm tsx scripts/backfill-library-status-issuable.ts            # dry run
//        pnpm tsx scripts/backfill-library-status-issuable.ts --apply
import "dotenv/config";
import { inArray } from "drizzle-orm";
import { db } from "../src/db/index.js";
import { statusModel } from "../../../packages/db/src/schemas/models/library/status.model.ts";

const APPLY = process.argv.includes("--apply");

const ISSUABLE_STATUS_NAMES = ["In Library", "IN LIBRARY (REPLACED)"];

async function main() {
  const all = await db
    .select({
      id: statusModel.id,
      name: statusModel.name,
      isIssuable: statusModel.isIssuable,
    })
    .from(statusModel);

  const toMakeIssuable = all.filter(
    (s) => ISSUABLE_STATUS_NAMES.includes(s.name) && s.isIssuable !== true,
  );
  const toMakeNotIssuable = all.filter(
    (s) => !ISSUABLE_STATUS_NAMES.includes(s.name) && s.isIssuable !== false,
  );

  console.log(`Total statuses: ${all.length}`);
  console.log(
    `-> set issuable=true:  ${toMakeIssuable.map((s) => s.name).join(", ") || "(none, already correct)"}`,
  );
  console.log(
    `-> set issuable=false: ${toMakeNotIssuable.length} row(s) ${toMakeNotIssuable.length ? "(" + toMakeNotIssuable.map((s) => s.name).join(", ") + ")" : "(none, already correct)"}`,
  );

  if (!APPLY) {
    console.log("\nDry run only — pass --apply to write these changes.");
    return;
  }

  if (toMakeIssuable.length > 0) {
    await db
      .update(statusModel)
      .set({ isIssuable: true, updatedAt: new Date() })
      .where(
        inArray(
          statusModel.id,
          toMakeIssuable.map((s) => s.id),
        ),
      );
  }
  if (toMakeNotIssuable.length > 0) {
    await db
      .update(statusModel)
      .set({ isIssuable: false, updatedAt: new Date() })
      .where(
        inArray(
          statusModel.id,
          toMakeNotIssuable.map((s) => s.id),
        ),
      );
  }
  console.log("Applied.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
