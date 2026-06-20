// Bulk verification of an imported UID set: legacy (MySQL) vs new (Postgres, local).
// Runs on the EC2 host (needs both DATABASE_URL and OLD_DB_* in env).
// Two big reads + in-memory compare (fast vs per-student deep-verify).
//
// Usage: pnpm tsx scripts/bulk-verify-import.ts --uids=/tmp/sem4-import/uids.txt
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { createPool } from "mysql2/promise";
import { Pool as PgPool } from "pg";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const uidsArg = process.argv
  .slice(2)
  .find((a) => a.startsWith("--uids="))
  ?.slice("--uids=".length);
if (!uidsArg) {
  console.error("--uids=<file> required");
  process.exit(1);
}
const UIDS = readFileSync(uidsArg, "utf8")
  .split(/\s+/)
  .map((s) => s.trim())
  .filter(Boolean);
const UIDSET = new Set(UIDS.map((u) => u.toUpperCase()));

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

function istDate(v: any): string {
  if (!v) return "";
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
const norm = (v: any) =>
  String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
const digits = (v: any) => String(v ?? "").replace(/\D/g, "");

async function main() {
  // chunk IN() for mysql
  const inList = UIDS.map((u) => `'${u.replace(/'/g, "")}'`).join(",");

  // ---- LEGACY pull ----
  const [legRows]: any = await legacy.query(`
    SELECT spd.codeNumber, spd.name, spd.email, spd.contactNo, spd.dateOfBirth, spd.univregno,
      (SELECT COUNT(*) FROM historicalrecord hr WHERE hr.parent_id = spd.id) AS hr_count,
      (SELECT COUNT(*) FROM studentsubjectdetail ssd
         JOIN studentacademicdetail sad ON sad.id = ssd.parent_id
         JOIN subject sb ON sb.id = ssd.subjectId
        WHERE sad.parent_id = spd.id) AS subj_count
    FROM studentpersonaldetails spd
    WHERE spd.codeNumber IN (${inList})
  `);
  const legByUid = new Map<string, any>();
  for (const r of legRows) legByUid.set(String(r.codeNumber).toUpperCase(), r);

  // ---- NEW pull ----
  const newRes = await pg.query(
    `
    SELECT s.uid, u.name, u.email, pd.date_of_birth, s.registration_number,
      (SELECT COUNT(*) FROM promotions p WHERE p.student_id_fk = s.id) AS promo_count,
      (SELECT COUNT(*) FROM student_academic_subjects sas
         JOIN admission_academic_info aai ON aai.id = sas.admission_academic_info_id_fk
         JOIN application_forms af ON af.id = aai.application_form_id_fk
        WHERE af.id = s.application_form_id_fk) AS sas_count,
      af.level
    FROM students s
    JOIN users u ON u.id = s.user_id_fk
    LEFT JOIN personal_details pd ON pd.user_id_fk = u.id
    LEFT JOIN application_forms af ON af.id = s.application_form_id_fk
    WHERE UPPER(s.uid) = ANY($1)
  `,
    [[...UIDSET]],
  );
  const newByUid = new Map<string, any>();
  for (const r of newRes.rows) newByUid.set(String(r.uid).toUpperCase(), r);

  // ---- compare ----
  const rows: string[] = [];
  let present = 0,
    missing = 0,
    nameDiff = 0,
    dobDiff = 0,
    regDiff = 0,
    promoDiff = 0,
    subjZero = 0,
    levelBad = 0;
  for (const uid of UIDS) {
    const U = uid.toUpperCase();
    const L = legByUid.get(U);
    const N = newByUid.get(U);
    if (!N) {
      missing++;
      rows.push(`${uid},MISSING,not in new DB`);
      continue;
    }
    present++;
    if (L) {
      if (norm(L.name) !== norm(N.name)) {
        nameDiff++;
        rows.push(`${uid},NAME,"${L.name}"!="${N.name}"`);
      }
      if (istDate(L.dateOfBirth) !== istDate(N.date_of_birth)) {
        dobDiff++;
        rows.push(
          `${uid},DOB,${istDate(L.dateOfBirth)}!=${istDate(N.date_of_birth)}`,
        );
      }
      if (
        digits(L.univregno) &&
        digits(L.univregno) !== digits(N.registration_number)
      ) {
        regDiff++;
        rows.push(`${uid},REGNO,${L.univregno}!=${N.registration_number}`);
      }
      if (Number(L.hr_count) !== Number(N.promo_count)) {
        promoDiff++;
        rows.push(
          `${uid},PROMO_COUNT,legacy=${L.hr_count} new=${N.promo_count}`,
        );
      }
      if (Number(L.subj_count) > 0 && Number(N.sas_count) === 0) {
        subjZero++;
        rows.push(`${uid},ACAD_SUBJ,legacy=${L.subj_count} new=0`);
      }
    }
    if (N.level !== "UNDER_GRADUATE") {
      levelBad++;
      rows.push(`${uid},LEVEL,${N.level}`);
    }
  }

  const outPath = join("/tmp", "bulk-verify-mismatches.csv");
  writeFileSync(outPath, "uid,issue,detail\n" + rows.join("\n"));
  console.log(`=== BULK VERIFY (${UIDS.length} UIDs) ===`);
  console.log(`present=${present} missing=${missing}`);
  console.log(
    `nameDiff=${nameDiff} dobDiff=${dobDiff} regNoDiff=${regDiff} promoCountDiff=${promoDiff} acadSubjZero=${subjZero} levelNotUG=${levelBad}`,
  );
  console.log(`mismatch rows -> ${outPath}`);

  await legacy.end();
  await pg.end();
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
