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
  classModel,
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
  subjectModel,
  subjectTypeModel,
  programCourseModel,
  streamModel,
} from "@repo/db/schemas/models/course-design";
import { boardSubjectNameModel } from "@repo/db/schemas/models/admissions";

/** Active = isActive true OR null (default). Inactive rows are not cloned forward. */
function activeOnly(col: Column): SQL {
  return or(isNull(col), eq(col, true))!;
}

// Prefer short code / short name over the long display name in the preview tables.
const SUBJECT_TYPE_LABEL = sql<string>`COALESCE(NULLIF(TRIM(${subjectTypeModel.code}), ''), ${subjectTypeModel.name})`;
const SUBJECT_LABEL = sql<string>`COALESCE(NULLIF(TRIM(${subjectModel.code}), ''), ${subjectModel.name})`;
const STREAM_LABEL = sql<string>`COALESCE(NULLIF(TRIM(${streamModel.shortName}), ''), ${streamModel.name})`;

/** What gets cloned from the source year into a freshly-created academic year. */
export const COPYABLE_ENTITIES = [
  "metas",
  "relatedSubjects",
  "restrictedGroupings",
  "papers",
] as const;

/**
 * "2025-26" -> "2026-27". Falls back to the current calendar year when no prior
 * year is parseable.
 */
export function computeNextYear(years: string[]): string {
  let maxStart = 0;
  for (const y of years) {
    const m = String(y).match(/^(\d{4})/);
    if (m) maxStart = Math.max(maxStart, Number(m[1]));
  }
  if (!maxStart) maxStart = new Date().getFullYear();
  const nextStart = maxStart + 1;
  const nextEnd = String((nextStart + 1) % 100).padStart(2, "0");
  return `${nextStart}-${nextEnd}`;
}

function groupChildren<
  T extends { parentId: number | null; value: string | null },
>(rows: T[]): Map<number, string[]> {
  const map = new Map<number, string[]>();
  for (const r of rows) {
    if (r.parentId == null || r.value == null) continue;
    const list = map.get(r.parentId) ?? [];
    list.push(r.value);
    map.set(r.parentId, list);
  }
  return map;
}

export type AcademicYearCopyPreview = {
  sourceYear: { id: number; year: string } | null;
  nextYear: string;
  counts: {
    metas: number;
    relatedSubjects: number;
    restrictedGroupings: number;
    papers: number;
  };
  metas: Array<{
    id: number;
    label: string;
    subjectType: string | null;
    sequence: number | null;
    classes: string[];
    streams: string[];
  }>;
  relatedSubjects: Array<{
    id: number;
    programCourse: string | null;
    subjectType: string | null;
    boardSubjectName: string | null;
    related: string[];
  }>;
  restrictedGroupings: Array<{
    id: number;
    subjectType: string | null;
    subject: string | null;
    classes: string[];
    programCourses: string[];
    cannotCombineWith: string[];
  }>;
  papers: {
    total: number;
    rows: Array<{
      id: number;
      name: string;
      code: string;
      programCourse: string | null;
      className: string | null;
      subjectType: string | null;
      subject: string | null;
      isOptional: boolean | null;
    }>;
  };
};

const PAPER_PREVIEW_LIMIT = 500;

const EMPTY_PREVIEW = (nextYear: string): AcademicYearCopyPreview => ({
  sourceYear: null,
  nextYear,
  counts: { metas: 0, relatedSubjects: 0, restrictedGroupings: 0, papers: 0 },
  metas: [],
  relatedSubjects: [],
  restrictedGroupings: [],
  papers: { total: 0, rows: [] },
});

