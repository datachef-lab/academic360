import { db } from "@/db/index.js";
import {
  and,
  count,
  eq,
  inArray,
  isNull,
  or,
  sql,
  type SQL,
  type Column,
} from "drizzle-orm";
import {
  academicYearModel,
  sessionModel,
} from "@repo/db/schemas/models/academics";
import {
  subjectSelectionMetaModel,
  subjectSelectionMetaClassModel,
  subjectSelectionMetaStreamModel,
  relatedSubjectMainModel,
  relatedSubjectSubModel,
  restrictedGroupingMainModel,
  restrictedGroupingClassModel,
  restrictedGroupingProgramCourseModel,
  restrictedGroupingSubjectModel,
} from "@repo/db/schemas/models/subject-selection";
import {
  paperModel,
  paperComponentModel,
  subjectGroupingMainModel,
  subjectGroupingSubjectModel,
  subjectGroupingProgramCourseModel,
} from "@repo/db/schemas/models/course-design";

// Executor type accepted by every helper: the real db OR a transaction. Callers
// pass their tx (wizard) or wrap a one-off tx (import / manual create).
export type Dbx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Active = isActive true OR null (default). Mirrors academic-year-copy.service. */
function activeOnly(col: Column): SQL {
  return or(isNull(col), eq(col, true))!;
}

const startYearOf = (year: string | null | undefined): number | null => {
  const m = String(year ?? "").match(/\d{4}/);
  return m ? Number(m[0]) : null;
};

export type EnsureYearStructureResult = {
  sessionCreated: boolean;
  metas: number;
  relatedSubjects: number;
  restrictedGroupings: number;
  subjectGroupings: number;
  papers: number;
  paperComponents: number;
};

export type EnsureYearStructureOpts = {
  /** Prefer this source year for the copy; else the nearest year with papers. */
  sourceYearId?: number | null;
  /** Legacy session details (from the uid import) to reuse for the session row. */
  legacySession?: {
    legacySessionId?: number | null;
    name?: string | null;
    from?: string | null;
    to?: string | null;
    isCurrentSession?: boolean | null;
  } | null;
};

/**
 * Guarantee a year's full structure: a session + the 4 year-scoped masters +
 * papers + paper_components. Idempotent TOP-UP — the session is find-or-create
 * and every copy is a per-row find-or-create by natural key, so a partially
 * seeded year (a few stray papers, missing metas) converges to the source
 * catalog instead of being skipped. The old fast-path ("any papers => already
 * structured") left 2023-24/2024-25 at 14/26 papers with ZERO metas on staging,
 * which silently starved the legacy subject-selection loader (every row
 * `skippedMeta`). The whole copy runs inside the caller's transaction, so it is
 * all-or-nothing; a fully converged year exits via the cheap delta fast-path.
 *
 * Only the target year is ever touched — callers pass the AY being imported
 * into (uid import), the freshly created AY (wizard/manual create), or an
 * explicitly requested AY (scripts/ensure-ay-structure.ts). No call site sweeps
 * other years, so e.g. an intentionally pruned current-year catalog stays
 * as-is unless explicitly ensured.
 */
