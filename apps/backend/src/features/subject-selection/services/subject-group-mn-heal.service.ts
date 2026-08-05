// Heals BCom (H) and BCom (G) Minor 3 (Semester III to VI) selections that
// were synced as per-semester per-subject rows before the SUBJECT_GROUP
// option source existed (ADR 0027). For each affected student, the
// existing subject-based rows are deprecated and a single SUBJECT_GROUP
// row is inserted that keys on `subject_grouping_main_id_fk` instead of
// `subject_id_fk`.
//
// Correctness rules:
// - Student's registration academic year comes from the FIRST promotion
//   (`promotions` ordered by `id ASC` → first Sem I session → academic_year).
//   The target subject_grouping_main row MUST live in that same AY —
//   never the current year — otherwise a 2023-24 student would end up
//   pointing at a 2025-26 group.
// - Program-course constraint: BCom (H) → id 20, BCom (G) → id 22. The
//   group's `subject_grouping_program_courses` M2M gates which program
//   sees which group (Major vs MDC).
// - Uniqueness rule: the student's picked subjects must be a subset of
//   exactly one group's subjects for the (AY, program course, subject
//   type = MN) triple. Zero matches or multiple matches → skip and log
//   (the operator resolves by hand).
//
// State-based: skips any student who already has an active
// SUBJECT_GROUP-based row for the same meta. Re-runs are zero-work when
// everything is already reconciled.

import { db } from "@/db/index.js";
import { createLogger } from "@/config/logger.js";
import { sql, type SQL } from "drizzle-orm";

const log = createLogger("subject-group-mn-heal");

/**
 * BCom (H) and BCom (G) — the only two program courses currently in
 * scope. The dataset only has Minor 3 subject-group configuration for
 * these two.
 */
const BCOM_PROGRAM_COURSE_IDS = [20, 22];
/** Registration academic years the heal covers. */
const SCOPE_YEAR_LABELS = ["2023-24", "2024-25"];

export type SubjectGroupMnHealSummary = {
  scanned: number;
  healed: number;
  skippedNoMatch: number;
  skippedAmbiguous: number;
  failed: number;
  [key: string]: unknown;
};

type MappingRow = {
  student_id: number;
  meta_id: number;
  ay_id: number;
  pc: number;
  old_selection_ids: number[];
  matching_group_ids: number[] | null;
  status: "unique" | "ambiguous" | "no_match";
};

/**
 * The shared mapping query. Both entry points (boot heal + per-student
 * migration hook) call this; the only difference is whether an extra
 * `WHERE p.student_id_fk = $studentId` filter is applied to the
 * `reg_ay` CTE. Everything else — the reg-AY resolution, the
 * uniqueness gate, the state-based idempotency — is identical.
 */
