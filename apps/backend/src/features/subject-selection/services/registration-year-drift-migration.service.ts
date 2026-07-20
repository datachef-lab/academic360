// Registration-year meta drift heal.
//
// Historically the read path served metas from the student's CURRENT semester
// AY, so clients echoed those ids back on save. Result: a student admitted in
// 2023-24 has Minor 1 under the 2023-24 meta but Minor 2 under the 2024-25
// meta, AEC under 2025-26, etc. The backend now enforces registration-year
// at write time (see normalizeSelectionsToRegistrationYearMetas), so no new
// row can land under the wrong AY. This module is the one-shot heal for the
// rows already in the ground.
//
// Idempotency: computes the plan every run and applies only the mismatched
// rows. Second run finds 0 rows and returns immediately — safe to invoke on
// every boot.
//
// Blast-radius controls:
//   - Wraps every write in one transaction; the transaction rolls back if
//     the migration would INCREASE the count of (student, meta) active-row
//     duplicates (baseline vs post-migration). Pre-existing duplicates are
//     out of scope for this heal.
//   - Different-subject "cross-meta convergences" (two wrong-AY rows in two
//     different wrong metas targeting the same right meta with DIFFERENT
//     subjects) are skipped and returned in `manualReview` — the caller
//     surfaces them for a human decision.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";

const CHANGE_REASON =
  "AY-drift heal: reassigned to registration-year meta (see registration-year-drift-migration.service.ts)";
const DEDUPE_REASON =
  "AY-drift heal: duplicate of an existing right-AY selection; deprecated in favour of that row";

export type DriftPlanRow = {
  sss_id: number;
  student_id: number;
  wrong_meta: number;
  wrong_ay: number;
  target_meta: number;
  reg_ay: number;
  wrong_subject: number;
  existing_right_id: number | null;
  existing_right_subject: number | null;
};

export type DriftMigrationResult = {
  planned: number;
  reassigned: number;
  deprecated: number;
  manualReview: DriftPlanRow[];
  baselineDupPairs: number;
  postDupPairs: number;
};

const PLAN_SQL = `
WITH first_p AS (
  SELECT DISTINCT ON (p.student_id_fk)
    p.student_id_fk, s.academic_id_fk AS reg_ay
  FROM promotions p
  JOIN sessions s ON s.id = p.session_id_fk
  ORDER BY p.student_id_fk, p.id ASC
)
SELECT
  sss.id                                    AS sss_id,
  sss.student_id_fk                         AS student_id,
  m.id                                      AS wrong_meta,
  m.academic_year_id_fk                     AS wrong_ay,
  m2.id                                     AS target_meta,
  r.reg_ay                                  AS reg_ay,
  sss.subject_id_fk                         AS wrong_subject,
  existing.id                               AS existing_right_id,
  existing.subject_id_fk                    AS existing_right_subject
FROM student_subject_selections sss
JOIN subject_selection_meta m ON m.id = sss.subject_selection_meta_id_fk
JOIN first_p r ON r.student_id_fk = sss.student_id_fk
JOIN subject_selection_meta m2
  ON m2.subject_type_id_fk = m.subject_type_id_fk
 AND m2.academic_year_id_fk = r.reg_ay
 AND lower(trim(m2.label)) = lower(trim(m.label))
LEFT JOIN student_subject_selections existing
  ON existing.student_id_fk = sss.student_id_fk
 AND existing.subject_selection_meta_id_fk = m2.id
 AND existing.is_active
 AND existing.id <> sss.id
WHERE sss.is_active
  AND m.academic_year_id_fk <> r.reg_ay
ORDER BY sss.id
`;

const DUP_COUNT_SQL = `
SELECT count(*) AS c FROM (
  SELECT student_id_fk, subject_selection_meta_id_fk
  FROM student_subject_selections
  WHERE is_active
  GROUP BY 1, 2
  HAVING count(*) > 1
) d
`;

/** Returns the plan; does not mutate. Cheap enough to call on every boot. */
export async function planRegistrationYearDrift(): Promise<DriftPlanRow[]> {
  const result = await db.execute(PLAN_SQL);
  return ((result as any).rows ?? (result as any)) as DriftPlanRow[];
}

