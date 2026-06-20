// Per-student-per-semester paper count verification.
// Now uses the SAME query pattern as exam-schedule (`getEligibleStudentIds` in
// apps/backend/src/features/exams/services/exam-schedule.service.ts), which:
//   - resolves the student's AY via their promotion → session.academic_id_fk
//   - filters papers by (program × class × AY × is_active)
//   - matches optional papers to student_subject_selections via (subject_id, subject_type)
//     and meta-class membership
//   - takes LATEST selection per (student × meta) via ROW_NUMBER
//
// Compares per (student × semester) the SET of subject IDs:
//   LEGACY = compulsory + optional (chosen) papers in scope
//   NEW    = compulsory papers (catalog) + optional papers the student matches
// If they differ, the row goes to the mismatches CSV.
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { createPool } from "mysql2/promise";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { db } from "../src/db/index.js";
import { studentModel, subjectTypeModel } from "@repo/db/schemas/models";
import { Pool as PgPool } from "pg";

const UID_FILTER = process.argv
  .slice(2)
  .find((a) => a.startsWith("--uid="))
  ?.slice("--uid=".length);

const legacyPool = createPool({
  host: process.env.OLD_DB_HOST!,
  port: parseInt(process.env.OLD_DB_PORT!, 10),
  user: process.env.OLD_DB_USER!,
  password: process.env.OLD_DB_PASSWORD!,
  database: process.env.OLD_DB_NAME!,
  connectTimeout: 60_000,
  connectionLimit: 4,
});

const pgPool = new PgPool({ connectionString: process.env.DATABASE_URL });

const CLASS_MAP: Record<number, number> = { 4: 1, 5: 2, 6: 3, 7: 4 };

function loadBridgeCsv(): Map<number, number> {
  const path = join(process.cwd(), "excel-data", "subject-bridge.csv");
  const text = readFileSync(path, "utf8");
  const m = new Map<number, number>();
  for (const line of text.split("\n").slice(1)) {
    if (!line.trim()) continue;
    const cols = line.match(/"([^"]*)"/g)?.map((s) => s.slice(1, -1)) ?? [];
    if (cols.length < 5) continue;
    const [legacyId, , , bucket, newId] = cols;
    if (!newId) continue;
    if (bucket === "EXACT" || bucket === "FUZZY-AUTO" || bucket === "ALREADY") {
      m.set(Number(legacyId), Number(newId));
    }
  }
  return m;
}

type MismatchRow = {
  uid: string;
  semester: string;
  academic_year_id: number;
  legacy_count: number;
  new_count: number;
  severity: "ERROR" | "INFO";
  note: string;
};