async function scanMapping(scope: {
  studentIdFilter: SQL | null;
}): Promise<MappingRow[]> {
  const scopeFilter =
    scope.studentIdFilter ??
    sql`p.student_id_fk IN (
      SELECT id FROM students WHERE program_course_id_fk IN (
        ${sql.raw(BCOM_PROGRAM_COURSE_IDS.join(","))}
      )
    )`;

  const rows = (
    await db.execute(sql`
      WITH reg_ay AS (
        SELECT DISTINCT ON (p.student_id_fk)
               p.student_id_fk AS student_id,
               ay.id           AS reg_ay_id
        FROM promotions p
        JOIN sessions se ON se.id = p.session_id_fk
        JOIN academic_years ay ON ay.id = se.academic_id_fk
        WHERE ${scopeFilter}
        ORDER BY p.student_id_fk, p.id ASC
      ),
      target_metas AS (
        SELECT ssm.id AS meta_id, ssm.academic_year_id_fk AS ay_id
        FROM subject_selection_meta ssm
        JOIN subject_types st ON st.id = ssm.subject_type_id_fk
        JOIN academic_years ay ON ay.id = ssm.academic_year_id_fk
        WHERE st.code = 'MN'
          AND ssm.option_source = 'SUBJECT_GROUP'
          AND ay.year IN (${sql.raw(SCOPE_YEAR_LABELS.map((y) => `'${y}'`).join(","))})
      ),
      candidates AS (
        SELECT sss.student_id_fk       AS student_id,
               s.program_course_id_fk  AS pc,
               tm.meta_id,
               tm.ay_id,
               array_agg(DISTINCT sss.subject_id_fk ORDER BY sss.subject_id_fk) AS picked_subject_ids,
               array_agg(sss.id)       AS old_selection_ids
        FROM student_subject_selections sss
        JOIN students s ON s.id = sss.student_id_fk
        JOIN reg_ay fp ON fp.student_id = s.id
        JOIN target_metas tm
          ON tm.meta_id = sss.subject_selection_meta_id_fk
         AND tm.ay_id  = fp.reg_ay_id
        WHERE sss.is_active = true
          AND sss.subject_id_fk IS NOT NULL
          AND s.program_course_id_fk IN (${sql.raw(BCOM_PROGRAM_COURSE_IDS.join(","))})
          AND NOT EXISTS (
            SELECT 1 FROM student_subject_selections o
            WHERE o.student_id_fk = sss.student_id_fk
              AND o.subject_selection_meta_id_fk = sss.subject_selection_meta_id_fk
              AND o.is_active = true
              AND o.subject_grouping_main_id_fk IS NOT NULL
          )
        GROUP BY sss.student_id_fk, s.program_course_id_fk, tm.meta_id, tm.ay_id
      ),
      candidate_groups AS (
        SELECT sgm.id AS group_id,
               sgm.academic_year_id_fk AS ay_id,
               sgpc.program_course_id_fk AS pc,
               array_agg(DISTINCT sgs.subject_id_fk ORDER BY sgs.subject_id_fk) AS group_subject_ids
        FROM subject_grouping_main sgm
        JOIN subject_grouping_subjects sgs ON sgs.subject_grouping_main_id_fk = sgm.id
        JOIN subject_grouping_program_courses sgpc ON sgpc.subject_grouping_main_id_fk = sgm.id
        WHERE sgm.subject_type_id_fk = (SELECT id FROM subject_types WHERE code = 'MN')
          AND sgm.is_active = true
          AND sgpc.program_course_id_fk IN (${sql.raw(BCOM_PROGRAM_COURSE_IDS.join(","))})
        GROUP BY sgm.id, sgm.academic_year_id_fk, sgpc.program_course_id_fk
      ),
      matched AS (
        SELECT c.*,
               (
                 SELECT array_agg(cg.group_id ORDER BY cg.group_id)
                 FROM candidate_groups cg
                 WHERE cg.ay_id = c.ay_id
                   AND cg.pc = c.pc
                   AND c.picked_subject_ids <@ cg.group_subject_ids
               ) AS matching_group_ids
        FROM candidates c
      )
      SELECT student_id, meta_id, ay_id, pc, old_selection_ids,
             matching_group_ids,
             CASE
               WHEN matching_group_ids IS NULL
                    OR array_length(matching_group_ids, 1) IS NULL THEN 'no_match'
               WHEN array_length(matching_group_ids, 1) = 1 THEN 'unique'
               ELSE 'ambiguous'
             END AS status
      FROM matched
    `)
  ).rows as unknown as MappingRow[];
  return rows;
}

/**
 * Deprecate the old subject-based selections and insert the new
 * SUBJECT_GROUP row. One transaction per student — atomic. The old
 * rows keep their version + parent-chain data (audit trail intact); we
 * only flip `is_active`/`is_deprecated`. The new row's version is
 * `max(existing) + 1` so it slots cleanly into the versioning invariant
 * from ADR 0027 §3.
 */