export async function runRegistrationYearDriftMigration(
  options: { commit?: boolean } = {},
): Promise<DriftMigrationResult> {
  const commit = options.commit !== false;
  const plan = await planRegistrationYearDrift();

  // Bucket the plan (see the doc comment for the pattern spec).
  const groups = new Map<string, DriftPlanRow[]>();
  for (const r of plan) {
    const key = `${r.student_id}|${r.target_meta}`;
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }
  const straight: DriftPlanRow[] = [];
  const conflicts: DriftPlanRow[] = []; // an EXISTING right-AY active row already holds this slot
  const dedupeInGroup: DriftPlanRow[] = []; // extras in same-subject cross-meta convergences
  const badConflicts: DriftPlanRow[] = []; // different-subject conflict against an existing right-AY row
  const manualReview: DriftPlanRow[] = []; // different-subject cross-meta convergence

  const classifyOne = (r: DriftPlanRow) => {
    if (r.existing_right_id === null) straight.push(r);
    else if (r.existing_right_subject === r.wrong_subject) conflicts.push(r);
    else badConflicts.push(r);
  };

  for (const [, rows] of groups) {
    const wrongMetas = new Set(rows.map((r) => r.wrong_meta));
    if (wrongMetas.size === 1) {
      for (const r of rows) classifyOne(r);
      continue;
    }
    const subjects = new Set(rows.map((r) => r.wrong_subject));
    if (subjects.size > 1) {
      for (const r of rows) manualReview.push(r);
      continue;
    }
    rows.sort((a, b) => a.sss_id - b.sss_id);
    const [keeper, ...extras] = rows;
    classifyOne(keeper);
    for (const e of extras) dedupeInGroup.push(e);
  }

  if (badConflicts.length > 0) {
    // Refuse to run when a heal step would silently lose a real selection.
    throw new Error(
      `[drift-heal] ABORT: ${badConflicts.length} rows would overwrite a different-subject active row. Sample: ${JSON.stringify(badConflicts.slice(0, 3))}`,
    );
  }

  const toDeprecate = [...conflicts, ...dedupeInGroup];

  let baselineDupPairs = 0;
  let postDupPairs = 0;

  if (commit && (straight.length > 0 || toDeprecate.length > 0)) {
    await db.transaction(async (tx) => {
      const baselineRes = await tx.execute(DUP_COUNT_SQL);
      baselineDupPairs = Number(
        ((baselineRes as any).rows ?? (baselineRes as any))[0]?.c ?? 0,
      );

      const CHUNK = 500;
      for (let i = 0; i < straight.length; i += CHUNK) {
        const slice = straight.slice(i, i + CHUNK);
        const values = slice
          .map((r) => `(${r.sss_id}, ${r.target_meta})`)
          .join(",");
        await tx.execute(
          `UPDATE student_subject_selections sss
           SET subject_selection_meta_id_fk = v.new_meta,
               change_reason = COALESCE(NULLIF(sss.change_reason, ''), '') ||
                 CASE WHEN COALESCE(NULLIF(sss.change_reason, ''), '') = '' THEN '' ELSE ' | ' END ||
                 '${CHANGE_REASON.replace(/'/g, "''")}',
               updated_at = now()
           FROM (VALUES ${values}) AS v(id, new_meta)
           WHERE sss.id = v.id`,
        );
      }

      if (toDeprecate.length > 0) {
        const ids = toDeprecate.map((r) => r.sss_id).join(",");
        await tx.execute(
          `UPDATE student_subject_selections
           SET is_active = false,
               is_deprecated = true,
               change_reason = COALESCE(NULLIF(change_reason, ''), '') ||
                 CASE WHEN COALESCE(NULLIF(change_reason, ''), '') = '' THEN '' ELSE ' | ' END ||
                 '${DEDUPE_REASON.replace(/'/g, "''")}',
               updated_at = now()
           WHERE id IN (${ids})`,
        );
      }

      const afterRes = await tx.execute(DUP_COUNT_SQL);
      postDupPairs = Number(
        ((afterRes as any).rows ?? (afterRes as any))[0]?.c ?? 0,
      );
      if (postDupPairs > baselineDupPairs) {
        throw new Error(
          `[drift-heal] post-check FAILED: dup pairs grew from ${baselineDupPairs} to ${postDupPairs}. Rolled back.`,
        );
      }
    });
  }

  return {
    planned: plan.length,
    reassigned: commit ? straight.length : 0,
    deprecated: commit ? toDeprecate.length : 0,
    manualReview,
    baselineDupPairs,
    postDupPairs,
  };
}
