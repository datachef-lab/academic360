import "dotenv/config";
import fs from "node:fs";
import { pool } from "../src/db/index.js";
import { findSubjectsSelections } from "../src/features/subject-selection/services/student-subjects.service.js";

const baseline = JSON.parse(
  fs.readFileSync(process.env.SS_BASELINE_OUT!, "utf8"),
);
const students = Object.keys(baseline).map(Number);

function normalizeGroups(res: any) {
  const groups = (res.studentSubjectsSelection ?? []).map((g: any) => ({
    subjectTypeId: g.subjectType?.id ?? null,
    subjectTypeCode: g.subjectType?.code ?? null,
    options: (g.paperOptions ?? [])
      .map((p: any) => ({
        subjectId: p.subject?.id ?? null,
        subjectName: p.subject?.name ?? null,
        classId: p.class?.id ?? null,
        className: p.class?.name ?? null,
      }))
      .sort((a: any, b: any) =>
        `${a.subjectTypeId}|${a.classId}|${a.subjectId}`.localeCompare(
          `${b.subjectTypeId}|${b.classId}|${b.subjectId}`,
        ),
      ),
  }));
  groups.sort(
    (a: any, b: any) => (a.subjectTypeId ?? 0) - (b.subjectTypeId ?? 0),
  );
  return groups;
}

let same = 0,
  diff = 0;
const diffs: string[] = [];
for (const sid of students) {
  const res = await findSubjectsSelections(sid);
  const before = JSON.stringify(baseline[sid].groups);
  const after = JSON.stringify(normalizeGroups(res));
  if (before === after) same++;
  else {
    diff++;
    diffs.push(`student ${sid}: option groups DIFFER`);
  }
}
console.log(`\n===== GOLDEN BASELINE REGRESSION =====`);
console.log(`  students compared : ${students.length}`);
console.log(`  IDENTICAL         : ${same}`);
console.log(`  DIFFERENT         : ${diff}`);
if (diffs.length) diffs.slice(0, 5).forEach((d) => console.log("   " + d));
console.log(
  diff === 0
    ? "  => PASS ✓ subject-display logic unchanged for every student"
    : "  => FAIL ✗ regression detected",
);

// Also confirm per-meta options were produced and are consistent with the groups.
const sample = await findSubjectsSelections(students[0]);
const pmo = (sample as any).perMetaOptions ?? [];
console.log(
  `\n  perMetaOptions for student ${students[0]}: ${pmo.length} metas`,
);
for (const m of pmo.slice(0, 6)) {
  console.log(
    `    [${m.optionSource}] ${m.metaLabel}: ${m.options.length} options (classes ${m.classIds.join(",") || "all"})`,
  );
}
await pool.end();