/** Read-only snapshot of what will be cloned, for the "Add academic year" dialog. */
export async function getAcademicYearCopyPreview(): Promise<AcademicYearCopyPreview> {
  const allYears = await db
    .select({ id: academicYearModel.id, year: academicYearModel.year })
    .from(academicYearModel);
  const nextYear = computeNextYear(allYears.map((y) => y.year));

  // Source = the currently active year (the one we clone forward from).
  const [source] = await db
    .select({ id: academicYearModel.id, year: academicYearModel.year })
    .from(academicYearModel)
    .where(eq(academicYearModel.isCurrentYear, true));
  if (!source) return EMPTY_PREVIEW(nextYear);

  const srcId = source.id;

  // --- Metas (+ classes, streams) ---
  const metas = await db
    .select({
      id: subjectSelectionMetaModel.id,
      label: subjectSelectionMetaModel.label,
      sequence: subjectSelectionMetaModel.sequence,
      subjectType: SUBJECT_TYPE_LABEL,
    })
    .from(subjectSelectionMetaModel)
    .leftJoin(
      subjectTypeModel,
      eq(subjectTypeModel.id, subjectSelectionMetaModel.subjectTypeId),
    )
    .where(
      and(
        eq(subjectSelectionMetaModel.academicYearId, srcId),
        activeOnly(subjectSelectionMetaModel.isActive),
      ),
    )
    .orderBy(subjectSelectionMetaModel.sequence);
  const metaIds = metas.map((m) => m.id);
  const metaClassRows = metaIds.length
    ? await db
        .select({
          parentId: subjectSelectionMetaClassModel.subjectSelectionMetaId,
          value: classModel.name,
        })
        .from(subjectSelectionMetaClassModel)
        .leftJoin(
          classModel,
          eq(classModel.id, subjectSelectionMetaClassModel.classId),
        )
        .where(
          inArray(
            subjectSelectionMetaClassModel.subjectSelectionMetaId,
            metaIds,
          ),
        )
    : [];
  const metaStreamRows = metaIds.length
    ? await db
        .select({
          parentId: subjectSelectionMetaStreamModel.subjectSelectionMetaId,
          value: STREAM_LABEL,
        })
        .from(subjectSelectionMetaStreamModel)
        .leftJoin(
          streamModel,
          eq(streamModel.id, subjectSelectionMetaStreamModel.streamId),
        )
        .where(
          inArray(
            subjectSelectionMetaStreamModel.subjectSelectionMetaId,
            metaIds,
          ),
        )
    : [];
  const metaClasses = groupChildren(metaClassRows);
  const metaStreams = groupChildren(metaStreamRows);

  // --- Related subjects (+ sub board-subject names) ---
  const relMains = await db
    .select({
      id: relatedSubjectMainModel.id,
      programCourse: programCourseModel.shortName,
      subjectType: SUBJECT_TYPE_LABEL,
      boardSubjectName: boardSubjectNameModel.name,
    })
    .from(relatedSubjectMainModel)
    .leftJoin(
      programCourseModel,
      eq(programCourseModel.id, relatedSubjectMainModel.programCourseId),
    )
    .leftJoin(
      subjectTypeModel,
      eq(subjectTypeModel.id, relatedSubjectMainModel.subjectTypeId),
    )
    .leftJoin(
      boardSubjectNameModel,
      eq(boardSubjectNameModel.id, relatedSubjectMainModel.boardSubjectNameId),
    )
    .where(
      and(
        eq(relatedSubjectMainModel.academicYearId, srcId),
        activeOnly(relatedSubjectMainModel.isActive),
      ),
    );
  const relIds = relMains.map((r) => r.id);
  const relSubRows = relIds.length
    ? await db
        .select({
          parentId: relatedSubjectSubModel.relatedSubjectMainId,
          value: boardSubjectNameModel.name,
        })
        .from(relatedSubjectSubModel)
        .leftJoin(
          boardSubjectNameModel,
          eq(
            boardSubjectNameModel.id,
            relatedSubjectSubModel.boardSubjectNameId,
          ),
        )
        .where(inArray(relatedSubjectSubModel.relatedSubjectMainId, relIds))
    : [];
  const relSubs = groupChildren(relSubRows);

  // --- Restricted groupings (+ classes, program courses, cannot-combine subjects) ---
  const rgMains = await db
    .select({
      id: restrictedGroupingMainModel.id,
      subjectType: SUBJECT_TYPE_LABEL,
      subject: SUBJECT_LABEL,
    })
    .from(restrictedGroupingMainModel)
    .leftJoin(
      subjectTypeModel,
      eq(subjectTypeModel.id, restrictedGroupingMainModel.subjectTypeId),
    )
    .leftJoin(
      subjectModel,
      eq(subjectModel.id, restrictedGroupingMainModel.subjectId),
    )
    .where(
      and(
        // restricted groupings are stored global (academic_year_id NULL) today, so
        // include NULL rows as well as any stamped to the source year.
        or(
          eq(restrictedGroupingMainModel.academicYearId, srcId),
          isNull(restrictedGroupingMainModel.academicYearId),
        ),
        activeOnly(restrictedGroupingMainModel.isActive),
      ),
    );
  const rgIds = rgMains.map((r) => r.id);
  const rgClassRows = rgIds.length
    ? await db
        .select({
          parentId: restrictedGroupingClassModel.restrictedGroupingMainId,
          value: classModel.name,
        })
        .from(restrictedGroupingClassModel)
        .leftJoin(
          classModel,
          eq(classModel.id, restrictedGroupingClassModel.classId),
        )
        .where(
          inArray(restrictedGroupingClassModel.restrictedGroupingMainId, rgIds),
        )
    : [];
  const rgPcRows = rgIds.length
    ? await db
        .select({
          parentId:
            restrictedGroupingProgramCourseModel.restrictedGroupingMainId,
          value: programCourseModel.shortName,
        })
        .from(restrictedGroupingProgramCourseModel)
        .leftJoin(
          programCourseModel,
          eq(
            programCourseModel.id,
            restrictedGroupingProgramCourseModel.programCourseId,
          ),
        )
        .where(
          inArray(
            restrictedGroupingProgramCourseModel.restrictedGroupingMainId,
            rgIds,
          ),
        )
    : [];
  const rgSubjRows = rgIds.length
    ? await db
        .select({
          parentId: restrictedGroupingSubjectModel.restrictedGroupingMainId,
          value: SUBJECT_LABEL,
        })
        .from(restrictedGroupingSubjectModel)
        .leftJoin(
          subjectModel,
          eq(
            subjectModel.id,
            restrictedGroupingSubjectModel.cannotCombineWithSubjectId,
          ),
        )
        .where(
          inArray(
            restrictedGroupingSubjectModel.restrictedGroupingMainId,
            rgIds,
          ),
        )
    : [];
  const rgClasses = groupChildren(rgClassRows);
  const rgPcs = groupChildren(rgPcRows);
  const rgSubjs = groupChildren(rgSubjRows);

  // --- Papers (capped sample + true total) ---
  const paperRows = await db
    .select({
      id: paperModel.id,
      name: paperModel.name,
      code: paperModel.code,
      isOptional: paperModel.isOptional,
      programCourse: programCourseModel.shortName,
      className: classModel.name,
      subjectType: SUBJECT_TYPE_LABEL,
      subject: SUBJECT_LABEL,
    })
    .from(paperModel)
    .leftJoin(
      programCourseModel,
      eq(programCourseModel.id, paperModel.programCourseId),
    )
    .leftJoin(classModel, eq(classModel.id, paperModel.classId))
    .leftJoin(
      subjectTypeModel,
      eq(subjectTypeModel.id, paperModel.subjectTypeId),
    )
    .leftJoin(subjectModel, eq(subjectModel.id, paperModel.subjectId))
    .where(
      and(
        eq(paperModel.academicYearId, srcId),
        activeOnly(paperModel.isActive),
      ),
    )
    .orderBy(
      paperModel.programCourseId,
      paperModel.classId,
      paperModel.sequence,
    )
    .limit(PAPER_PREVIEW_LIMIT);
  const [paperTotalRow] = await db
    .select({ total: count() })
    .from(paperModel)
    .where(
      and(
        eq(paperModel.academicYearId, srcId),
        activeOnly(paperModel.isActive),
      ),
    );
  const paperTotal = Number(paperTotalRow?.total ?? 0);

  return {
    sourceYear: source,
    nextYear,
    counts: {
      metas: metas.length,
      relatedSubjects: relMains.length,
      restrictedGroupings: rgMains.length,
      papers: Number(paperTotal ?? 0),
    },
    metas: metas.map((m) => ({
      id: m.id,
      label: m.label,
      subjectType: m.subjectType,
      sequence: m.sequence,
      classes: metaClasses.get(m.id) ?? [],
      streams: metaStreams.get(m.id) ?? [],
    })),
    relatedSubjects: relMains.map((r) => ({
      id: r.id,
      programCourse: r.programCourse,
      subjectType: r.subjectType,
      boardSubjectName: r.boardSubjectName,
      related: relSubs.get(r.id) ?? [],
    })),
    restrictedGroupings: rgMains.map((r) => ({
      id: r.id,
      subjectType: r.subjectType,
      subject: r.subject,
      classes: rgClasses.get(r.id) ?? [],
      programCourses: rgPcs.get(r.id) ?? [],
      cannotCombineWith: rgSubjs.get(r.id) ?? [],
    })),
    papers: { total: Number(paperTotal ?? 0), rows: paperRows },
  };
}

