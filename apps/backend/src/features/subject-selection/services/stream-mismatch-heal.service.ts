// Stream-mismatch heal for student_subject_selections.
//
// Root cause: the legacy loader's resolveMeta (subject-selection-migration
// .service.ts) matched metas by (academic year, subject type, class) but NOT
// by stream. Metas are stream-scoped: e.g. AY 2024-25 has "Minor 2
// (Semester III & IV)" for Arts/Science/Management AND "Minor 3 (Semester III
// to VI)" for Commerce — same subject type, overlapping classes. Every
// Commerce student's Minor picks were filed under the Arts/Sci/Mgmt meta
// (first candidate by array order), making them invisible in the admin form
// and reports which correctly filter metas by the student's stream.
//
// The loader is now fixed (resolveMeta takes the student's stream). This heal
// repairs the rows already written: for each ACTIVE selection whose meta has
// stream rows that do NOT include the student's stream, rewire the row to the
// unique meta in the same (academic year, subject type) whose stream-set
// includes the student's stream and whose class-set overlaps the wrong meta's
// class-set. Ambiguous (0 or >1 candidates) rows are left alone and reported.
//
// State-based idempotency, no marker: a rewired row no longer matches the
// mismatch condition, so a second run finds 0 rows. Rows an admin already
// moved manually don't match either. This mirrors the other subject-selection
// heals (see boot-migrations.ts header note).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";

const UPDATE_CHUNK = 500;
// NOTE: inlined into a SQL string literal — keep free of single quotes.
const CHANGE_NOTE = "stream-mismatch heal: moved to stream-matching meta";

export type StreamMismatchHealResult = {
  misfiledRows: number;
  rewired: number;
  skippedAmbiguous: number;
  skippedDuplicate: number;
  // Phase 2: exact-duplicate ACTIVE (student, meta, subject) triples —
  // older copies deactivated, newest kept.
  duplicateGroupsFound: number;
  duplicateRowsDeactivated: number;
  perMetaMoves: Record<string, number>; // "wrongMeta->targetMeta" -> count
  sampleRewired: Array<{
    selectionId: number;
    uid: string;
    fromMeta: number;
    toMeta: number;
    subject: string;
  }>;
  sampleSkipped: Array<{
    selectionId: number;
    uid: string;
    meta: number;
    reason: string;
  }>;
};

