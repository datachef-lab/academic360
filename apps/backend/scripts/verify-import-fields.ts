/**
 * Deep verification for imported legacy students: field correctness vs the
 * legacy MySQL source, per-student dedup, and cross-link integrity (no
 * student's child rows point at another student's records).
 *
 *   npx tsx scripts/verify-import-fields.ts /tmp/uids.txt
 *
 * Prints PASS/FAIL per check with per-uid details for any failure.
 */
import fs from "fs";
import { db, mysqlConnection } from "@/db/index.js";
import { sql } from "drizzle-orm";

type Row = Record<string, unknown>;
const norm = (v: unknown) => (v == null ? "" : String(v).trim().toUpperCase());

async function main() {
  const uids = fs
    .readFileSync(process.argv[2]!, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  console.log(`Verifying ${uids.length} imported UIDs field-by-field…\n`);

  const problems: string[] = [];
  const ok = (label: string, cond: boolean, detail: string) => {
    if (!cond) problems.push(`FAIL ${label}: ${detail}`);
    return cond;
  };

  let checkedFields = 0;

  for (const uid of uids) {
    // ---- legacy source rows ----
    const [[spd]] = (await mysqlConnection.query(
      "SELECT * FROM studentpersonaldetails WHERE codeNumber = ?",
      [uid],
    )) as [Row[], unknown];
    if (!spd) {
      problems.push(`FAIL legacy-missing: ${uid} not in legacy DB`);
      continue;
    }
    const [legacyHrs] = (await mysqlConnection.query(
      "SELECT hr.*, c.classname, sh.shiftName, crs.courseName FROM historicalrecord hr LEFT JOIN classes c ON c.id=hr.classId LEFT JOIN shift sh ON sh.id=hr.shiftId LEFT JOIN course crs ON crs.id=hr.courseId WHERE hr.parent_id = ?",
      [spd.id],
    )) as [Row[], unknown];
    const [[subjCount]] = (await mysqlConnection.query(
      "SELECT COUNT(*) n FROM studentsubjectdetail WHERE parent_id = ?",
      [spd.id],
    )) as [Row[], unknown];

    // ---- PG rows ----
    const stuRows = (await db.execute(
      sql`SELECT s.*, u.name AS u_name, u.email AS u_email, u.phone AS u_phone,
                 u.whatsapp_number AS u_whatsapp, u.type AS u_type, u.id AS u_id
          FROM students s JOIN users u ON u.id = s.user_id_fk
          WHERE s.uid = ${uid}`,
    )) as unknown as { rows: Row[] };
    ok(
      "students-exactly-one",
      stuRows.rows.length === 1,
      `${uid}: ${stuRows.rows.length} student rows`,
    );
    const stu = stuRows.rows[0];
    if (!stu) continue;

    // ---- FIELD CHECKS (students + users vs legacy spd) ----
    checkedFields += 6;
    ok(
      "uid",
      norm(stu.uid) === norm(spd.codeNumber),
      `${uid}: pg=${stu.uid} legacy=${spd.codeNumber}`,
    );
    ok(
      "legacy_student_id",
      Number(stu.legacy_student_id) === Number(spd.id),
      `${uid}: pg=${stu.legacy_student_id} legacy=${spd.id}`,
    );
    ok(
      "user.name",
      norm(stu.u_name) === norm(spd.name),
      `${uid}: pg="${stu.u_name}" legacy="${spd.name}"`,
    );
    ok("user.type", stu.u_type === "STUDENT", `${uid}: type=${stu.u_type}`);
    if (spd.univregno) {
      ok(
        "registration_number",
        norm(stu.registration_number) === norm(spd.univregno),
        `${uid}: pg=${stu.registration_number} legacy=${spd.univregno}`,
      );
    }
    if (spd.univlstexmrollno) {
      ok(
        "roll_number",
        norm(stu.roll_number) === norm(spd.univlstexmrollno),
        `${uid}: pg=${stu.roll_number} legacy=${spd.univlstexmrollno}`,
      );
    }
    const legacyPhone =
      (spd.contactNo as string)?.trim() ||
      (spd.phoneMobileNo as string)?.trim() ||
      "";
    if (legacyPhone) {
      ok(
        "user.phone",
        norm(stu.u_phone) === norm(legacyPhone),
        `${uid}: pg=${stu.u_phone} legacy=${legacyPhone}`,
      );
    }

    // ---- PROMOTIONS: count + field + CROSS-LINK vs legacy historicalrecord ----
    const promoRows = (await db.execute(
      sql`SELECT p.*, se.legacy_session_id, cl.name AS class_name, sh.name AS shift_name, sh.legacy_shift_id, pc.name AS pc_name
          FROM promotions p
          JOIN sessions se ON se.id = p.session_id_fk
          JOIN classes cl ON cl.id = p.class_id_fk
          JOIN shifts sh ON sh.id = p.shift_id_fk
          JOIN program_courses pc ON pc.id = p.program_course_id_fk
          WHERE p.student_id_fk = ${stu.id}`,
    )) as unknown as { rows: Row[] };
    checkedFields += promoRows.rows.length * 5;

    ok(
      "promotions-count",
      promoRows.rows.length === legacyHrs.length,
      `${uid}: pg=${promoRows.rows.length} legacy hr=${legacyHrs.length}`,
    );
    // dedup within student
    const hrIds = promoRows.rows.map((p) =>
      Number(p.legacy_historical_record_id),
    );
    ok(
      "promotions-deduped",
      new Set(hrIds).size === hrIds.length,
      `${uid}: duplicate legacy_historical_record_id among promotions`,
    );

    const legacyByHr = new Map(legacyHrs.map((h) => [Number(h.id), h]));
    for (const p of promoRows.rows) {
      const hr = legacyByHr.get(Number(p.legacy_historical_record_id));
      // CROSS-LINK: the promotion's legacy hr must belong to THIS legacy student
      if (
        !ok(
          "promotion-crosslink",
          !!hr,
          `${uid}: promotion ${p.id} hr=${p.legacy_historical_record_id} does NOT belong to legacy student ${spd.id}`,
        )
      )
        continue;
      ok(
        "promotion.session",
        Number(p.legacy_session_id) === Number(hr!.sessionid),
        `${uid}: promo ${p.id} session pg=${p.legacy_session_id} legacy=${hr!.sessionid}`,
      );
      ok(
        "promotion.class",
        norm(p.class_name) === norm(hr!.classname),
        `${uid}: promo ${p.id} class pg=${p.class_name} legacy=${hr!.classname}`,
      );
      ok(
        "promotion.shift",
        norm(p.shift_name) === norm(hr!.shiftName),
        `${uid}: promo ${p.id} shift pg=${p.shift_name} legacy=${hr!.shiftName}`,
      );
      if (hr!.rollNo != null && String(hr!.rollNo) !== "") {
        ok(
          "promotion.classRoll",
          norm(p.class_roll_number) === norm(hr!.rollNo),
          `${uid}: promo ${p.id} roll pg=${p.class_roll_number} legacy=${hr!.rollNo}`,
        );
      }
    }

    // ---- ONE-PER-USER child rows + cross-link (all must point at THIS user/student) ----
    const links = (await db.execute(
      sql`SELECT
            (SELECT count(*) FROM personal_details WHERE user_id_fk = ${stu.u_id}) AS pdet,
            (SELECT count(*) FROM students WHERE user_id_fk = ${stu.u_id}) AS students_of_user,
            (SELECT count(*) FROM family_details WHERE user_id_fk = ${stu.u_id}) AS fam,
            (SELECT count(*) FROM health WHERE user_id_fk = ${stu.u_id}) AS health,
            (SELECT count(*) FROM emergency_contacts WHERE user_id_fk = ${stu.u_id}) AS emerg,
            (SELECT count(*) FROM student_subject_selections WHERE student_id_fk = ${stu.id}) AS subsel,
            (SELECT count(*) FROM fee_student_mappings fsm WHERE fsm.student_id_fk = ${stu.id}
               AND EXISTS (SELECT 1 FROM fee_group_promotion_mappings fgp JOIN promotions pp ON pp.id=fgp.promotion_id_fk
                           WHERE fgp.id=fsm.fee_group_promotion_mapping_id_fk AND pp.student_id_fk <> ${stu.id})) AS fee_crossed`,
    )) as unknown as { rows: Row[] };
    const l = links.rows[0]!;
    checkedFields += 7;
    ok(
      "one-personal-details",
      Number(l.pdet) <= 1,
      `${uid}: ${l.pdet} personal_details rows for user ${stu.u_id}`,
    );
    ok(
      "one-student-per-user",
      Number(l.students_of_user) === 1,
      `${uid}: user ${stu.u_id} has ${l.students_of_user} student rows (cross-link!)`,
    );
    ok("one-family", Number(l.fam) <= 1, `${uid}: ${l.fam} family rows`);
    ok("one-health", Number(l.health) <= 1, `${uid}: ${l.health} health rows`);
    ok(
      "one-emergency",
      Number(l.emerg) <= 1,
      `${uid}: ${l.emerg} emergency_contact rows`,
    );
    ok(
      "fee-mapping-not-crossed",
      Number(l.fee_crossed) === 0,
      `${uid}: ${l.fee_crossed} fee mappings whose FGP points at ANOTHER student's promotion (cross-link!)`,
    );
    // subject selections belong to this student by query construction; count sanity vs legacy
    if (Number(subjCount.n) > 0) {
      ok(
        "subject-selections-present",
        Number(l.subsel) > 0,
        `${uid}: legacy has ${subjCount.n} subject rows but PG has 0 selections`,
      );
    }
  }

  console.log(
    `\nChecked ~${checkedFields} field/link assertions across ${uids.length} UIDs.`,
  );
  if (problems.length === 0) {
    console.log("ALL CHECKS PASSED — fields correct, deduped, no cross-links.");
  } else {
    console.log(`${problems.length} PROBLEM(S):`);
    for (const p of problems) console.log("  " + p);
  }
  process.exit(problems.length === 0 ? 0 : 2);
}

void main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
