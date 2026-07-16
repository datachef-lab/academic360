// Find papers that legacy student data requires but the new catalog lacks.
// For each imported student × (in-scope session,class): take legacy compulsory
// (allstudents=1) + chosen optional (allstudents=0) subjects, bridge to new
// subject/subjectType/class/programCourse, and check whether a matching paper
// exists in the catalog (any AY). If not -> it's a missing paper to add.
//
// Output: /tmp/missing-papers.csv (program_course, semester, subject_type, subject, kind, students)
// Usage: pnpm tsx scripts/find-missing-papers.ts --uids=/tmp/sem4-import/uids.txt
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { createPool } from "mysql2/promise";
import { Pool as PgPool } from "pg";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const uidsArg = process.argv
  .slice(2)
  .find((a) => a.startsWith("--uids="))
  ?.slice("--uids=".length)!;
const UIDS = readFileSync(uidsArg, "utf8")
  .split(/\s+/)
  .map((s) => s.trim())
  .filter(Boolean);

const legacy = createPool({
  host: process.env.OLD_DB_HOST!,
  port: parseInt(process.env.OLD_DB_PORT!, 10),
  user: process.env.OLD_DB_USER!,
  password: process.env.OLD_DB_PASSWORD!,
  database: process.env.OLD_DB_NAME!,
  connectTimeout: 60_000,
  connectionLimit: 4,
});
const pg = new PgPool({ connectionString: process.env.DATABASE_URL });
const CLASS_MAP: Record<number, number> = { 4: 1, 5: 2, 6: 3, 7: 4 };
const SEM = ["I", "II", "III", "IV"];

function loadBridge(): Map<number, number> {
  const text = readFileSync(
    join(process.cwd(), "excel-data", "subject-bridge.csv"),
    "utf8",
  );
  const m = new Map<number, number>();
  for (const line of text.split("\n").slice(1)) {
    const cols = line.match(/"([^"]*)"/g)?.map((s) => s.slice(1, -1)) ?? [];
    if (cols.length < 5) continue;
    const [lid, , , bucket, nid] = cols;
    if (nid && ["EXACT", "FUZZY-AUTO", "ALREADY"].includes(bucket))
      m.set(Number(lid), Number(nid));
  }
  return m;
}

