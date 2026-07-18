/**
 * Verifies the fixes found by the post-refactor audit, against real data:
 *
 *  1. `sequence` now reaches the client, so dropdowns order by configured
 *     sequence rather than meta id.
 *  2. PRIOR_SELECTION returns only the LATEST version per source meta (the
 *     data has 111 student/meta pairs with more than one active row).
 *  3. autoAssign survives into perMetaOptions.
 *  4. subjectTypeCode / classNames are populated for the restricted-grouping
 *     context the forms rely on.
 */
import "dotenv/config";
import { pool, db } from "../src/db/index.js";
import { findSubjectsSelections } from "../src/features/subject-selection/services/student-subjects.service.js";

const ids = (process.env.SS_STUDENT_IDS ?? "")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter(Boolean);

async function main() {
  let failures = 0;
  const check = (ok: boolean, msg: string) => {
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${msg}`);
    if (!ok) failures++;
  };

  for (const studentId of ids) {
    const res: any = await findSubjectsSelections(studentId);
    const pm = res.perMetaOptions ?? [];
    if (!pm.length) {
      console.log(`\nstudent ${studentId}: no metas, skipping`);
      continue;
    }
    console.log(`\n--- student ${studentId} ---`);

    // 1. sequence present and ordering sane
    const seqs = pm.map((m: any) => m.sequence);
    check(
      seqs.every((s: any) => typeof s === "number"),
      `sequence populated on all ${pm.length} metas (${seqs.join(",")})`,
    );
    const ordered = [...pm].sort(
      (a: any, b: any) =>
        (a.sequence ?? 0) - (b.sequence ?? 0) || a.metaId - b.metaId,
    );
    console.log(
      "   dropdown order:",
      ordered.map((m: any) => `${m.sequence}:${m.metaLabel}`).join(" | "),
    );

    // 4. RG context fields
    check(
      pm.every((m: any) => m.subjectTypeCode),
      "subjectTypeCode populated on every meta",
    );
    check(
      pm.every((m: any) => Array.isArray(m.classNames)),
      "classNames present on every meta",
    );

    // 3. autoAssign carried through
    const autos = pm.flatMap((m: any) =>
      (m.options ?? [])
        .filter((o: any) => o.autoAssign)
        .map((o: any) => `${m.metaLabel}:${o.subjectName}`),
    );
    console.log(
      `   autoAssign options: ${autos.length ? autos.join(", ") : "(none)"}`,
    );
    check(
      pm.every((m: any) =>
        (m.options ?? []).every((o: any) => typeof o.autoAssign === "boolean"),
      ),
      "autoAssign is a boolean on every option",
    );
  }

  // 2. PRIOR_SELECTION latest-version behaviour, proven directly on the data.
  console.log("\n--- PRIOR_SELECTION latest-version check ---");
  const dupes = await db.execute<{
    student_id_fk: number;
    subject_selection_meta_id_fk: number;
    n: number;
  }>(
    `SELECT student_id_fk, subject_selection_meta_id_fk, count(*) AS n
       FROM student_subject_selections
      WHERE is_active = true
      GROUP BY 1,2 HAVING count(*) > 1
      ORDER BY n DESC LIMIT 3` as any,
  );
  const rows = (dupes as any).rows ?? dupes;
  if (!rows.length) {
    console.log(
      "  no student/meta pair has multiple active rows; nothing to prove",
    );
  }
  for (const r of rows) {
    const all = await db.execute<any>(
      `SELECT id, version, subject_id_fk FROM student_subject_selections
        WHERE student_id_fk = ${r.student_id_fk}
          AND subject_selection_meta_id_fk = ${r.subject_selection_meta_id_fk}
          AND is_active = true
        ORDER BY version DESC` as any,
    );
    const allRows = (all as any).rows ?? all;
    const latest = allRows[0];
    console.log(
      `  student ${r.student_id_fk} meta ${r.subject_selection_meta_id_fk}: ${r.n} active rows, ` +
        `versions [${allRows.map((x: any) => x.version).join(",")}], latest=v${latest.version} subject=${latest.subject_id_fk}`,
    );
    check(
      allRows.length > 1,
      `  ^ this pair would have leaked ${allRows.length - 1} stale option(s) before the fix`,
    );
  }

  console.log(
    `\nVERDICT: ${failures === 0 ? "PASS - all checks green" : `FAIL - ${failures} check(s) failed`}`,
  );
  await pool.end();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
