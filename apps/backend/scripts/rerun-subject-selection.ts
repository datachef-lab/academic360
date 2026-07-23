// Re-run ONLY the legacy subject-selection migration (import step 11) for
// already-imported students, by driving the SAME service function the uid
// import uses: migrateSubjectSelectionForStudent(). Same bridges, same
// stream/registration-AY meta resolution, same idempotency ("skip if a row
// exists in any state") — no separate logic lives here, so results cannot
// diverge from a full re-import. Skips import steps 1-10 entirely, so a
// ~500-student cohort takes minutes.
//
// UIDs are normalized exactly like the import's Excel parser
// (strip spaces/dashes/slashes, uppercase) and matched on students.uid.
//
// Dry-run wraps each student's writes in a transaction that ROLLS BACK, via
// the service's opts.dbx — the printed counts come from the real code path.
//
// Usage:
//   pnpm tsx scripts/rerun-subject-selection.ts --uids=path/to/uids.txt [--apply]
//   pnpm tsx scripts/rerun-subject-selection.ts --all-missing [--apply]
//   (--all-missing = every imported student with zero selection rows)
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "../src/db/index.js";
import { studentModel } from "@repo/db/schemas/models";
import {
  migrateSubjectSelectionForStudent,
  type SubjectSelectionResult,
} from "../src/features/user/services/subject-selection-migration.service.js";

const APPLY = process.argv.includes("--apply");
const ALL_MISSING = process.argv.includes("--all-missing");
const UIDS_FILE = process.argv
  .slice(2)
  .find((a) => a.startsWith("--uids="))
  ?.slice("--uids=".length);

// Same normalization as the import's parseUidsFromExcelBuffer + upsertStudent:
// strip spaces/dashes/slashes, uppercase.
const cleanUid = (raw: string): string =>
  raw
    .trim()
    .replace(/[\s\-\/]/g, "")
    .toUpperCase();

class Rollback extends Error {
  constructor(public readonly payload: SubjectSelectionResult) {
    super("dry-run rollback");
  }
}

async function main() {
  if (!UIDS_FILE && !ALL_MISSING) {
    console.error(
      "Usage: pnpm tsx scripts/rerun-subject-selection.ts --uids=<file> | --all-missing [--apply]",
    );
    process.exit(1);
  }
  console.log(
    APPLY ? "[apply mode]" : "[dry run — per-student tx rolled back]",
  );

  let students: (typeof studentModel.$inferSelect)[];
  if (UIDS_FILE) {
    const uids = [
      ...new Set(
        readFileSync(UIDS_FILE, "utf8")
          .split(/\r?\n/)
          .map(cleanUid)
          .filter(Boolean),
      ),
    ];
    console.log(`uids in file: ${uids.length}`);
    students = uids.length
      ? await db
          .select()
          .from(studentModel)
          .where(inArray(studentModel.uid, uids))
      : [];
    const found = new Set(students.map((s) => String(s.uid)));
    const missing = uids.filter((u) => !found.has(u));
    if (missing.length) {
      console.warn(
        `WARNING: ${missing.length} uid(s) not found in students table:`,
        missing.slice(0, 20).join(", "),
        missing.length > 20 ? "…" : "",
      );
    }
  } else {
    students = await db
      .select()
      .from(studentModel)
      .where(
        sql`${isNotNull(studentModel.legacyStudentId)} AND NOT EXISTS (
          SELECT 1 FROM student_subject_selections sss
          WHERE sss.student_id_fk = ${studentModel.id}
        )`,
      );
  }

  const notImported = students.filter((s) => s.legacyStudentId == null);
  if (notImported.length) {
    console.warn(
      `WARNING: ${notImported.length} student(s) have no legacy_student_id (never legacy-imported) — the service will skip them:`,
      notImported
        .slice(0, 10)
        .map((s) => s.uid)
        .join(", "),
    );
  }
  console.log(`students in scope: ${students.length}`);

  const totals: SubjectSelectionResult = {
    legacyRows: 0,
    resolved: 0,
    inserted: 0,
    skippedDup: 0,
    skippedExisting: 0,
    skippedMeta: 0,
    skippedSubject: 0,
    skippedSession: 0,
    skippedClass: 0,
  };
  const problems: Array<{ uid: string; note: string }> = [];
  let done = 0;

  for (const student of students) {
    let r: SubjectSelectionResult;
    try {
      if (APPLY) {
        r = await migrateSubjectSelectionForStudent(student);
      } else {
        r = await db
          .transaction(async (tx) => {
            const res = await migrateSubjectSelectionForStudent(student, {
              dbx: tx,
            });
            throw new Rollback(res);
          })
          .catch((e) => {
            if (e instanceof Rollback) return e.payload;
            throw e;
          });
      }
    } catch (e) {
      problems.push({
        uid: String(student.uid),
        note: (e as Error)?.message || "unknown error",
      });
      continue;
    }

    for (const k of Object.keys(totals) as (keyof SubjectSelectionResult)[]) {
      totals[k] += r[k];
    }
    if (r.legacyRows > 0 && r.inserted === 0 && r.skippedExisting === 0) {
      problems.push({
        uid: String(student.uid),
        note: `no rows landed: skippedMeta=${r.skippedMeta} skippedSubject=${r.skippedSubject} skippedSession=${r.skippedSession} skippedClass=${r.skippedClass}`,
      });
    }
    done++;
    if (done % 50 === 0) console.log(`  ...${done}/${students.length}`);
    console.log(
      `  ${student.uid}: legacy=${r.legacyRows} inserted=${r.inserted} existing=${r.skippedExisting} skippedMeta=${r.skippedMeta}`,
    );
  }

  console.log("\n=== totals ===");
  console.log(totals);
  if (problems.length) {
    console.log(`\n=== students needing attention (${problems.length}) ===`);
    for (const p of problems.slice(0, 50))
      console.log(` - ${p.uid}: ${p.note}`);
    if (problems.length > 50) console.log(` …and ${problems.length - 50} more`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
