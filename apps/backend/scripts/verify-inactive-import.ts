/**
 * End-to-end proof that an INACTIVE legacy student imports fully.
 *
 * Feeds a one-UID Excel through the real import path
 * (processStudentsFromExcelBuffer -> processStudent -> loadStudentFeesForUid),
 * then audits every related table for that student. Run against a LOCAL dev
 * DB only - it writes.
 *
 *   SS_UID=0101261656 npx tsx scripts/verify-inactive-import.ts
 */
import "dotenv/config";
import ExcelJS from "exceljs";
import { sql } from "drizzle-orm";
import { db, pool } from "../src/db/index.js";
import { processStudentsFromExcelBuffer } from "../src/features/user/services/refactor-old-migration.service.js";

const uid = process.env.SS_UID;
if (!uid) throw new Error("set SS_UID=<legacy uid>");

async function main() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("uids");
  ws.addRow(["UID"]);
  ws.addRow([String(uid)]);
  const buf = Buffer.from(await wb.xlsx.writeBuffer());

  console.log(`importing uid ${uid} through the real Excel path...`);
  const summary = await processStudentsFromExcelBuffer(buf);
  console.log("\n=== IMPORT SUMMARY ===");
  console.log(JSON.stringify(summary, null, 1));

  const audit = await db.execute(sql`
    SELECT u.is_active,
           u.is_suspended,
           s.id AS student_id,
           s.application_form_id_fk IS NOT NULL                                                         AS has_app_form,
           EXISTS (SELECT 1 FROM personal_details x WHERE x.user_id_fk = u.id)                          AS personal,
           EXISTS (SELECT 1 FROM health x WHERE x.user_id_fk = u.id)                                    AS health,
           EXISTS (SELECT 1 FROM family_details x WHERE x.user_id_fk = u.id)                            AS family,
           EXISTS (SELECT 1 FROM accommodation x WHERE x.user_id_fk = u.id)                             AS accommodation,
           EXISTS (SELECT 1 FROM emergency_contacts x WHERE x.user_id_fk = u.id)                        AS emergency,
           EXISTS (SELECT 1 FROM promotions p WHERE p.student_id_fk = s.id)                             AS promotions,
           EXISTS (SELECT 1 FROM cu_registration_correction_requests x WHERE x.student_id_fk = s.id)    AS cu_reg,
           EXISTS (SELECT 1 FROM admission_general_info x
                    WHERE x.application_form_id_fk = s.application_form_id_fk)                          AS adm_general,
           EXISTS (SELECT 1 FROM admission_academic_info x
                    WHERE x.application_form_id_fk = s.application_form_id_fk)                          AS adm_academic,
           (SELECT count(*) FROM fee_student_mappings f WHERE f.student_id_fk = s.id)                   AS fee_mappings
      FROM students s
      JOIN users u ON u.id = s.user_id_fk
     WHERE s.uid = ${uid}`);
  const rows = (audit as any).rows ?? audit;

  console.log("\n=== POST-IMPORT AUDIT ===");
  if (!rows.length) {
    console.log("FAIL - student row was not created at all");
    process.exit(1);
  }
  const r = rows[0];
  console.table(rows);

  const required = [
    "personal",
    "health",
    "family",
    "accommodation",
    "emergency",
    "has_app_form",
    "adm_general",
    "adm_academic",
    "promotions",
    "cu_reg",
  ];
  const missing = required.filter((k) => !r[k]);
  console.log(
    `\nVERDICT: ${
      missing.length === 0
        ? "PASS - inactive student imported with FULL data (cu_reg included)"
        : `FAIL - missing: ${missing.join(", ")}`
    }`,
  );
  await pool.end();
  process.exit(missing.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
