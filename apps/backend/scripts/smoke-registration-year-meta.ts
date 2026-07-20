// Smoke test for the registration-year meta rule.
//
// Verifies three claims:
//   1. getRegistrationAcademicYearId returns FIRST promotion's session's AY.
//   2. findSubjectsSelections serves metas from the registration AY only.
//   3. normalizeSelectionsToRegistrationYearMetas rewrites wrong-AY meta ids to
//      the registration-AY equivalent and errors when no equivalent exists.
//
// Read-only. No writes to student_subject_selections.
/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { db } from "../src/db/index.js";
import { normalizeSelectionsToRegistrationYearMetas } from "../src/features/subject-selection/services/student-subject-selection.service.js";
import {
  findSubjectsSelections,
  getRegistrationAcademicYearId,
} from "../src/features/subject-selection/services/student-subjects.service.js";

async function pickStudent() {
  const rows = await db.execute<{
    student_id: number;
    roll_number: string;
    reg_ay: number;
    cur_ay: number;
  }>(
    `WITH first_p AS (
       SELECT DISTINCT ON (p.student_id_fk)
         p.student_id_fk, s.academic_id_fk AS reg_ay
       FROM promotions p JOIN sessions s ON s.id = p.session_id_fk
       ORDER BY p.student_id_fk, p.id ASC
     ), last_p AS (
       SELECT DISTINCT ON (p.student_id_fk)
         p.student_id_fk, s.academic_id_fk AS cur_ay
       FROM promotions p JOIN sessions s ON s.id = p.session_id_fk
       ORDER BY p.student_id_fk, p.id DESC
     )
     SELECT st.id AS student_id, st.roll_number, fp.reg_ay, lp.cur_ay
     FROM students st
     JOIN first_p fp ON fp.student_id_fk = st.id
     JOIN last_p lp ON lp.student_id_fk = st.id
     WHERE fp.reg_ay <> lp.cur_ay
     LIMIT 1`,
  );
  const row = (rows as any).rows?.[0] ?? (rows as any)[0];
  if (!row) throw new Error("no student found with reg_ay != cur_ay");
  return row;
}

async function main() {
  const student = await pickStudent();
  console.log("student:", student);

  // 1) helper
  const regAy = await getRegistrationAcademicYearId(student.student_id);
  console.log(
    `getRegistrationAcademicYearId -> ${regAy} (expected ${student.reg_ay})`,
  );
  if (regAy !== student.reg_ay) throw new Error("helper returned wrong AY");
  console.log("✅ (1) helper returns first-promotion AY");

  // 2) findSubjectsSelections uses registration AY
  const view = await findSubjectsSelections(student.student_id);
  const metaAys = Array.from(
    new Set(view.subjectSelectionMetas.map((m: any) => m.academicYear?.id)),
  );
  console.log("findSubjectsSelections meta AYs:", metaAys);
  if (metaAys.length !== 1 || metaAys[0] !== regAy) {
    throw new Error(`expected only AY ${regAy}, got ${metaAys.join(",")}`);
  }
  console.log("✅ (2) read path serves registration-AY metas only");

  // 3) normalizer: pick metas that exist in BOTH AYs with the same label.
  const twoMetaRows = await db.execute(
    `SELECT mreg.id AS reg_id, mcur.id AS cur_id, mreg.label
     FROM subject_selection_meta mreg
     JOIN subject_selection_meta mcur
       ON mcur.subject_type_id_fk = mreg.subject_type_id_fk
      AND lower(trim(mcur.label)) = lower(trim(mreg.label))
     WHERE mreg.academic_year_id_fk = ${regAy}
       AND mcur.academic_year_id_fk = ${student.cur_ay}
     LIMIT 3`,
  );
  const rows: any[] = (twoMetaRows as any).rows ?? (twoMetaRows as any);
  if (!rows.length)
    throw new Error("no shared metas between reg/cur AY — cannot test rewrite");
  console.log("rewrite test rows:", rows);

  const inputs = rows.map((r) => ({
    studentId: student.student_id,
    session: { id: 0 },
    subjectSelectionMeta: { id: r.cur_id }, // WRONG-year id
    subject: { id: 0, name: "" },
  }));
  const rewritten = await normalizeSelectionsToRegistrationYearMetas(
    student.student_id,
    inputs,
  );
  if (rewritten.errors.length) {
    console.error(rewritten.errors);
    throw new Error(
      "normalizer returned unexpected errors on rewritable input",
    );
  }
  rows.forEach((r, i) => {
    const got = rewritten.selections[i].subjectSelectionMeta.id;
    console.log(`  "${r.label}": ${r.cur_id} -> ${got} (expected ${r.reg_id})`);
    if (got !== r.reg_id) throw new Error(`rewrite failed for row ${i}`);
  });
  console.log(
    "✅ (3a) wrong-AY meta ids rewritten to registration-AY equivalents",
  );

  // Unreachable meta: a meta whose label+subjectType has no twin in the reg AY.
  const orphanRows = await db.execute(
    `SELECT id, label FROM subject_selection_meta m
     WHERE m.academic_year_id_fk <> ${regAy}
       AND NOT EXISTS (
         SELECT 1 FROM subject_selection_meta m2
         WHERE m2.academic_year_id_fk = ${regAy}
           AND m2.subject_type_id_fk = m.subject_type_id_fk
           AND lower(trim(m2.label)) = lower(trim(m.label))
       )
     LIMIT 1`,
  );
  const orphan = ((orphanRows as any).rows ?? (orphanRows as any))[0];
  if (orphan) {
    const orphanResult = await normalizeSelectionsToRegistrationYearMetas(
      student.student_id,
      [
        {
          studentId: student.student_id,
          session: { id: 0 },
          subjectSelectionMeta: { id: orphan.id },
          subject: { id: 0, name: "" },
        },
      ],
    );
    if (!orphanResult.errors.length) {
      throw new Error("orphan meta test: expected an error, got none");
    }
    console.log("orphan meta error:", orphanResult.errors[0].message);
    console.log("✅ (3b) orphan meta -> validation error (not silent write)");
  } else {
    console.log("(no orphan meta in fixture; skipping 3b)");
  }

  console.log("\nSMOKE PASSED.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
