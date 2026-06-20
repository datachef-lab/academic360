// Pick 2 active students PER (course × admission-batch) where admission-batch is
// derived from the UID year code (positions 5-6, e.g. "23" → 2023 batch, "24" → 2024).
// Sessions limited to legacy 16 (AY 2023-24) and 17 (AY 2024-25).
// Excludes CCF coursetype.
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { createPool } from "mysql2/promise";
import * as XLSX from "xlsx";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
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

async function main() {
  // Match UIDs containing the substring '423' or '424' anywhere — per user spec.
  // batch_year decided by which substring matched ('424' → batch 2024, '423' → batch 2023);
  // when both present (rare), prefer 424.
  const [candidates]: any = await pool.query(`
    SELECT DISTINCT
      spd.id, spd.codeNumber,
      CASE WHEN spd.codeNumber LIKE '%424%' THEN '24' ELSE '23' END AS batch_year,
      hr.courseId, c.courseName
    FROM studentpersonaldetails spd
    JOIN historicalrecord hr ON hr.parent_id = spd.id
    JOIN course c ON c.id = hr.courseId
    WHERE spd.active = 1
      AND (spd.coursetype IS NULL OR UPPER(TRIM(spd.coursetype)) <> 'CCF')
      AND hr.sessionid IN (16, 17)
      AND (spd.codeNumber LIKE '%424%' OR spd.codeNumber LIKE '%423%')
  `);
  console.log(`candidate rows: ${candidates.length}`);

  // Exclude UIDs already imported in earlier batches (don't double up)
  const expPath = join(
    process.cwd(),
    "excel-data",
    "develop-candidates-expectations.json",
  );
  const previousUids = new Set<string>();
  if (existsSync(expPath)) {
    const exp = JSON.parse(readFileSync(expPath, "utf8"));
    for (const u of Object.keys(exp)) previousUids.add(u);
  }
  // also the small 424 batch
  for (const u of [
    "0101220424",
    "0102222424",
    "1104240013",
    "1104240033",
    "1404240040",
    "1404240051",
  ]) {
    previousUids.add(u);
  }

  // Group by (courseName, batch_year) → pick 2 distinct students
  const byBucket = new Map<string, any[]>();
  const seenStudents = new Set<number>();
  for (const r of candidates) {
    if (seenStudents.has(Number(r.id))) continue;
    if (previousUids.has(String(r.codeNumber))) continue;
    seenStudents.add(Number(r.id));
    const key = `${r.courseName}|${r.batch_year}`;
    if (!byBucket.has(key)) byBucket.set(key, []);
    byBucket.get(key)!.push(r);
  }
  const picked: any[] = [];
  for (const arr of byBucket.values()) picked.push(...arr.slice(0, 2));
  console.log(`distinct (course × batch) buckets: ${byBucket.size}`);
  console.log(`picked UIDs (2 per bucket): ${picked.length}`);

  // Breakdown
  const breakdown = [...byBucket.entries()]
    .map(([key, arr]) => {
      const [course, batch] = key.split("|");
      return {
        course,
        batch,
        available: arr.length,
        picked: Math.min(arr.length, 2),
      };
    })
    .sort(
      (a, b) =>
        a.course.localeCompare(b.course) || a.batch.localeCompare(b.batch),
    );
  console.table(breakdown);

  // Write Excel + expectations
  const outDir = join(process.cwd(), "excel-data");
  mkdirSync(outDir, { recursive: true });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["UID"],
    ...picked.map((r) => [String(r.codeNumber)]),
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  const xlsxPath = join(outDir, "develop-candidates-batch-23-24.xlsx");
  XLSX.writeFile(wb, xlsxPath);
  console.log(`wrote ${xlsxPath}`);

  const exp: Record<string, any> = {};
  for (const r of picked) {
    exp[String(r.codeNumber)] = {
      legacyStudentId: r.id,
      batchYear: r.batch_year,
      courseName: r.courseName,
    };
  }
  writeFileSync(
    join(outDir, "develop-candidates-batch-23-24-expectations.json"),
    JSON.stringify(exp, null, 2),
  );

  await pool.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
