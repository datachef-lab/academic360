import "dotenv/config";
import fs from "node:fs";
import { pool } from "../src/db/index.js";
import { findSubjectsSelections } from "../src/features/subject-selection/services/student-subjects.service.js";

const OUT = process.env.SS_BASELINE_OUT!;
const raw = JSON.parse(process.env.SS_STUDENTS!) as number[];
const students = [...new Set(raw)]; // dedupe

// Normalize a student's option output to a stable, comparable shape.
function normalize(res: any) {
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
  const metaIds = (res.subjectSelectionMetas ?? [])
    .map((m: any) => m.id)
    .sort((a: number, b: number) => a - b);
  return { groups, metaIds };
}

const baseline: Record<number, any> = {};
let ok = 0,
  fail = 0;
for (const sid of students) {
  const t = Date.now();
  try {
    const res = await findSubjectsSelections(sid);
    baseline[sid] = normalize(res);
    ok++;
    if (ok % 5 === 0)
      console.error(
        `  ${ok}/${students.length} captured (last ${Date.now() - t}ms)`,
      );
  } catch (e) {
    baseline[sid] = { error: (e as Error).message };
    fail++;
  }
}
fs.writeFileSync(OUT, JSON.stringify(baseline, null, 2));
console.error(`baseline written: ${OUT} (${ok} ok, ${fail} failed)`);
await pool.end();