export async function ensureAcademicYearStructure(
  tx: Dbx,
  targetYearId: number,
  opts: EnsureYearStructureOpts = {},
): Promise<EnsureYearStructureResult> {
  const result: EnsureYearStructureResult = {
    sessionCreated: false,
    metas: 0,
    relatedSubjects: 0,
    restrictedGroupings: 0,
    subjectGroupings: 0,
    papers: 0,
    paperComponents: 0,
  };

  // Serialize per academic year: concurrent import workers all call this per
  // student, and two cold-path copies of the same (or adjacent) year collide
  // on the unique indexes and roll the whole tx back. Key convention mirrors
  // the CU-registration locks (1001000 + ayId). The delta fast-path below
  // re-checks AFTER the lock, so a waiter queued behind a cold-path copier
  // exits cheaply once the copy is committed.
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(${1002000 + targetYearId})`,
  );

  const [target] = await tx
    .select()
    .from(academicYearModel)
    .where(eq(academicYearModel.id, targetYearId));
  if (!target) return result;

  // 1) Session — find-or-create (idempotent).
  result.sessionCreated = await ensureSession(tx, target, opts.legacySession);

  // 2) Source year = explicit opt, else the year with the MOST papers (the
  // head catalog). "Nearest year with papers" is wrong for top-up: a sparse
  // neighbour (2024-25 with 26 stray papers) must never be the template when
  // a full catalog exists two years away.
  const allYears = await tx
    .select({
      id: academicYearModel.id,
      year: academicYearModel.year,
    })
    .from(academicYearModel);
  const paperCounts = await tx
    .select({ ayId: paperModel.academicYearId, papers: count() })
    .from(paperModel)
    .groupBy(paperModel.academicYearId);
  const papersByYear = new Map<number, number>();
  for (const r of paperCounts) {
    if (r.ayId != null) papersByYear.set(r.ayId, Number(r.papers));
  }

  let sourceId = opts.sourceYearId ?? null;
  if (sourceId == null || !(papersByYear.get(sourceId) ?? 0)) {
    const targetStart = startYearOf(target.year);
    let best: { id: number; papers: number; dist: number } | null = null;
    for (const y of allYears) {
      const papers = papersByYear.get(y.id) ?? 0;
      if (y.id === targetYearId || papers === 0) continue;
      const s = startYearOf(y.year);
      const dist =
        s != null && targetStart != null
          ? Math.abs(s - targetStart)
          : Number.MAX_SAFE_INTEGER;
      if (
        best == null ||
        papers > best.papers ||
        (papers === best.papers && dist < best.dist)
      ) {
        best = { id: y.id, papers, dist };
      }
    }
    sourceId = best?.id ?? null;
  }
  if (sourceId == null) return result; // nothing to seed from

  // Delta fast-path: when the target already carries at least the source's
  // paper AND meta counts, treat it as converged. (Counts, not keys — cheap
  // enough to run per imported student; the copy fns below do exact key-level
  // deltas whenever this doesn't hold.)
  const targetPapers = papersByYear.get(targetYearId) ?? 0;
  const sourcePapers = papersByYear.get(sourceId) ?? 0;
  const metaCounts = await tx
    .select({ ayId: subjectSelectionMetaModel.academicYearId, metas: count() })
    .from(subjectSelectionMetaModel)
    .groupBy(subjectSelectionMetaModel.academicYearId);
  const metasByYear = new Map<number, number>();
  for (const r of metaCounts) {
    if (r.ayId != null) metasByYear.set(r.ayId, Number(r.metas));
  }
  const targetMetas = metasByYear.get(targetYearId) ?? 0;
  const sourceMetas = metasByYear.get(sourceId) ?? 0;
  if (targetPapers >= sourcePapers && targetMetas >= sourceMetas) {
    return result;
  }

  // 3) Top-up the masters + papers + components from the source year.
  await copyMetas(tx, sourceId, targetYearId, result);
  await copyRelatedSubjects(tx, sourceId, targetYearId, result);
  await copyRestrictedGroupings(tx, sourceId, targetYearId, result);
  await copySubjectGroupings(tx, sourceId, target, allYears, result);
  await copyPapersAndComponents(tx, sourceId, target, allYears, result);

  return result;
}

async function ensureSession(
  tx: Dbx,
  target: typeof academicYearModel.$inferSelect,
  legacy: EnsureYearStructureOpts["legacySession"],
): Promise<boolean> {
  const matchConds: SQL[] = [eq(sessionModel.academicYearId, target.id)];
  if (legacy?.legacySessionId != null) {
    matchConds.push(eq(sessionModel.legacySessionId, legacy.legacySessionId));
  }
  if (legacy?.name) matchConds.push(eq(sessionModel.name, legacy.name));
  const [existing] = await tx
    .select({ id: sessionModel.id })
    .from(sessionModel)
    .where(or(...matchConds));
  if (existing) return false;

  const start = startYearOf(target.year);
  const name =
    legacy?.name ?? (start != null ? `${start}-${start + 1}` : target.year);
  const from = legacy?.from ?? (start != null ? `${start}-07-01` : null);
  const to = legacy?.to ?? (start != null ? `${start + 1}-06-30` : null);
  if (!from || !to) return false; // can't build a valid session without dates

  await tx.insert(sessionModel).values({
    legacySessionId: legacy?.legacySessionId ?? null,
    academicYearId: target.id,
    name,
    from,
    to,
    isCurrentSession: legacy?.isCurrentSession ?? Boolean(target.isCurrentYear),
    codePrefix:
      target.codePrefix ?? (start != null ? String(start % 100) : null),
  });
  return true;
}

// Cross-year identity of a selection meta (within a year: subject type + label).
const metaKey = (m: { subjectTypeId: number | null; label: string | null }) =>
  `${m.subjectTypeId}|${m.label}`;

async function copyMetas(
  tx: Dbx,
  sourceId: number,
  targetYearId: number,
  result: EnsureYearStructureResult,
) {
  const srcMetas = await tx
    .select()
    .from(subjectSelectionMetaModel)
    .where(
      and(
        eq(subjectSelectionMetaModel.academicYearId, sourceId),
        activeOnly(subjectSelectionMetaModel.isActive),
      ),
    );
  // Find-or-create by natural key: a partially seeded year keeps its existing
  // metas (blind re-insert would duplicate them) but still gains the missing
  // ones — and existing metas are topped up with any missing class/stream links.
  const existingTarget = await tx
    .select()
    .from(subjectSelectionMetaModel)
    .where(eq(subjectSelectionMetaModel.academicYearId, targetYearId));
  const existingByKey = new Map(existingTarget.map((m) => [metaKey(m), m.id]));

  for (const meta of srcMetas) {
    const srcClasses = await tx
      .select()
      .from(subjectSelectionMetaClassModel)
      .where(
        eq(subjectSelectionMetaClassModel.subjectSelectionMetaId, meta.id),
      );
    const srcStreams = await tx
      .select()
      .from(subjectSelectionMetaStreamModel)
      .where(
        eq(subjectSelectionMetaStreamModel.subjectSelectionMetaId, meta.id),
      );

    const existingId = existingByKey.get(metaKey(meta));
    if (existingId != null) {
      // Meta already present — only add class/stream links it is missing.
      const haveClasses = new Set(
        (
          await tx
            .select()
            .from(subjectSelectionMetaClassModel)
            .where(
              eq(
                subjectSelectionMetaClassModel.subjectSelectionMetaId,
                existingId,
              ),
            )
        ).map((c) => c.classId),
      );
      const missingClasses = srcClasses.filter(
        (c) => !haveClasses.has(c.classId),
      );
      if (missingClasses.length) {
        await tx.insert(subjectSelectionMetaClassModel).values(
          missingClasses.map((c) => ({
            subjectSelectionMetaId: existingId,
            classId: c.classId,
          })),
        );
      }
      const haveStreams = new Set(
        (
          await tx
            .select()
            .from(subjectSelectionMetaStreamModel)
            .where(
              eq(
                subjectSelectionMetaStreamModel.subjectSelectionMetaId,
                existingId,
              ),
            )
        ).map((s) => s.streamId),
      );
      const missingStreams = srcStreams.filter(
        (s) => !haveStreams.has(s.streamId),
      );
      if (missingStreams.length) {
        await tx.insert(subjectSelectionMetaStreamModel).values(
          missingStreams.map((s) => ({
            subjectSelectionMetaId: existingId,
            streamId: s.streamId,
          })),
        );
      }
      continue;
    }

    const [newMeta] = await tx
      .insert(subjectSelectionMetaModel)
      .values({
        academicYearId: targetYearId,
        subjectTypeId: meta.subjectTypeId,
        label: meta.label,
        sequence: meta.sequence,
        isActive: meta.isActive,
      })
      .returning({ id: subjectSelectionMetaModel.id });
    if (srcClasses.length) {
      await tx.insert(subjectSelectionMetaClassModel).values(
        srcClasses.map((c) => ({
          subjectSelectionMetaId: newMeta.id,
          classId: c.classId,
        })),
      );
    }
    if (srcStreams.length) {
      await tx.insert(subjectSelectionMetaStreamModel).values(
        srcStreams.map((s) => ({
          subjectSelectionMetaId: newMeta.id,
          streamId: s.streamId,
        })),
      );
    }
    result.metas += 1;
  }
}

async function copyRelatedSubjects(
  tx: Dbx,
  sourceId: number,
  targetYearId: number,
  result: EnsureYearStructureResult,
) {
  const srcRel = await tx
    .select()
    .from(relatedSubjectMainModel)
    .where(
      and(
        eq(relatedSubjectMainModel.academicYearId, sourceId),
        activeOnly(relatedSubjectMainModel.isActive),
      ),
    );
  // Find-or-create by natural key so a partial year is topped up, not duplicated.
  const relKey = (m: {
    programCourseId: number | null;
    subjectTypeId: number | null;
    boardSubjectNameId: number | null;
  }) => `${m.programCourseId}|${m.subjectTypeId}|${m.boardSubjectNameId}`;
  const existingRel = await tx
    .select()
    .from(relatedSubjectMainModel)
    .where(eq(relatedSubjectMainModel.academicYearId, targetYearId));
  const existingRelKeys = new Set(existingRel.map((m) => relKey(m)));
  for (const main of srcRel) {
    if (existingRelKeys.has(relKey(main))) continue;
    const [newMain] = await tx
      .insert(relatedSubjectMainModel)
      .values({
        academicYearId: targetYearId,
        programCourseId: main.programCourseId,
        subjectTypeId: main.subjectTypeId,
        boardSubjectNameId: main.boardSubjectNameId,
        isActive: main.isActive,
      })
      .returning({ id: relatedSubjectMainModel.id });
    const subs = await tx
      .select()
      .from(relatedSubjectSubModel)
      .where(eq(relatedSubjectSubModel.relatedSubjectMainId, main.id));
    if (subs.length) {
      await tx.insert(relatedSubjectSubModel).values(
        subs.map((s) => ({
          relatedSubjectMainId: newMain.id,
          boardSubjectNameId: s.boardSubjectNameId,
        })),
      );
    }
    result.relatedSubjects += 1;
  }
}

async function copyRestrictedGroupings(
  tx: Dbx,
  sourceId: number,
  targetYearId: number,
  result: EnsureYearStructureResult,
) {
  const srcRg = await tx
    .select()
    .from(restrictedGroupingMainModel)
    .where(
      and(
        eq(restrictedGroupingMainModel.academicYearId, sourceId),
        activeOnly(restrictedGroupingMainModel.isActive),
      ),
    );
  // Find-or-create by natural key so a partial year is topped up, not duplicated.
  const rgKey = (m: {
    subjectTypeId: number | null;
    subjectId: number | null;
  }) => `${m.subjectTypeId}|${m.subjectId}`;
  const existingRg = await tx
    .select()
    .from(restrictedGroupingMainModel)
    .where(eq(restrictedGroupingMainModel.academicYearId, targetYearId));
  const existingRgKeys = new Set(existingRg.map((m) => rgKey(m)));
  for (const main of srcRg) {
    if (existingRgKeys.has(rgKey(main))) continue;
    const [newMain] = await tx
      .insert(restrictedGroupingMainModel)
      .values({
        academicYearId: targetYearId,
        subjectTypeId: main.subjectTypeId,
        subjectId: main.subjectId,
        isActive: main.isActive,
      })
      .returning({ id: restrictedGroupingMainModel.id });
    const classes = await tx
      .select()
      .from(restrictedGroupingClassModel)
      .where(
        and(
          eq(restrictedGroupingClassModel.restrictedGroupingMainId, main.id),
          activeOnly(restrictedGroupingClassModel.isActive),
        ),
      );
    if (classes.length) {
      await tx.insert(restrictedGroupingClassModel).values(
        classes.map((c) => ({
          restrictedGroupingMainId: newMain.id,
          classId: c.classId,
          isActive: c.isActive,
        })),
      );
    }
    const pcs = await tx
      .select()
      .from(restrictedGroupingProgramCourseModel)
      .where(
        eq(
          restrictedGroupingProgramCourseModel.restrictedGroupingMainId,
          main.id,
        ),
      );
    if (pcs.length) {
      await tx.insert(restrictedGroupingProgramCourseModel).values(
        pcs.map((p) => ({
          restrictedGroupingMainId: newMain.id,
          programCourseId: p.programCourseId,
        })),
      );
    }
    const subjs = await tx
      .select()
      .from(restrictedGroupingSubjectModel)
      .where(
        eq(restrictedGroupingSubjectModel.restrictedGroupingMainId, main.id),
      );
    if (subjs.length) {
      await tx.insert(restrictedGroupingSubjectModel).values(
        subjs.map((s) => ({
          restrictedGroupingMainId: newMain.id,
          cannotCombineWithSubjectId: s.cannotCombineWithSubjectId,
        })),
      );
    }
    result.restrictedGroupings += 1;
  }
}

// Cross-year identity of a subject grouping (its unique key within a year is
// (academicYearId, subjectTypeId, name); across years the stable identity drops
// the year). Used to stitch the previous_subject_grouping_id chain.
const groupingKey = (g: {
  subjectTypeId: number | null;
  name: string | null;
}) => `${g.subjectTypeId}|${g.name}`;

/**
 * Copy the course-design subject groupings (main + its subject and
 * program-course children) from the source year to the target year, remapping
 * academic_year_id, then stitch previous_subject_grouping_id to the adjacent
 * years by natural key — mirroring papers.previous_paper_id.
 */
async function copySubjectGroupings(
  tx: Dbx,
  sourceId: number,
  target: typeof academicYearModel.$inferSelect,
  allYears: { id: number; year: string }[],
  result: EnsureYearStructureResult,
) {
  const srcMains = await tx
    .select()
    .from(subjectGroupingMainModel)
    .where(
      and(
        eq(subjectGroupingMainModel.academicYearId, sourceId),
        activeOnly(subjectGroupingMainModel.isActive),
      ),
    );

  // Groupings already present in the target year. The table has a unique
  // (academic_year_id, subject_type_id, name) index, so re-inserting a grouping
  // that already exists (e.g. this ran before, or the year was seeded from a DB
  // copy) throws and rolls back the WHOLE ensureAcademicYearStructure tx — which
  // then repeats on every import. Skip those; reuse their id for chaining below.
  const existingTarget = await tx
    .select()
    .from(subjectGroupingMainModel)
    .where(eq(subjectGroupingMainModel.academicYearId, target.id));
  const existingByKey = new Map(
    existingTarget.map((m) => [groupingKey(m), m.id]),
  );

  // Insert clones (previous link set below by natural key) + clone children.
  const inserted: { id: number; key: string }[] = [];
  for (const main of srcMains) {
    const key = groupingKey(main);
    const existingId = existingByKey.get(key);
    if (existingId != null) {
      // Already in the target year — leave as-is, just record for chaining.
      inserted.push({ id: existingId, key });
      continue;
    }

    const [newMain] = await tx
      .insert(subjectGroupingMainModel)
      .values({
        academicYearId: target.id,
        legacySubjectGroupId: main.legacySubjectGroupId,
        subjectTypeId: main.subjectTypeId,
        name: main.name,
        code: main.code,
        description: main.description,
        isActive: main.isActive,
        previousSubjectGroupingId: null, // chained below by natural key
      })
      .returning({ id: subjectGroupingMainModel.id });

    const subs = await tx
      .select()
      .from(subjectGroupingSubjectModel)
      .where(eq(subjectGroupingSubjectModel.subjectGroupingMainId, main.id));
    if (subs.length) {
      await tx.insert(subjectGroupingSubjectModel).values(
        subs.map((s) => ({
          subjectGroupingMainId: newMain.id,
          subjectId: s.subjectId,
        })),
      );
    }

    const pcs = await tx
      .select()
      .from(subjectGroupingProgramCourseModel)
      .where(
        eq(subjectGroupingProgramCourseModel.subjectGroupingMainId, main.id),
      );
    if (pcs.length) {
      await tx.insert(subjectGroupingProgramCourseModel).values(
        pcs.map((p) => ({
          subjectGroupingMainId: newMain.id,
          programCourseId: p.programCourseId,
        })),
      );
    }

    inserted.push({ id: newMain.id, key: groupingKey(main) });
    result.subjectGroupings += 1;
  }

  // previous_subject_grouping_id chaining to the adjacent years (natural key).
  const targetStart = startYearOf(target.year);
  if (targetStart == null) return;
  const prevYear = allYears.find(
    (y) => startYearOf(y.year) === targetStart - 1,
  );
  const nextYear = allYears.find(
    (y) => startYearOf(y.year) === targetStart + 1,
  );

  if (prevYear) {
    const prevMains = await tx
      .select()
      .from(subjectGroupingMainModel)
      .where(eq(subjectGroupingMainModel.academicYearId, prevYear.id));
    const prevByKey = new Map(prevMains.map((m) => [groupingKey(m), m.id]));
    for (const ins of inserted) {
      const prevId = prevByKey.get(ins.key);
      if (prevId != null) {
        await tx
          .update(subjectGroupingMainModel)
          .set({ previousSubjectGroupingId: prevId })
          .where(eq(subjectGroupingMainModel.id, ins.id));
      }
    }
  }

  if (nextYear) {
    const newByKey = new Map(inserted.map((i) => [i.key, i.id]));
    const nextMains = await tx
      .select()
      .from(subjectGroupingMainModel)
      .where(eq(subjectGroupingMainModel.academicYearId, nextYear.id));
    for (const nx of nextMains) {
      const newId = newByKey.get(groupingKey(nx));
      if (newId != null && nx.previousSubjectGroupingId !== newId) {
        await tx
          .update(subjectGroupingMainModel)
          .set({ previousSubjectGroupingId: newId })
          .where(eq(subjectGroupingMainModel.id, nx.id));
      }
    }
  }
}

const paperKey = (p: {
  programCourseId: number | null;
  classId: number | null;
  subjectTypeId: number | null;
  subjectId: number | null;
  code: string | null;
}) =>
  `${p.programCourseId}|${p.classId}|${p.subjectTypeId}|${p.subjectId}|${p.code}`;

async function copyPapersAndComponents(
  tx: Dbx,
  sourceId: number,
  target: typeof academicYearModel.$inferSelect,
  allYears: { id: number; year: string }[],
  result: EnsureYearStructureResult,
) {
  const srcPapers = await tx
    .select()
    .from(paperModel)
    .where(
      and(
        eq(paperModel.academicYearId, sourceId),
        activeOnly(paperModel.isActive),
      ),
    );
  if (!srcPapers.length) return;

  // Find-or-create by natural key: a partially seeded year (stray wizard/manual
  // papers) keeps its rows and only gains the MISSING source papers. Blind bulk
  // insert here both duplicated existing keys and was the reason the old
  // zero-papers fast-path had to skip partial years entirely.
  const existingTargetPapers = await tx
    .select()
    .from(paperModel)
    .where(eq(paperModel.academicYearId, target.id));
  const existingByKey = new Map(
    existingTargetPapers.map((p) => [paperKey(p), p]),
  );

  const missingSrcPapers = srcPapers.filter(
    (p) => !existingByKey.has(paperKey(p)),
  );
  const inserted = missingSrcPapers.length
    ? await tx
        .insert(paperModel)
        .values(
          missingSrcPapers.map((p) => ({
            subjectId: p.subjectId,
            affiliationId: p.affiliationId,
            regulationTypeId: p.regulationTypeId,
            academicYearId: target.id,
            subjectTypeId: p.subjectTypeId,
            programCourseId: p.programCourseId,
            classId: p.classId,
            name: p.name,
            code: p.code,
            isOptional: p.isOptional,
            sequence: p.sequence,
            isActive: p.isActive,
            autoAssign: p.autoAssign,
            previousPaperId: null, // chained below by natural key
          })),
        )
        .returning()
    : [];
  result.papers = inserted.length;

  // All target papers that mirror a source paper — freshly inserted AND the
  // pre-existing matches. Components and chaining below treat both alike, so a
  // pre-existing stray paper also gets its missing components and prev-link.
  const targetPapers = [...existingTargetPapers, ...inserted];
  const srcByKey = new Map(srcPapers.map((p) => [paperKey(p), p.id]));
  const srcIdToTargetId = new Map<number, number>();
  for (const topPaper of targetPapers) {
    const srcId = srcByKey.get(paperKey(topPaper));
    if (srcId != null) srcIdToTargetId.set(srcId, topPaper.id);
  }

  // Components — copy each source paper's components onto the matching target
  // paper, but ONLY for target papers that currently have no components (never
  // merge into a hand-configured set).
  const targetIds = [...srcIdToTargetId.values()];
  const targetComponentRows = targetIds.length
    ? await tx
        .select({ paperId: paperComponentModel.paperId })
        .from(paperComponentModel)
        .where(inArray(paperComponentModel.paperId, targetIds))
    : [];
  const targetIdsWithComponents = new Set(
    targetComponentRows.map((c) => c.paperId),
  );
  const srcPaperIds = [...srcIdToTargetId.keys()];
  const srcComponents = srcPaperIds.length
    ? await tx
        .select()
        .from(paperComponentModel)
        .where(inArray(paperComponentModel.paperId, srcPaperIds))
    : [];
  const componentRows = srcComponents
    .map((c) => {
      const targetPaperId = srcIdToTargetId.get(c.paperId);
      if (targetPaperId == null) return null;
      if (targetIdsWithComponents.has(targetPaperId)) return null;
      return {
        paperId: targetPaperId,
        examComponentId: c.examComponentId,
        fullMarks: c.fullMarks,
        credit: c.credit,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r != null);
  if (componentRows.length) {
    await tx.insert(paperComponentModel).values(componentRows);
    result.paperComponents = componentRows.length;
  }

  // previous_paper_id chaining to the adjacent years (by natural key) — over
  // ALL matched target papers, so pre-existing rows get stitched too.
  const targetStart = startYearOf(target.year);
  if (targetStart == null) return;
  const prevYear = allYears.find(
    (y) => startYearOf(y.year) === targetStart - 1,
  );
  const nextYear = allYears.find(
    (y) => startYearOf(y.year) === targetStart + 1,
  );

  if (prevYear) {
    const prevPapers = await tx
      .select()
      .from(paperModel)
      .where(eq(paperModel.academicYearId, prevYear.id));
    const prevByKey = new Map(prevPapers.map((p) => [paperKey(p), p.id]));
    for (const tp of targetPapers) {
      const prevId = prevByKey.get(paperKey(tp));
      if (prevId != null && tp.previousPaperId !== prevId) {
        await tx
          .update(paperModel)
          .set({ previousPaperId: prevId })
          .where(eq(paperModel.id, tp.id));
      }
    }
  }

  if (nextYear) {
    // The next year's papers must point back to these papers as their immediate
    // previous year (e.g. importing 2024-25 -> update 2025-26's
    // previous_paper_id to the new 2024-25 paper). Always re-point on a key match,
    // not only when null, so the chain reflects the now-nearest previous year.
    const targetByKey = new Map(targetPapers.map((p) => [paperKey(p), p.id]));
    const nextPapers = await tx
      .select()
      .from(paperModel)
      .where(eq(paperModel.academicYearId, nextYear.id));
    for (const nx of nextPapers) {
      const targetId = targetByKey.get(paperKey(nx));
      if (targetId != null && nx.previousPaperId !== targetId) {
        await tx
          .update(paperModel)
          .set({ previousPaperId: targetId })
          .where(eq(paperModel.id, nx.id));
      }
    }
  }
}
