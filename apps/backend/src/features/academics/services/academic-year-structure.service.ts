import { db } from "@/db/index.js";
import {
  and,
  count,
  eq,
  inArray,
  isNull,
  or,
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
 * papers + paper_components. Idempotent — the session is find-or-create, and the
 * master/paper copy only runs when the year has NO papers yet (the whole copy
 * runs inside the caller's transaction, so it is all-or-nothing; once papers
 * exist, later calls fast-path out). Missing structure is copied from the
 * nearest academic year that has papers, and the previous_paper_id chain is
 * stitched to the adjacent years by a natural key.
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
    papers: 0,
    paperComponents: 0,
  };

  const [target] = await tx
    .select()
    .from(academicYearModel)
    .where(eq(academicYearModel.id, targetYearId));
  if (!target) return result;

  // 1) Session — find-or-create (idempotent).
  result.sessionCreated = await ensureSession(tx, target, opts.legacySession);

  // Fast path: a year that already has papers is considered structured.
  const [{ papers: existingPapers }] = await tx
    .select({ papers: count() })
    .from(paperModel)
    .where(eq(paperModel.academicYearId, targetYearId));
  if (Number(existingPapers) > 0) return result;

  // 2) Source year = explicit opt, else nearest academic year that has papers.
  const allYears = await tx
    .select({
      id: academicYearModel.id,
      year: academicYearModel.year,
    })
    .from(academicYearModel);
  const yearsWithPapers = await tx
    .selectDistinct({ id: paperModel.academicYearId })
    .from(paperModel);
  const hasPapers = new Set(
    yearsWithPapers.map((r) => r.id).filter((id): id is number => id != null),
  );

  let sourceId = opts.sourceYearId ?? null;
  if (sourceId == null || !hasPapers.has(sourceId)) {
    const targetStart = startYearOf(target.year);
    let best: { id: number; start: number } | null = null;
    for (const y of allYears) {
      if (y.id === targetYearId || !hasPapers.has(y.id)) continue;
      const s = startYearOf(y.year);
      if (s == null || targetStart == null) continue;
      const dist = Math.abs(s - targetStart);
      if (
        best == null ||
        dist < Math.abs(best.start - targetStart) ||
        (dist === Math.abs(best.start - targetStart) && s > best.start)
      ) {
        best = { id: y.id, start: s };
      }
    }
    sourceId = best?.id ?? null;
  }
  if (sourceId == null) return result; // nothing to seed from

  // 3) Copy the masters + papers + components from the source year.
  await copyMetas(tx, sourceId, targetYearId, result);
  await copyRelatedSubjects(tx, sourceId, targetYearId, result);
  await copyRestrictedGroupings(tx, sourceId, targetYearId, result);
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
  for (const meta of srcMetas) {
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
    const classes = await tx
      .select()
      .from(subjectSelectionMetaClassModel)
      .where(
        eq(subjectSelectionMetaClassModel.subjectSelectionMetaId, meta.id),
      );
    if (classes.length) {
      await tx.insert(subjectSelectionMetaClassModel).values(
        classes.map((c) => ({
          subjectSelectionMetaId: newMeta.id,
          classId: c.classId,
        })),
      );
    }
    const streams = await tx
      .select()
      .from(subjectSelectionMetaStreamModel)
      .where(
        eq(subjectSelectionMetaStreamModel.subjectSelectionMetaId, meta.id),
      );
    if (streams.length) {
      await tx.insert(subjectSelectionMetaStreamModel).values(
        streams.map((s) => ({
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
  for (const main of srcRel) {
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
  for (const main of srcRg) {
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

  const inserted = await tx
    .insert(paperModel)
    .values(
      srcPapers.map((p) => ({
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
    .returning();
  result.papers = inserted.length;

  // Components — clone each source paper's components onto the matching new paper
  // (matched by natural key, since previousPaperId starts null here).
  const srcByKey = new Map(srcPapers.map((p) => [paperKey(p), p.id]));
  const srcIdToNewId = new Map<number, number>();
  for (const np of inserted) {
    const srcId = srcByKey.get(paperKey(np));
    if (srcId != null) srcIdToNewId.set(srcId, np.id);
  }
  const srcPaperIds = [...srcIdToNewId.keys()];
  const srcComponents = srcPaperIds.length
    ? await tx
        .select()
        .from(paperComponentModel)
        .where(inArray(paperComponentModel.paperId, srcPaperIds))
    : [];
  const componentRows = srcComponents
    .map((c) => {
      const newPaperId = srcIdToNewId.get(c.paperId);
      if (newPaperId == null) return null;
      return {
        paperId: newPaperId,
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

  // previous_paper_id chaining to the adjacent years (by natural key).
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
    for (const np of inserted) {
      const prevId = prevByKey.get(paperKey(np));
      if (prevId != null) {
        await tx
          .update(paperModel)
          .set({ previousPaperId: prevId })
          .where(eq(paperModel.id, np.id));
      }
    }
  }

  if (nextYear) {
    const newByKey = new Map(inserted.map((p) => [paperKey(p), p.id]));
    const nextPapers = await tx
      .select()
      .from(paperModel)
      .where(eq(paperModel.academicYearId, nextYear.id));
    for (const nx of nextPapers) {
      if (nx.previousPaperId != null) continue;
      const newId = newByKey.get(paperKey(nx));
      if (newId != null) {
        await tx
          .update(paperModel)
          .set({ previousPaperId: newId })
          .where(eq(paperModel.id, nx.id));
      }
    }
  }
}