export async function runStreamMismatchHeal(
  options: {
    commit?: boolean;
    sampleLimit?: number;
    onProgress?: (msg: string) => void;
  } = {},
): Promise<StreamMismatchHealResult> {
  const commit = options.commit !== false;
  const sampleLimit = options.sampleLimit ?? 20;
  const progress = options.onProgress ?? (() => {});

  const result: StreamMismatchHealResult = {
    misfiledRows: 0,
    rewired: 0,
    skippedAmbiguous: 0,
    skippedDuplicate: 0,
    duplicateGroupsFound: 0,
    duplicateRowsDeactivated: 0,
    perMetaMoves: {},
    sampleRewired: [],
    sampleSkipped: [],
  };

  // --- Load the meta graph (metas + streams + classes) once.
  const metaRes: any = await db.execute(
    `SELECT m.id,
            m.academic_year_id_fk AS ay_id,
            m.subject_type_id_fk  AS subject_type_id,
            (SELECT array_agg(ssms.stream_id)
               FROM subject_selection_meta_streams ssms
              WHERE ssms.subject_selection_meta_id = m.id) AS stream_ids,
            (SELECT array_agg(ssmc.class_id_fk)
               FROM subject_selection_meta_classes ssmc
              WHERE ssmc.subject_selection_meta_id_fk = m.id) AS class_ids
     FROM subject_selection_meta m
     WHERE COALESCE(m.is_active, true) = true`,
  );
  const metas = ((metaRes as any).rows ?? metaRes) as Array<{
    id: number;
    ay_id: number;
    subject_type_id: number;
    stream_ids: number[] | null;
    class_ids: number[] | null;
  }>;
  const metaById = new Map(metas.map((m) => [m.id, m]));
  progress(`${metas.length} active metas loaded`);

  // --- Misfiled rows: active selections under a stream-scoped meta whose
  // stream-set excludes the student's stream (latest promotion → program
  // course → stream). DISTINCT ON keeps one promotion per student so the
  // join can't fan out.
  const rowsRes: any = await db.execute(
    `WITH student_stream AS (
       SELECT DISTINCT ON (pr.student_id_fk)
              pr.student_id_fk AS student_id,
              pc.stream_id_fk  AS stream_id
       FROM promotions pr
       JOIN program_courses pc ON pc.id = pr.program_course_id_fk
       WHERE COALESCE(pr.is_deprecated, false) = false
       ORDER BY pr.student_id_fk, pr.id DESC
     )
     SELECT sss.id            AS selection_id,
            sss.student_id_fk AS student_id,
            st.uid            AS uid,
            sss.subject_id_fk AS subject_id,
            subj.name         AS subject_name,
            sss.subject_selection_meta_id_fk AS wrong_meta,
            ss.stream_id      AS student_stream
     FROM student_subject_selections sss
     JOIN students st ON st.id = sss.student_id_fk
     JOIN subjects subj ON subj.id = sss.subject_id_fk
     JOIN student_stream ss ON ss.student_id = sss.student_id_fk
     WHERE sss.is_active = TRUE
       AND ss.stream_id IS NOT NULL
       AND EXISTS (SELECT 1 FROM subject_selection_meta_streams x
                    WHERE x.subject_selection_meta_id = sss.subject_selection_meta_id_fk)
       AND NOT EXISTS (SELECT 1 FROM subject_selection_meta_streams ssms
                        WHERE ssms.subject_selection_meta_id = sss.subject_selection_meta_id_fk
                          AND ssms.stream_id = ss.stream_id)`,
  );
  const misfiled = ((rowsRes as any).rows ?? rowsRes) as Array<{
    selection_id: number;
    student_id: number;
    uid: string;
    subject_id: number;
    subject_name: string;
    wrong_meta: number;
    student_stream: number;
  }>;
  result.misfiledRows = misfiled.length;
  progress(`${misfiled.length} misfiled selections found`);
  if (misfiled.length === 0) {
    await dedupeActiveTriples(result, commit, progress);
    return result;
  }

  // --- Existing ACTIVE (student, meta, subject) triples, to avoid rewiring a
  // row onto a triple that already exists (would double up the pick).
  const tripleRes: any = await db.execute(
    `SELECT student_id_fk AS student_id,
            subject_selection_meta_id_fk AS meta_id,
            subject_id_fk AS subject_id
     FROM student_subject_selections
     WHERE is_active = TRUE`,
  );
  const activeTriples = new Set(
    (((tripleRes as any).rows ?? tripleRes) as Array<any>).map(
      (r) => `${r.student_id}|${r.meta_id}|${r.subject_id}`,
    ),
  );

  // --- Plan the rewires.
  const plans: Array<{
    selectionId: number;
    uid: string;
    fromMeta: number;
    toMeta: number;
    subject: string;
  }> = [];
  for (const r of misfiled) {
    const wrong = metaById.get(r.wrong_meta);
    if (!wrong) continue;
    const wrongClasses = new Set(wrong.class_ids ?? []);
    const candidates = metas.filter((m) => {
      if (m.id === r.wrong_meta) return false;
      if (m.ay_id !== wrong.ay_id) return false;
      if (m.subject_type_id !== wrong.subject_type_id) return false;
      const streams = m.stream_ids ?? [];
      // wildcard (no stream rows) or explicit match
      if (streams.length > 0 && !streams.includes(r.student_stream))
        return false;
      // class-set must overlap the wrong meta's classes so we don't move a
      // Sem III/IV pick into e.g. a Sem V-only meta of the same type.
      const classes = m.class_ids ?? [];
      return classes.some((c) => wrongClasses.has(c));
    });
    if (candidates.length !== 1) {
      result.skippedAmbiguous += 1;
      if (result.sampleSkipped.length < sampleLimit) {
        result.sampleSkipped.push({
          selectionId: r.selection_id,
          uid: r.uid,
          meta: r.wrong_meta,
          reason: `${candidates.length} candidate metas (need exactly 1)`,
        });
      }
      continue;
    }
    const target = candidates[0];
    const targetTriple = `${r.student_id}|${target.id}|${r.subject_id}`;
    if (activeTriples.has(targetTriple)) {
      result.skippedDuplicate += 1;
      if (result.sampleSkipped.length < sampleLimit) {
        result.sampleSkipped.push({
          selectionId: r.selection_id,
          uid: r.uid,
          meta: r.wrong_meta,
          reason: `active row already exists on target meta ${target.id}`,
        });
      }
      continue;
    }
    // Claim the triple so a second misfiled row for the same (student,
    // subject) in this batch (e.g. duplicate legacy rows across sessions)
    // dedupes here instead of creating a duplicate on the target meta.
    activeTriples.add(targetTriple);
    plans.push({
      selectionId: r.selection_id,
      uid: r.uid,
      fromMeta: r.wrong_meta,
      toMeta: target.id,
      subject: r.subject_name,
    });
  }
  progress(
    `plans=${plans.length} ambiguous=${result.skippedAmbiguous} duplicate=${result.skippedDuplicate}`,
  );

  // --- Apply in chunks.
  if (commit) {
    for (let i = 0; i < plans.length; i += UPDATE_CHUNK) {
      const slice = plans.slice(i, i + UPDATE_CHUNK);
      const values = slice
        .map((p) => `(${p.selectionId}, ${p.toMeta})`)
        .join(",");
      await db.execute(
        `UPDATE student_subject_selections sss
         SET subject_selection_meta_id_fk = v.to_meta,
             change_reason = COALESCE(change_reason, '') || ' | ${CHANGE_NOTE}',
             updated_at = now()
         FROM (VALUES ${values}) AS v(id, to_meta)
         WHERE sss.id = v.id`,
      );
      progress(
        `rewired ${Math.min(i + UPDATE_CHUNK, plans.length)}/${plans.length}`,
      );
    }
  }
  result.rewired = commit ? plans.length : 0;

  for (const p of plans) {
    const key = `${p.fromMeta}->${p.toMeta}`;
    result.perMetaMoves[key] = (result.perMetaMoves[key] ?? 0) + 1;
    if (result.sampleRewired.length < sampleLimit) {
      result.sampleRewired.push(p);
    }
  }

  await dedupeActiveTriples(result, commit, progress);
  return result;
}

