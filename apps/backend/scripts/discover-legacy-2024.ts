// Discovery: pick 1 active student per legacy course for session 2024-2025
// (currentsessionmaster.id = 17, sessionName = '2024-2025').
// Prefer happy-path (admissionid not NULL) candidates first so we exercise both paths
// if any happy candidates exist for this session.
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { createPool } from "mysql2/promise";
import * as XLSX from "xlsx";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SESSION_ID_2024_2025 = 17;

const pool = createPool({
  host: process.env.OLD_DB_HOST!,
  port: parseInt(process.env.OLD_DB_PORT!, 10),
  user: process.env.OLD_DB_USER!,
  password: process.env.OLD_DB_PASSWORD!,
  database: process.env.OLD_DB_NAME!,
  connectTimeout: 30_000,
  waitForConnections: true,
  connectionLimit: 4,
});

async function main() {
  console.log("Ping...");
  await pool.query("SELECT 1");
  console.log("Ping ok.");

  console.log("Fetching candidate rows for session 2024-2025 ...");
  const [rows] = (await pool.query(
    `
    SELECT
      spd.id            AS spd_id,
      spd.codeNumber    AS uid,
      spd.admissionid   AS legacy_admission_id,
      hr.courseId,
      hr.classId,
      hr.sessionid,
      hr.index_col
    FROM studentpersonaldetails spd
    JOIN historicalrecord hr ON hr.parent_id = spd.id
    WHERE spd.active = 1
      AND hr.sessionid = ?
    `,
    [SESSION_ID_2024_2025],
  )) as any;
  console.log(`Raw candidate rows: ${rows.length}`);

  const courseIds = Array.from(
    new Set(rows.map((r: any) => Number(r.courseId))),
  ).filter((x) => Number.isFinite(x));
  if (!courseIds.length) {
    console.error("No courses found for session 2024-2025. Aborting.");
    await pool.end();
    process.exit(1);
  }
  const [courseRows] = (await pool.query(
    `SELECT id, courseName FROM course WHERE id IN (?)`,
    [courseIds],
  )) as any;
  const courseById = new Map<number, string>(
    courseRows.map((r: any) => [Number(r.id), String(r.courseName)]),
  );

  const classIds = Array.from(
    new Set(rows.map((r: any) => Number(r.classId))),
  ).filter((x) => Number.isFinite(x));
  const [classRows] = (await pool.query(
    `SELECT id, className FROM classes WHERE id IN (?)`,
    [classIds],
  )) as any;
  const classById = new Map<number, string>(
    classRows.map((r: any) => [Number(r.id), String(r.className)]),
  );

  // Per-course aggregate (across all classes / semesters)
  type CourseStat = {
    courseId: number;
    courseName: string;
    activeStudents: Set<number>;
    bootstrapStudents: Set<number>;
    happyStudents: Set<number>;
  };
  const courseMap = new Map<number, CourseStat>();
  for (const r of rows as any[]) {
    const cid = Number(r.courseId);
    let stat = courseMap.get(cid);
    if (!stat) {
      stat = {
        courseId: cid,
        courseName: courseById.get(cid) ?? `?course:${cid}`,
        activeStudents: new Set<number>(),
        bootstrapStudents: new Set<number>(),
        happyStudents: new Set<number>(),
      };
      courseMap.set(cid, stat);
    }
    stat.activeStudents.add(Number(r.spd_id));
    if (r.legacy_admission_id == null)
      stat.bootstrapStudents.add(Number(r.spd_id));
    else stat.happyStudents.add(Number(r.spd_id));
  }
  const courses = [...courseMap.values()].sort((a, b) =>
    a.courseName.localeCompare(b.courseName),
  );
  console.log(`Distinct courses for session 2024-2025: ${courses.length}`);
  console.table(
    courses.map((c) => ({
      courseName: c.courseName,
      active: c.activeStudents.size,
      bootstrap: c.bootstrapStudents.size,
      happy: c.happyStudents.size,
    })),
  );

  // Pick 1 per course. Prefer happy-path first (test that path if possible);
  // tie-break by latest index_col.
  type Row = {
    spd_id: number;
    uid: string;
    legacy_admission_id: number | null;
    courseId: number;
    classId: number;
    sessionid: number;
    index_col: number;
  };
  const byCourse = new Map<number, Row[]>();
  for (const r of rows as Row[]) {
    if (!byCourse.has(Number(r.courseId))) byCourse.set(Number(r.courseId), []);
    byCourse.get(Number(r.courseId))!.push({ ...r, spd_id: Number(r.spd_id) });
  }

  const picked: Array<Row & { courseName: string; className: string }> = [];
  for (const [cid, list] of byCourse) {
    const seen = new Set<number>();
    const uniq: Row[] = [];
    for (const r of list) {
      if (seen.has(r.spd_id)) continue;
      seen.add(r.spd_id);
      uniq.push(r);
    }
    uniq.sort((a, b) => {
      const aHappy = a.legacy_admission_id != null ? 1 : 0;
      const bHappy = b.legacy_admission_id != null ? 1 : 0;
      if (aHappy !== bHappy) return bHappy - aHappy; // happy first
      return Number(b.index_col) - Number(a.index_col);
    });
    const top = uniq[0];
    if (!top) continue;
    picked.push({
      ...top,
      courseName: courseById.get(cid) ?? `?course:${cid}`,
      className: classById.get(Number(top.classId)) ?? `?class:${top.classId}`,
    });
  }
  console.log(`Picked UID count: ${picked.length}`);
  const bootstrap = picked.filter((r) => r.legacy_admission_id == null).length;
  const happy = picked.length - bootstrap;
  console.log(`  - happy path:     ${happy}`);
  console.log(`  - bootstrap path: ${bootstrap}`);

  const outDir = join(process.cwd(), "excel-data");
  mkdirSync(outDir, { recursive: true });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["UID"],
    ...picked.map((r) => [String(r.uid)]),
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  const xlsxPath = join(outDir, "import-test-2024-2025.xlsx");
  XLSX.writeFile(wb, xlsxPath);
  console.log(`Wrote Excel: ${xlsxPath}`);

  const expectations: Record<string, any> = {};
  for (const r of picked) {
    expectations[String(r.uid)] = {
      legacyStudentId: r.spd_id,
      legacyAdmissionId: r.legacy_admission_id,
      courseName: r.courseName,
      className: r.className,
      sessionId: r.sessionid,
      expectedPath: r.legacy_admission_id == null ? "bootstrap" : "happy",
    };
  }
  const expectPath = join(outDir, "import-test-2024-2025-expectations.json");
  writeFileSync(expectPath, JSON.stringify(expectations, null, 2));
  console.log(`Wrote expectations: ${expectPath}`);

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
