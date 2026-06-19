// Build a candidate UID list for posting to the develop backend.
// Criteria:
//   - studentpersonaldetails.active = 1
//   - historicalrecord.sessionid IN (16, 17)   (= AY 2023 and AY 2024)
//   - any semester / class
//   - studentpersonaldetails.coursetype != 'CCF' (excludes CCF cohort)
//   - 2 distinct students per legacy course
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { createPool } from "mysql2/promise";
import * as XLSX from "xlsx";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SESSIONS = [16, 17]; // AY 2023, AY 2024

const pool = createPool({
  host: process.env.OLD_DB_HOST!,
  port: parseInt(process.env.OLD_DB_PORT!, 10),
  user: process.env.OLD_DB_USER!,
  password: process.env.OLD_DB_PASSWORD!,
  database: process.env.OLD_DB_NAME!,
  connectTimeout: 60_000,
  connectionLimit: 4,
});

async function main() {
  console.log(
    "Fetching active students for sessions 16,17 (AY 2023/2024), non-CCF, all classes...",
  );
  const [candidates]: any = await pool.query(`
    SELECT DISTINCT spd.id, spd.codeNumber, spd.coursetype, hr.courseId, c.courseName
    FROM studentpersonaldetails spd
    JOIN historicalrecord hr ON hr.parent_id = spd.id
    JOIN course c            ON c.id = hr.courseId
    WHERE spd.active = 1
      AND (spd.coursetype IS NULL OR UPPER(TRIM(spd.coursetype)) <> 'CCF')
      AND hr.sessionid IN (${SESSIONS.join(",")})
  `);
  console.log(`candidate rows: ${candidates.length}`);

  // Group by course, pick 2 per course
  const byCourse = new Map<number, any[]>();
  const seenStudents = new Set<number>();
  for (const r of candidates) {
    const cid = Number(r.courseId);
    if (seenStudents.has(Number(r.id))) continue;
    seenStudents.add(Number(r.id));
    if (!byCourse.has(cid)) byCourse.set(cid, []);
    byCourse.get(cid)!.push(r);
  }
  const picked: any[] = [];
  for (const [cid, arr] of byCourse) {
    void cid;
    picked.push(...arr.slice(0, 2));
  }
  console.log(`distinct courses: ${byCourse.size}`);
  console.log(`picked UIDs (2 per course): ${picked.length}`);

  // breakdown
  console.table(
    [...byCourse.entries()]
      .map(([cid, arr]) => ({
        courseName: arr[0].courseName,
        available: arr.length,
        picked: Math.min(arr.length, 2),
      }))
      .sort((a, b) => a.courseName.localeCompare(b.courseName)),
  );

  // Write Excel + expectations JSON
  const outDir = join(process.cwd(), "excel-data");
  mkdirSync(outDir, { recursive: true });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["UID"],
    ...picked.map((r) => [String(r.codeNumber)]),
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  const xlsxPath = join(outDir, "develop-candidates.xlsx");
  XLSX.writeFile(wb, xlsxPath);
  console.log(`wrote ${xlsxPath}`);

  const expectations: Record<string, any> = {};
  for (const r of picked) {
    expectations[String(r.codeNumber)] = {
      legacyStudentId: r.id,
      coursetype: r.coursetype,
      courseName: r.courseName,
    };
  }
  writeFileSync(
    join(outDir, "develop-candidates-expectations.json"),
    JSON.stringify(expectations, null, 2),
  );
  console.log(`wrote develop-candidates-expectations.json`);

  await pool.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