async function main() {
  const subjectBridge = loadBridge();
  // legacy subjectType -> new subjectType id + name
  const stRows = (
    await pg.query(`SELECT id, name, legacy_subject_type_id FROM subject_types`)
  ).rows;
  const stLegacyToNew = new Map<number, number>();
  const stName = new Map<number, string>();
  for (const r of stRows) {
    if (r.legacy_subject_type_id != null)
      stLegacyToNew.set(Number(r.legacy_subject_type_id), r.id);
    stName.set(r.id, r.name);
  }
  const subjName = new Map<number, string>();
  for (const r of (await pg.query(`SELECT id, name FROM subjects`)).rows)
    subjName.set(r.id, r.name);

  // students: uid -> {id, programCourseId, programCourseName}
  const stuRes = await pg.query(
    `SELECT s.id, UPPER(s.uid) AS uid, s.program_course_id_fk AS pcid, pc.name AS pcname
     FROM students s JOIN program_courses pc ON pc.id=s.program_course_id_fk
     WHERE UPPER(s.uid) = ANY($1)`,
    [UIDS.map((u) => u.toUpperCase())],
  );
  const stu = new Map<string, any>();
  for (const r of stuRes.rows) stu.set(r.uid, r);

  // Legacy "Major" (new type 23) is stored in the catalog as "Discipline Specific
  // Core Courses" (DSCC, new type 34). Treat them as equivalent when matching.
  const majorId = [...stName.entries()].find(([, n]) => n === "Major")?.[0];
  const dsccId = [...stName.entries()].find(
    ([, n]) => n === "Discipline Specific Core Courses",
  )?.[0];
  const equiv = (st: number): number[] =>
    majorId && dsccId && (st === majorId || st === dsccId)
      ? [majorId, dsccId]
      : [st];

  // catalog: set of "pcid|classId|subjectTypeId|subjectId" that have a paper (any AY)
  const catalog = new Set<string>();
  for (const r of (
    await pg.query(
      `SELECT DISTINCT programe_course_id_fk pc, class_id_fk cl, subject_type_id_fk st, subject_id_fk sj FROM papers`,
    )
  ).rows)
    catalog.add(`${r.pc}|${r.cl}|${r.st}|${r.sj}`);
  const inCatalog = (pc: number, cl: number, st: number, sj: number) =>
    equiv(st).some((t) => catalog.has(`${pc}|${cl}|${t}|${sj}`));

  // gap key -> set of student uids
  const gaps = new Map<string, Set<string>>();
  const gapMeta = new Map<string, any>();

  const inList = UIDS.map((u) => `'${u.replace(/'/g, "")}'`).join(",");
  // legacy compulsory + optional in scope
  const [rows]: any = await legacy.query(`
    (SELECT spd.codeNumber uid, m.classId, p.subjectTypeId, p.subjectId, '1' src
     FROM studentpaperlinkingmain m
     JOIN studentpaperlinkingpaperlist p ON p.parent_id=m.id
     JOIN historicalrecord h ON m.courseId=h.courseId AND m.classId=h.classId AND m.sectionId=h.sectionid AND m.shiftId=h.shiftId AND m.sessionId=h.sessionid
     JOIN studentpersonaldetails spd ON spd.id=h.parent_id
     WHERE spd.codeNumber IN (${inList}) AND p.allstudents='1' AND m.sessionId IN (16,17) AND m.classId IN (4,5,6,7))
    UNION
    (SELECT spd.codeNumber uid, m.classId, p.subjectTypeId, p.subjectId, '0' src
     FROM studentpaperlinkingmain m
     JOIN studentpaperlinkingpaperlist p ON p.parent_id=m.id
     JOIN studentpaperlinkingstudentlist ss ON ss.parent_id=p.id
     JOIN studentpersonaldetails spd ON spd.id=ss.studentId
     WHERE spd.codeNumber IN (${inList}) AND p.allstudents='0' AND m.sessionId IN (16,17) AND m.classId IN (4,5,6,7))
  `);

  for (const r of rows) {
    const s = stu.get(String(r.uid).toUpperCase());
    if (!s) continue;
    const newClass = CLASS_MAP[Number(r.classId)];
    const newSt = stLegacyToNew.get(Number(r.subjectTypeId));
    const newSj = subjectBridge.get(Number(r.subjectId));
    if (!newClass || !newSt || !newSj) continue; // unmappable type/subject (e.g. SEC/GE handled separately)
    if (inCatalog(s.pcid, newClass, newSt, newSj)) continue; // paper exists (incl Major≡DSCC)
    const gapKey = `${s.pcname}|Sem ${SEM[newClass - 1]}|${stName.get(newSt)}|${subjName.get(newSj)}|${r.src === "1" ? "compulsory" : "elective"}`;
    if (!gaps.has(gapKey)) {
      gaps.set(gapKey, new Set());
      gapMeta.set(gapKey, {
        pc: s.pcname,
        sem: `Sem ${SEM[newClass - 1]}`,
        st: stName.get(newSt),
        sj: subjName.get(newSj),
        kind: r.src === "1" ? "compulsory" : "elective",
      });
    }
    gaps.get(gapKey)!.add(String(r.uid).toUpperCase());
  }

  const out = [...gaps.entries()]
    .map(([k, set]) => ({ ...gapMeta.get(k), students: set.size }))
    .sort(
      (a, b) =>
        a.pc.localeCompare(b.pc) ||
        a.sem.localeCompare(b.sem) ||
        a.st.localeCompare(b.st) ||
        a.sj.localeCompare(b.sj),
    );

  const csv =
    "program_course,semester,subject_type,subject,kind,students\n" +
    out
      .map((r) =>
        [r.pc, r.sem, r.st, r.sj, r.kind, r.students]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
  writeFileSync("/tmp/missing-papers.csv", csv);
  console.log(`=== MISSING PAPERS (${out.length} distinct) ===`);
  for (const r of out)
    console.log(
      `${String(r.students).padStart(4)}  ${r.pc} | ${r.sem} | ${r.st} | ${r.sj} | ${r.kind}`,
    );
  console.log(`\nwrote /tmp/missing-papers.csv`);
  await legacy.end();
  await pg.end();
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
