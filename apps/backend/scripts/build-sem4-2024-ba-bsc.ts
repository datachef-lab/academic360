// Build the import list: ALL active students in legacy session 17 (2024-2025),
// Semester IV (classId 7), BA & BSc courses only.
// Writes one master Excel + chunked Excels (50/chunk) + expectations JSON.
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { createPool } from "mysql2/promise";
import * as XLSX from "xlsx";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const pool = createPool({
  host: process.env.OLD_DB_HOST!,
  port: parseInt(process.env.OLD_DB_PORT!, 10),
  user: process.env.OLD_DB_USER!,
  password: process.env.OLD_DB_PASSWORD!,
  database: process.env.OLD_DB_NAME!,
  connectTimeout: 60_000,
  connectionLimit: 4,
});

const CHUNK = 50;

async function main() {
  const [rows]: any = await pool.query(`
    SELECT DISTINCT spd.id AS legacy_id, spd.codeNumber, c.id AS courseId, c.courseName
    FROM studentpersonaldetails spd
    JOIN historicalrecord hr ON hr.parent_id = spd.id
    JOIN course c ON c.id = hr.courseId
    WHERE spd.active = 1
      AND hr.sessionid = 17 AND hr.classId = 7
      AND (UPPER(c.courseName) LIKE 'B.A%' OR UPPER(c.courseName) LIKE 'B.SC%')
    ORDER BY c.courseName, spd.codeNumber
  `);
  console.log(
    `Total students (BA/BSc, 2024 session 17, sem IV): ${rows.length}`,
  );

  // breakdown
  const byCourse = new Map<string, number>();
  for (const r of rows)
    byCourse.set(r.courseName, (byCourse.get(r.courseName) || 0) + 1);
  console.table(
    [...byCourse.entries()].map(([course, n]) => ({ course, students: n })),
  );

  const outDir = join(process.cwd(), "excel-data");
  mkdirSync(outDir, { recursive: true });

  // Master Excel
  const wbAll = XLSX.utils.book_new();
  const wsAll = XLSX.utils.aoa_to_sheet([
    ["UID"],
    ...rows.map((r: any) => [String(r.codeNumber)]),
  ]);
  XLSX.utils.book_append_sheet(wbAll, wsAll, "Students");
  XLSX.writeFile(wbAll, join(outDir, "sem4-2024-ba-bsc.xlsx"));
  console.log(`wrote sem4-2024-ba-bsc.xlsx (${rows.length} UIDs)`);

  // Chunked Excels
  const chunkDir = join(outDir, "sem4-2024-chunks");
  mkdirSync(chunkDir, { recursive: true });
  let n = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["UID"],
      ...slice.map((r: any) => [String(r.codeNumber)]),
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    const name = `chunk-${String(n).padStart(2, "0")}.xlsx`;
    XLSX.writeFile(wb, join(chunkDir, name));
    n++;
  }
  console.log(`wrote ${n} chunks of up to ${CHUNK} into sem4-2024-chunks/`);

  // Expectations JSON
  const exp: Record<string, any> = {};
  for (const r of rows)
    exp[String(r.codeNumber)] = {
      legacyStudentId: r.legacy_id,
      courseName: r.courseName,
    };
  writeFileSync(
    join(outDir, "sem4-2024-ba-bsc-expectations.json"),
    JSON.stringify(exp, null, 2),
  );
  console.log(`wrote sem4-2024-ba-bsc-expectations.json`);

  // also a plain newline UID list
  writeFileSync(
    join(outDir, "sem4-2024-ba-bsc-uids.txt"),
    rows.map((r: any) => r.codeNumber).join("\n") + "\n",
  );

  await pool.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