async function applyHeal(row: MappingRow, groupId: number): Promise<void> {
  const oldIds = row.old_selection_ids;
  await db.transaction(async (tx) => {
    await tx.execute(sql`
      UPDATE student_subject_selections
      SET is_active = false,
          is_deprecated = true,
          updated_at = NOW()
      WHERE id IN (${sql.raw(oldIds.join(","))})
    `);

    const seed = (
      await tx.execute(sql`
        SELECT min(id) AS earliest_id,
               coalesce(max(version), 1) + 1 AS next_version,
               min(session_id_fk) AS session_id,
               min(created_by_user_id_fk) AS created_by
        FROM student_subject_selections
        WHERE id IN (${sql.raw(oldIds.join(","))})
      `)
    ).rows[0] as unknown as {
      earliest_id: number;
      next_version: number;
      session_id: number;
      created_by: number;
    };

    await tx.execute(sql`
      INSERT INTO student_subject_selections (
        session_id_fk,
        subject_selection_meta_id_fk,
        student_id_fk,
        subject_id_fk,
        subject_grouping_main_id_fk,
        version,
        parent_id_fk,
        is_deprecated,
        is_active,
        created_by_user_id_fk,
        change_reason
      ) VALUES (
        ${seed.session_id},
        ${row.meta_id},
        ${row.student_id},
        NULL,
        ${groupId},
        ${seed.next_version},
        ${seed.earliest_id},
        false,
        true,
        ${seed.created_by},
        'subject-group-mn-heal: consolidated per-semester Minor 3 picks into SUBJECT_GROUP'
      )
    `);
  });
}

/**
 * Process every mapping row: unique → heal, ambiguous → log + skip,
 * no-match → log + skip. Failures are per-student (try/catch) so one
 * bad row can't blow up the whole batch.
 */
async function processMapping(
  rows: MappingRow[],
): Promise<SubjectGroupMnHealSummary> {
  const summary: SubjectGroupMnHealSummary = {
    scanned: rows.length,
    healed: 0,
    skippedNoMatch: 0,
    skippedAmbiguous: 0,
    failed: 0,
  };

  for (const row of rows) {
    if (row.status === "no_match") {
      summary.skippedNoMatch++;
      log.warn(
        `student ${row.student_id} meta ${row.meta_id}: no matching group for picks (subject ids ${row.old_selection_ids.join(",")})`,
      );
      continue;
    }
    if (row.status === "ambiguous") {
      summary.skippedAmbiguous++;
      log.warn(
        `student ${row.student_id} meta ${row.meta_id}: ambiguous groups ${row.matching_group_ids?.join(",")}`,
      );
      continue;
    }
    try {
      await applyHeal(row, row.matching_group_ids![0]!);
      summary.healed++;
    } catch (err) {
      summary.failed++;
      log.warn(
        `student ${row.student_id} meta ${row.meta_id}: heal failed — ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  return summary;
}

/**
 * Boot entry — walks every candidate BCom(H)/(G) student in registration
 * AYs 2023-24 or 2024-25 and converts their Minor 3 selections to
 * SUBJECT_GROUP where the match is unique. State-based; a re-run after
 * everything is reconciled is a zero-work scan.
 */
export async function runSubjectGroupMnHeal(): Promise<SubjectGroupMnHealSummary> {
  try {
    const mapping = await scanMapping({ studentIdFilter: null });
    const summary = await processMapping(mapping);
    log.info("subject-group-mn-heal complete", summary);
    return summary;
  } catch (err) {
    log.warn(
      `subject-group-mn-heal aborted: ${err instanceof Error ? err.message : String(err)}`,
    );
    throw err;
  }
}

/**
 * Per-student entry — same rules, scoped to one studentId. Called from
 * the old-DB migration path (`old-student-helper.ts`) so a newly-loaded
 * BCom student in the same cohort gets their Minor 3 picks consolidated
 * in the same operation. Truly scoped: the reg_ay CTE only walks this
 * student's promotions, so cost is O(1) per call — no full-table scan.
 */
export async function ensureSubjectGroupMnForStudent(
  studentId: number,
): Promise<{ healed: boolean; reason?: string }> {
  try {
    const mapping = await scanMapping({
      studentIdFilter: sql`p.student_id_fk = ${studentId}`,
    });
    if (!mapping.length) return { healed: false, reason: "no_candidates" };
    const summary = await processMapping(mapping);
    if (summary.healed > 0) return { healed: true };
    if (summary.skippedAmbiguous > 0)
      return { healed: false, reason: "ambiguous" };
    if (summary.skippedNoMatch > 0)
      return { healed: false, reason: "no_match" };
    if (summary.failed > 0) return { healed: false, reason: "heal_failed" };
    return { healed: false, reason: "already_reconciled" };
  } catch (err) {
    return {
      healed: false,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}
