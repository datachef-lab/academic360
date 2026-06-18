// One-off discovery script.
// For session 2023-2024 (legacy currentsessionmaster.id = 16),
// pick 2 active students per (course, class). Prefer bootstrap candidates (admissionid IS NULL) first.
// Runs against OLD_DB only. No mutations.
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { createPool } from "mysql2/promise";
import * as XLSX from "xlsx";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SESSION_ID_2023_2024 = 16;

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

  // Step A: fetch only the candidates table once, then aggregate in JS to avoid heavy GROUP BY on remote DB.
  console.log("Fetching candidate rows for session 2023-2024 ...");
  const [rows] = (await pool.query(
    `
    SELECT
      spd.id            AS spd_id,
      spd.codeNumber    AS uid,
      spd.admissionid   AS legacy_admission_id,
      hr.courseId,
      hr.classId,
      hr.sessionid,
      hr.index_col,
      hr.present
    FROM studentpersonaldetails spd
    JOIN historicalrecord hr ON hr.parent_id = spd.id
    WHERE spd.active = 1
      AND hr.sessionid = ?
    `,
    [SESSION_ID_2023_2024],
  )) as any;
  console.log(`Raw candidate rows: ${rows.length}`);

  // Step B: fetch lookup names.
  const courseIds = Array.from(
    new Set(rows.map((r: any) => Number(r.courseId))),
  ).filter((x) => Number.isFinite(x));
  const classIds = Array.from(
    new Set(rows.map((r: any) => Number(r.classId))),
  ).filter((x) => Number.isFinite(x));

  const [courseRows] = (await pool.query(
    `SELECT id, courseName FROM course WHERE id IN (?)`,
    [courseIds],
  )) as any;
  const [classRows] = (await pool.query(
    `SELECT id, className FROM classes WHERE id IN (?)`,
    [classIds],
  )) as any;
  const courseById = new Map<number, string>(
    courseRows.map((r: any) => [Number(r.id), String(r.courseName)]),
  );
  const classById = new Map<number, string>(
    classRows.map((r: any) => [Number(r.id), String(r.className)]),
  );

  // Step C: aggregate combo counts in JS.
  const comboMap = new Map<string, any>();
  for (const r of rows) {
    const key = `${r.courseId}|${r.classId}`;
    let combo = comboMap.get(key);
    if (!combo) {
      combo = {
        courseId: r.courseId,
        courseName:
          courseById.get(Number(r.courseId)) ?? `?course:${r.courseId}`,
        classId: r.classId,
        className: classById.get(Number(r.classId)) ?? `?class:${r.classId}`,
        unique_students: new Set<number>(),
        bootstrap_unique: new Set<number>(),
        happy_unique: new Set<number>(),
      };
      comboMap.set(key, combo);
    }
    combo.unique_students.add(Number(r.spd_id));
    if (r.legacy_admission_id == null)
      combo.bootstrap_unique.add(Number(r.spd_id));
    else combo.happy_unique.add(Number(r.spd_id));
  }

  const combos = [...comboMap.values()]
    .map((c) => ({
      courseName: c.courseName,
      className: c.className,
      active_count: c.unique_students.size,
      bootstrap_count: c.bootstrap_unique.size,
      happy_count: c.happy_unique.size,
    }))
    .sort(
      (a, b) =>
        a.courseName.localeCompare(b.courseName) ||
        a.className.localeCompare(b.className),
    );

  console.log(`(course x class) combos: ${combos.length}`);
  console.table(combos);

  // Step D: pick 2 per combo, preferring bootstrap candidates first.
  type Row = {
    spd_id: number;
    uid: string;
    legacy_admission_id: number | null;
    courseId: number;
    classId: number;
    sessionid: number;
    index_col: number;
    present: any;
  };
  const grouped = new Map<string, Row[]>();
  for (const r of rows as Row[]) {
    const key = `${r.courseId}|${r.classId}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push({ ...r, spd_id: Number(r.spd_id) });
  }

  const picked: Array<Row & { courseName: string; className: string }> = [];
  for (const [key, list] of grouped) {
    // dedupe by spd_id (multiple historicalrecord rows per student in same session)
    const seen = new Set<number>();
    const uniq: Row[] = [];
    for (const r of list) {
      if (seen.has(r.spd_id)) continue;
      seen.add(r.spd_id);
      uniq.push(r);
    }
    uniq.sort((a, b) => {
      const aBoot = a.legacy_admission_id == null ? 1 : 0;
      const bBoot = b.legacy_admission_id == null ? 1 : 0;
      if (aBoot !== bBoot) return bBoot - aBoot; // bootstrap first
      return Number(b.index_col) - Number(a.index_col);
    });
    const [courseId, classId] = key.split("|").map(Number);
    for (const r of uniq.slice(0, 2)) {
      picked.push({
        ...r,
        courseName: courseById.get(courseId) ?? `?course:${courseId}`,
        className: classById.get(classId) ?? `?class:${classId}`,
      });
    }
  }
  console.log(`Picked UID count: ${picked.length}`);
  const bootstrapPicked = picked.filter(
    (r) => r.legacy_admission_id == null,
  ).length;
  const happyPicked = picked.length - bootstrapPicked;
  console.log(
    `  - bootstrap path (legacy admissionid NULL): ${bootstrapPicked}`,
  );
  console.log(`  - happy path     (legacy admissionid set):  ${happyPicked}`);

  const under2 = combos.filter((c) => c.active_count < 2);
  if (under2.length) {
    console.log(
      `Combos with fewer than 2 active students (best-effort coverage):`,
    );
    console.table(under2);
  }

  // Step E: write Excel + expectations JSON.
  const outDir = join(process.cwd(), "excel-data");
  mkdirSync(outDir, { recursive: true });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["UID"],
    ...picked.map((r) => [String(r.uid)]),
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  const xlsxPath = join(outDir, "import-test-2023-2024.xlsx");
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
  const expectPath = join(outDir, "import-test-2023-2024-expectations.json");
  writeFileSync(expectPath, JSON.stringify(expectations, null, 2));
  console.log(`Wrote expectations: ${expectPath}`);

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