/**
 * Phase 2 — exact-duplicate cleanup. Multiple ACTIVE rows for the same
 * (student, meta, subject) triple are pure redundancy (early pre-boot-migration
 * loads inserted the same pick more than once; the versioning model expects one
 * active row per triple, and reports/read paths double-count them). Keep the
 * newest row (highest id), deactivate + deprecate the rest, preserving them for
 * audit. State-based and idempotent: once deduped, the HAVING >1 finds nothing.
 */
async function dedupeActiveTriples(
  result: StreamMismatchHealResult,
  commit: boolean,
  progress: (msg: string) => void,
): Promise<void> {
  const dupRes: any = await db.execute(
    `SELECT array_agg(id ORDER BY id DESC) AS ids
     FROM student_subject_selections
     WHERE is_active = TRUE
     GROUP BY student_id_fk, subject_selection_meta_id_fk, subject_id_fk
     HAVING COUNT(*) > 1`,
  );
  const groups = ((dupRes as any).rows ?? dupRes) as Array<{ ids: number[] }>;
  result.duplicateGroupsFound = groups.length;
  const loserIds = groups.flatMap((g) => g.ids.slice(1)); // keep newest (first)
  progress(
    `dedupe: ${groups.length} duplicate triple groups, ${loserIds.length} older copies to deactivate`,
  );
  if (loserIds.length === 0) return;

  if (commit) {
    for (let i = 0; i < loserIds.length; i += UPDATE_CHUNK) {
      const slice = loserIds.slice(i, i + UPDATE_CHUNK);
      await db.execute(
        `UPDATE student_subject_selections
         SET is_active = FALSE,
             is_deprecated = TRUE,
             change_reason = COALESCE(change_reason, '') || ' | dedupe heal: duplicate of newest active row for same (student, meta, subject)',
             updated_at = now()
         WHERE id IN (${slice.join(",")})`,
      );
    }
    result.duplicateRowsDeactivated = loserIds.length;
  }
}