async function main() {
  const subjectBridge = loadBridgeCsv();
  const subjectTypes = await db.select().from(subjectTypeModel);
  const stLegacyToNew = new Map<number, number>();
  for (const st of subjectTypes) {
    if (st.legacySubjectTypeId != null)
      stLegacyToNew.set(st.legacySubjectTypeId, st.id!);
  }

  let students = await db
    .select()
    .from(studentModel)
    .where(
      sql`${studentModel.id} IN (SELECT DISTINCT student_id_fk FROM student_subject_selections WHERE change_reason = 'legacy-migration')`,
    );
  if (UID_FILTER)
    students = students.filter((s: any) => s.uid === UID_FILTER.toUpperCase());
  console.log(`Verifying ${students.length} students...`);

  const mismatches: MismatchRow[] = [];
  let cleanCount = 0;

  for (const stu of students) {
    // 1. Pull this student's distinct (session, class) promotion rows. Each is a "semester" to verify.
    const promRes = await pgPool.query(
      `
      SELECT DISTINCT pr.session_id_fk, pr.class_id_fk, pr.program_course_id_fk,
                      s.academic_id_fk AS academic_year_id, s.legacy_session_id
      FROM promotions pr
      JOIN sessions s ON s.id = pr.session_id_fk
      WHERE pr.student_id_fk = $1
        AND pr.class_id_fk IN (1,2,3,4)
      `,
      [stu.id],
    );

    let stuErrors = 0;

    for (const prom of promRes.rows) {
      const newClassId = Number(prom.class_id_fk);
      const academicYearId = Number(prom.academic_year_id);
      const programCourseId = Number(prom.program_course_id_fk);
      const legacySessionId = Number(prom.legacy_session_id);
      const semLabel = `Sem ${["I", "II", "III", "IV"][newClassId - 1]}`;
      const legacyClassId = Object.entries(CLASS_MAP).find(
        ([, v]) => v === newClassId,
      )?.[0];
      if (!legacyClassId) continue;

      // 2. Legacy: distinct subjects student is enrolled in for that (session, class)
      const [legacyRows]: any = await legacyPool.query(
        `
        (SELECT DISTINCT p.subjectTypeId, p.subjectId
         FROM studentpaperlinkingmain m
         JOIN studentpaperlinkingpaperlist p ON p.parent_id = m.id
         JOIN historicalrecord h ON m.courseId=h.courseId AND m.classId=h.classId
                                  AND m.sectionId=h.sectionid AND m.shiftId=h.shiftId
                                  AND m.sessionId=h.sessionid
         JOIN studentpersonaldetails spd ON spd.id = h.parent_id
         WHERE spd.codeNumber = ? AND p.allstudents='1'
           AND m.sessionId = ? AND m.classId = ?)
        UNION
        (SELECT DISTINCT p.subjectTypeId, p.subjectId
         FROM studentpaperlinkingmain m
         JOIN studentpaperlinkingpaperlist p ON p.parent_id = m.id
         JOIN studentpaperlinkingstudentlist ss ON ss.parent_id = p.id
         JOIN studentpersonaldetails spd ON spd.id = ss.studentId
         WHERE spd.codeNumber = ? AND p.allstudents='0'
           AND m.sessionId = ? AND m.classId = ?)
        `,
        [
          stu.uid,
          legacySessionId,
          legacyClassId,
          stu.uid,
          legacySessionId,
          legacyClassId,
        ],
      );
      // Bridge legacy subject IDs to new subject IDs; drop subject types with no new equivalent.
      const legacySubIds = new Set<number>();
      for (const r of legacyRows) {
        if (!stLegacyToNew.has(Number(r.subjectTypeId))) continue;
        const ns = subjectBridge.get(Number(r.subjectId));
        if (ns) legacySubIds.add(ns);
      }

      // 3. NEW: same pattern as exam-schedule's eligibility query — for this student in this class/AY/programCourse,
      // collect: (a) compulsory paper subjects (b) optional paper subjects student matches via selection.
      const newRes = await pgPool.query(
        `
        WITH filtered_papers AS (
          SELECT p.id, p.subject_id_fk, p.subject_type_id_fk, p.is_optional
          FROM papers p
          WHERE p.programe_course_id_fk = $1
            AND p.class_id_fk = $2
            AND p.academic_year_id_fk = $3
            AND p.is_active = TRUE
        ),
        latest_selections AS (
          SELECT student_id_fk, subject_id_fk, subject_selection_meta_id_fk
          FROM (
            SELECT sss.*,
                   ROW_NUMBER() OVER (
                     PARTITION BY sss.student_id_fk, sss.subject_selection_meta_id_fk
                     ORDER BY sss.version DESC, sss.updated_at DESC NULLS LAST,
                              sss.created_at DESC, sss.id DESC
                   ) AS rn
            FROM student_subject_selections sss
            WHERE sss.is_active = TRUE
              AND sss.student_id_fk = $4
          ) r
          WHERE rn = 1
        ),
        mandatory_subjects AS (
          SELECT DISTINCT fp.subject_id_fk
          FROM filtered_papers fp
          WHERE fp.is_optional = FALSE
        ),
        optional_subjects AS (
          SELECT DISTINCT fp.subject_id_fk
          FROM filtered_papers fp
          JOIN latest_selections lss
            ON lss.subject_id_fk = fp.subject_id_fk
          JOIN subject_selection_meta sm
            ON sm.id = lss.subject_selection_meta_id_fk
           AND sm.subject_type_id_fk = fp.subject_type_id_fk
          JOIN subject_selection_meta_classes smc
            ON smc.subject_selection_meta_id_fk = sm.id
           AND smc.class_id_fk = $2
          WHERE fp.is_optional = TRUE
        )
        SELECT subject_id_fk AS subject_id FROM mandatory_subjects
        UNION
        SELECT subject_id_fk AS subject_id FROM optional_subjects
        `,
        [programCourseId, newClassId, academicYearId, stu.id],
      );
      const newSubIds = new Set<number>(
        newRes.rows
          .map((r: any) => Number(r.subject_id))
          .filter((n) => Number.isFinite(n)),
      );

      if (
        legacySubIds.size !== newSubIds.size ||
        ![...legacySubIds].every((x) => newSubIds.has(x))
      ) {
        const onlyLegacy = [...legacySubIds].filter((x) => !newSubIds.has(x));
        const onlyNew = [...newSubIds].filter((x) => !legacySubIds.has(x));
        mismatches.push({
          uid: stu.uid!,
          semester: semLabel,
          academic_year_id: academicYearId,
          legacy_count: legacySubIds.size,
          new_count: newSubIds.size,
          severity: "ERROR",
          note: `legacy_only=[${onlyLegacy.join(",")}] new_only=[${onlyNew.join(",")}]`,
        });
        stuErrors++;
      }
    }

    if (stuErrors === 0) cleanCount++;
    else console.log(`  ${stu.uid}: ${stuErrors} (sem × AY) mismatches`);
  }

  const header =
    "uid,semester,academic_year_id,legacy_count,new_count,severity,note\n";
  const body = mismatches
    .map((r) =>
      [
        r.uid,
        r.semester,
        r.academic_year_id,
        r.legacy_count,
        r.new_count,
        r.severity,
        r.note,
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const out = join(process.cwd(), "excel-data", "paper-count-mismatches.csv");
  writeFileSync(out, header + body);

  console.log(`\nWrote ${out}`);
  console.log(
    `Summary: students=${students.length} clean=${cleanCount} ERROR=${mismatches.length}`,
  );

  await legacyPool.end();
  await pgPool.end();
  process.exit(mismatches.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
