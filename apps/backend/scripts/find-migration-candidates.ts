// Find which legacy students with in-scope linking rows are NOT yet imported in new DB.
// Helps decide which UIDs to feed the loader next.
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { isNotNull } from "drizzle-orm";
import { createPool } from "mysql2/promise";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";
import { db } from "../src/db/index.js";
import { studentModel } from "@repo/db/schemas/models";
import { resolveSubjectSelectionScope } from "./_subject-selection-scope.js";

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
  const newStudents = await db
    .select({
      id: studentModel.id,
      uid: studentModel.uid,
      legacyStudentId: studentModel.legacyStudentId,
    })
    .from(studentModel)
    .where(isNotNull(studentModel.legacyStudentId));
  const newLegacyIds = new Set(
    newStudents.map((s) => Number(s.legacyStudentId)),
  );
  console.log(`new DB students with legacy_id: ${newStudents.length}`);

  const scope = await resolveSubjectSelectionScope(pool);
  console.log(
    `scope: legacy classes [${scope.legacyClassIds.join(",")}] → new classes [${scope.newClassIds.join(",")}]`,
  );

  // Only subject types with new metas: 27=Minor, 28=IDC, 29=CVAC, 30=AEC
  const [legStudents]: any = await pool.query(`
    SELECT DISTINCT ss.studentId
    FROM studentpaperlinkingmain m
    JOIN studentpaperlinkingpaperlist p ON p.parent_id = m.id
    JOIN studentpaperlinkingstudentlist ss ON ss.parent_id = p.id
    WHERE p.allstudents='0' AND m.sessionId IN (16,17)
      AND m.classId IN (${scope.legacyClassIds.join(",")})
      AND p.subjectTypeId IN (27, 28, 29, 30)
  `);
  console.log(
    `legacy students with in-scope optional rows: ${legStudents.length}`,
  );

  const intersection = legStudents.filter((l: any) =>
    newLegacyIds.has(Number(l.studentId)),
  );
  const notImported = legStudents.filter(
    (l: any) => !newLegacyIds.has(Number(l.studentId)),
  );
  console.log(`already-imported & migration-ready: ${intersection.length}`);
  console.log(`NOT yet imported into new DB:        ${notImported.length}`);

  // For NOT imported: pull codeNumber + active + session
  if (notImported.length) {
    const ids = notImported.map((r: any) => r.studentId).join(",");
    const [info]: any = await pool.query(`
      SELECT DISTINCT spd.id, spd.codeNumber, spd.active,
        (SELECT MIN(hr.sessionid) FROM historicalrecord hr WHERE hr.parent_id=spd.id AND hr.sessionid IN (16,17)) AS session
      FROM studentpersonaldetails spd
      WHERE spd.id IN (${ids})
    `);
    const active = info.filter(
      (r: any) =>
        r.active === 1 || (Buffer.isBuffer(r.active) && r.active[0] === 1),
    );
    const inactive = info.length - active.length;
    console.log(`  active=${active.length} inactive=${inactive}`);

    // Split by session
    const s16 = active.filter((r: any) => Number(r.session) === 16);
    const s17 = active.filter((r: any) => Number(r.session) === 17);
    console.log(`  session 16 (2023-24): ${s16.length}`);
    console.log(`  session 17 (2024-25): ${s17.length}`);

    // write candidate UID lists
    const outDir = join(process.cwd(), "excel-data");
    writeFileSync(
      join(outDir, "subject-migration-candidates.json"),
      JSON.stringify(
        {
          total_legacy_with_optional: legStudents.length,
          already_imported: intersection.length,
          not_imported_active: active.length,
          session_16: s16.length,
          session_17: s17.length,
          sample_uids_16: s16.slice(0, 20).map((r: any) => r.codeNumber),
          sample_uids_17: s17.slice(0, 20).map((r: any) => r.codeNumber),
        },
        null,
        2,
      ),
    );

    // Excel of all NOT-imported UIDs for use with loader (capped at 200 for sanity)
    const cap = 200;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["UID"],
      ...active.slice(0, cap).map((r: any) => [String(r.codeNumber)]),
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, join(outDir, "subject-migration-candidates.xlsx"));
    console.log(`wrote candidates Excel (capped at ${cap})`);
  }

  await pool.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