export type AcademicYearCopyResult = {
  academicYear: { id: number; year: string; isCurrentYear: boolean | null };
  sourceYearId: number | null;
  copied: {
    metas: number;
    relatedSubjects: number;
    restrictedGroupings: number;
    papers: number;
    paperComponents: number;
  };
};

/**
 * Create a new academic year, make it the active one, and clone the four
 * year-scoped masters (metas, related subjects, restricted groupings, papers)
 * forward from the previously-active year. All-or-nothing in one transaction.
 */
export async function createAcademicYearWithCopy(
  year: string,
  makeActive: boolean = false,
): Promise<AcademicYearCopyResult> {
  const trimmed = String(year ?? "").trim();
  if (!/^\d{4}-\d{2}$/.test(trimmed)) {
    const err = new Error("Year must be in YYYY-YY format (e.g. 2026-27).");
    // @ts-expect-error attach status for handleError
    err.status = 400;
    throw err;
  }

  const [existing] = await db
    .select({ id: academicYearModel.id })
    .from(academicYearModel)
    .where(eq(academicYearModel.year, trimmed));
  if (existing) {
    const err = new Error(`Academic year ${trimmed} already exists.`);
    // @ts-expect-error attach status for handleError
    err.status = 409;
    throw err;
  }

  return db.transaction(async (tx) => {
    // Source = currently active year (clone forward from it).
    const [source] = await tx
      .select({ id: academicYearModel.id })
      .from(academicYearModel)
      .where(eq(academicYearModel.isCurrentYear, true));
    const sourceId = source?.id ?? null;

    // Only take over the active flag when the operator opted in; otherwise the
    // current year stays active and the new year is created inactive.
    if (makeActive) {
      await tx
        .update(academicYearModel)
        .set({ isCurrentYear: false })
        .where(eq(academicYearModel.isCurrentYear, true));
    }
    const [created] = await tx
      .insert(academicYearModel)
      .values({ year: trimmed, isCurrentYear: makeActive })
      .returning();

    const copied = {
      metas: 0,
      relatedSubjects: 0,
      restrictedGroupings: 0,
      papers: 0,
      paperComponents: 0,
    };
    if (sourceId == null || !created) {
      return {
        academicYear: created,
        sourceYearId: sourceId,
        copied,
      } as AcademicYearCopyResult;
    }
    const newYearId = created.id;

    // 1) Subject-selection metas (+ classes, streams)
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
          academicYearId: newYearId,
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
      copied.metas += 1;
    }

    // 2) Related subjects (+ subs)
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
          academicYearId: newYearId,
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
      copied.relatedSubjects += 1;
    }

    // 3) Restricted groupings (+ classes, program courses, subjects)
    const srcRg = await tx
      .select()
      .from(restrictedGroupingMainModel)
      .where(
        and(
          or(
            eq(restrictedGroupingMainModel.academicYearId, sourceId),
            isNull(restrictedGroupingMainModel.academicYearId),
          ),
          activeOnly(restrictedGroupingMainModel.isActive),
        ),
      );
    for (const main of srcRg) {
      const [newMain] = await tx
        .insert(restrictedGroupingMainModel)
        .values({
          academicYearId: newYearId,
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
      copied.restrictedGroupings += 1;
    }

    // 4) Papers — single batch insert, chaining previous_paper_id to the source paper.
    const srcPapers = await tx
      .select()
      .from(paperModel)
      .where(
        and(
          eq(paperModel.academicYearId, sourceId),
          activeOnly(paperModel.isActive),
        ),
      );
    if (srcPapers.length) {
      const insertedPapers = await tx
        .insert(paperModel)
        .values(
          srcPapers.map((p) => ({
            subjectId: p.subjectId,
            affiliationId: p.affiliationId,
            regulationTypeId: p.regulationTypeId,
            academicYearId: newYearId,
            subjectTypeId: p.subjectTypeId,
            programCourseId: p.programCourseId,
            classId: p.classId,
            name: p.name,
            code: p.code,
            isOptional: p.isOptional,
            sequence: p.sequence,
            isActive: p.isActive,
            autoAssign: p.autoAssign,
            previousPaperId: p.id,
          })),
        )
        .returning({
          id: paperModel.id,
          previousPaperId: paperModel.previousPaperId,
        });
      copied.papers = insertedPapers.length;

      // 4b) Paper components — clone each source paper's exam components onto its
      // new paper. Without this the new year's papers have no components, which
      // makes them invisible to exam scheduling (the component filter drops them).
      const oldToNewPaperId = new Map<number, number>();
      for (const np of insertedPapers) {
        if (np.previousPaperId != null)
          oldToNewPaperId.set(np.previousPaperId, np.id);
      }
      const srcPaperIds = srcPapers.map((p) => p.id!);
      const srcComponents = srcPaperIds.length
        ? await tx
            .select()
            .from(paperComponentModel)
            .where(inArray(paperComponentModel.paperId, srcPaperIds))
        : [];
      const componentRows = srcComponents
        .map((c) => {
          const newPaperId = oldToNewPaperId.get(c.paperId);
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
        copied.paperComponents = componentRows.length;
      }
    }

    return {
      academicYear: created,
      sourceYearId: sourceId,
      copied,
    } as AcademicYearCopyResult;
  });
}
