import { db } from "@/db/index.js";
import {
  admissionCourseDetailsModel,
  admissionProgramCourseModel,
  affiliationModel,
  classModel,
  examFormFillupModel,
  programCourseModel,
  promotionBuilderModel,
  promotionModel,
  regulationTypeModel,
  sessionModel,
  shiftModel,
  studentModel,
  userModel,
} from "@repo/db/schemas";
import { socketService } from "@/services/socketService.js";
import { alias } from "drizzle-orm/pg-core";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { precomputeBuilderPolicy } from "./promotion-builder-policy.service.js";
import type { PrecomputedBuilderPolicy } from "./promotion-builder-policy.service.js";

export type PromotionRosterBucket =
  | "all"
  | "eligible"
  | "ineligible"
  | "suspended"
  | "promoted";

export type PromotionRosterSort = "uid" | "rollNumber" | "registrationNumber";

export type PromotionRosterParams = {
  academicYearId: number;
  fromSessionId: number;
  fromClassId: number;
  toSessionId: number;
  toClassId: number;
  affiliationIds?: number[];
  regulationTypeIds?: number[];
  programCourseIds?: number[];
  shiftIds?: number[];
  bucket: PromotionRosterBucket;
  sortBy: PromotionRosterSort;
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
  q?: string;
  /**
   * When false (default), `counts` in the response is null — use `GET .../bucket-counts` for
   * dashboard totals without blocking the paginated roster query.
   */
  includeBucketCounts?: boolean;
};

const pFrom = alias(promotionModel, "p_from");
const pTo = alias(promotionModel, "p_to");
const classFrom = alias(classModel, "class_from");
const classTo = alias(classModel, "class_to");

function sortColumn(sortBy: PromotionRosterSort) {
  switch (sortBy) {
    case "rollNumber":
      return studentModel.rollNumber;
    case "registrationNumber":
      return studentModel.registrationNumber;
    case "uid":
    default:
      return studentModel.uid;
  }
}

function baseFilters(params: PromotionRosterParams): SQL | undefined {
  const parts: SQL[] = [
    eq(pFrom.sessionId, params.fromSessionId),
    eq(pFrom.classId, params.fromClassId),
    eq(sessionModel.academicYearId, params.academicYearId),
    sql`NOT (${sqlTrulyInactive})`,
  ];
  if (params.affiliationIds?.length) {
    parts.push(
      params.affiliationIds.length === 1
        ? eq(programCourseModel.affiliationId, params.affiliationIds[0]!)
        : inArray(programCourseModel.affiliationId, params.affiliationIds),
    );
  }
  if (params.regulationTypeIds?.length) {
    parts.push(
      params.regulationTypeIds.length === 1
        ? eq(programCourseModel.regulationTypeId, params.regulationTypeIds[0]!)
        : inArray(
            programCourseModel.regulationTypeId,
            params.regulationTypeIds,
          ),
    );
  }
  if (params.programCourseIds?.length) {
    parts.push(
      params.programCourseIds.length === 1
        ? eq(pFrom.programCourseId, params.programCourseIds[0]!)
        : inArray(pFrom.programCourseId, params.programCourseIds),
    );
  }
  if (params.shiftIds?.length) {
    parts.push(
      params.shiftIds.length === 1
        ? eq(pFrom.shiftId, params.shiftIds[0]!)
        : inArray(pFrom.shiftId, params.shiftIds),
    );
  }
  const term = params.q?.trim();
  if (term) {
    const pat = `%${term}%`;
    parts.push(
      or(
        ilike(userModel.name, pat),
        ilike(studentModel.uid, pat),
        ilike(studentModel.rollNumber, pat),
        ilike(studentModel.registrationNumber, pat),
      )!,
    );
  }
  return and(...parts);
}

/** Suspended account — shown in roster but not eligible for direct promotion. */
const sqlSuspended = sql`(COALESCE(${userModel.isSuspended}, false) = true)`;

/** Truly inactive (deactivated, NOT suspended) — excluded from the roster entirely. */
const sqlTrulyInactive = sql`(
  COALESCE(${userModel.isSuspended}, false) = false
  AND (
    COALESCE(${studentModel.active}, true) = false
    OR COALESCE(${userModel.isActive}, true) = false
  )
)`;

const sqlPromoted = sql`${pTo.id} IS NOT NULL`;

/**
 * SQL expression → TRUE when the student passes the promotion builder policy.
 * Uses pre-fetched builder config so the only per-row work is a simple
 * form-fill-up COUNT / EXISTS check.
 *
 * Only CONDITIONAL affiliations need a WHEN clause. Everything else (no builder,
 * AUTO_PROMOTE, unknown affiliation) falls through to ELSE true.
 */
function sqlPolicyPass(policy: PrecomputedBuilderPolicy): SQL {
  if (policy.conditionalReqs.size === 0) return sql`true`;

  const whenClauses: SQL[] = [];

  for (const [affId, reqs] of policy.conditionalReqs) {
    const checks: SQL[] = [];

    if (reqs.requiredClassIds.length > 0) {
      const inList = sql.join(
        reqs.requiredClassIds.map((id) => sql`${id}::int`),
        sql`, `,
      );
      const reqCount = reqs.requiredClassIds.length;

      checks.push(
        sql`(
          SELECT count(DISTINCT ${examFormFillupModel.classId})::int
          FROM ${examFormFillupModel}
          WHERE ${examFormFillupModel.studentId} = ${pFrom.studentId}
            AND ${examFormFillupModel.programCourseId} = ${pFrom.programCourseId}
            AND ${examFormFillupModel.classId} IN (${inList})
            AND ${examFormFillupModel.status} = 'COMPLETED'
            AND EXISTS (
              SELECT 1 FROM ${promotionModel}
              WHERE ${promotionModel.studentId} = ${examFormFillupModel.studentId}
                AND ${promotionModel.programCourseId} = ${examFormFillupModel.programCourseId}
                AND ${promotionModel.classId} = ${examFormFillupModel.classId}
                AND ${promotionModel.shiftId} = ${pFrom.shiftId}
            )
        ) = ${reqCount}`,
      );
    }

    if (reqs.requiresSourceFormFillup) {
      checks.push(
        sql`EXISTS (
          SELECT 1 FROM ${examFormFillupModel}
          WHERE ${examFormFillupModel.id} = ${pFrom.examFormFillupId}
            AND ${examFormFillupModel.status} = 'COMPLETED'
        )`,
      );
    }

    if (checks.length === 0) {
      whenClauses.push(
        sql`WHEN ${programCourseModel.affiliationId} = ${affId} THEN true`,
      );
    } else if (checks.length === 1) {
      whenClauses.push(
        sql`WHEN ${programCourseModel.affiliationId} = ${affId} THEN (${checks[0]})`,
      );
    } else {
      whenClauses.push(
        sql`WHEN ${programCourseModel.affiliationId} = ${affId} THEN (${sql.join(checks, sql` AND `)})`,
      );
    }
  }

  return sql`(CASE ${sql.join(whenClauses, sql` `)} ELSE true END)`;
}

const sqlPolicyIneligible = (policy: PrecomputedBuilderPolicy) =>
  sql`NOT (${sqlPolicyPass(policy)})`;

function bucketPredicate(
  bucket: PromotionRosterBucket,
  policy: PrecomputedBuilderPolicy,
): SQL | undefined {
  switch (bucket) {
    case "all":
      return undefined;
    case "promoted":
      return sqlPromoted;
    case "suspended":
      return sql`(${sqlSuspended}) AND NOT (${sqlPromoted})`;
    case "ineligible":
      return sql`NOT (${sqlPromoted}) AND NOT (${sqlSuspended}) AND (${sqlPolicyIneligible(policy)})`;
    case "eligible":
      return sql`NOT (${sqlPromoted}) AND NOT (${sqlSuspended}) AND NOT (${sqlPolicyIneligible(policy)})`;
    default:
      return undefined;
  }
}

export type PromotionRosterRow = {
  studentId: number;
  promotionId: number;
  uid: string;
  rollNumber: string | null;
  registrationNumber: string | null;
  studentName: string;
  affiliationId: number | null;
  affiliationName: string | null;
  regulationName: string | null;
  programCourseName: string | null;
  shiftName: string;
  fromClassName: string;
  toClassName: string;
  bucket: "eligible" | "ineligible" | "suspended" | "promoted";
};

function rowBucketExpr(policy: PrecomputedBuilderPolicy) {
  return sql<PromotionRosterRow["bucket"]>`
    CASE
      WHEN ${sqlPromoted} THEN 'promoted'
      WHEN ${sqlSuspended} THEN 'suspended'
      WHEN ${sqlPolicyIneligible(policy)} THEN 'ineligible'
      ELSE 'eligible'
    END
  `;
}

/** Scope filters for `getPromotionRosterBucketCounts` (same as roster, without paging/sorting/bucket). */
export type PromotionRosterScopeParams = Pick<
  PromotionRosterParams,
  | "academicYearId"
  | "fromSessionId"
  | "fromClassId"
  | "toSessionId"
  | "toClassId"
  | "affiliationIds"
  | "regulationTypeIds"
  | "programCourseIds"
  | "shiftIds"
  | "q"
>;

export type PromotionRosterBucketCounts = {
  all: number;
  eligible: number;
  ineligible: number;
  suspended: number;
  promoted: number;
};

/**
 * Expensive: full scan of the roster scope with eligibility policy per row. Call separately
 * (e.g. after the paginated roster) so the table can load quickly.
 */
export async function getPromotionRosterBucketCounts(
  params: PromotionRosterScopeParams,
): Promise<PromotionRosterBucketCounts> {
  const baseParams: PromotionRosterParams = {
    ...params,
    bucket: "all",
    sortBy: "uid",
    sortDir: "asc",
    page: 1,
    pageSize: 20,
  };
  const base = baseFilters(baseParams)!;

  const policy = await precomputeBuilderPolicy(params.toClassId);
  const policyInel = sqlPolicyIneligible(policy);

  const [agg] = await db
    .select({
      allCount: count(),
      eligible: sql<number>`cast(coalesce(sum(case
          when not (${sqlPromoted}) and not (${sqlSuspended}) and not (${policyInel}) then 1
          else 0 end), 0) as int)`,
      ineligible: sql<number>`cast(coalesce(sum(case
          when not (${sqlPromoted}) and not (${sqlSuspended}) and (${policyInel}) then 1
          else 0 end), 0) as int)`,
      suspended: sql<number>`cast(coalesce(sum(case
          when (${sqlSuspended}) and not (${sqlPromoted}) then 1
          else 0 end), 0) as int)`,
      promoted: sql<number>`cast(coalesce(sum(case
          when (${sqlPromoted}) then 1
          else 0 end), 0) as int)`,
    })
    .from(pFrom)
    .innerJoin(studentModel, eq(studentModel.id, pFrom.studentId))
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .innerJoin(
      programCourseModel,
      eq(programCourseModel.id, pFrom.programCourseId),
    )
    .innerJoin(shiftModel, eq(shiftModel.id, pFrom.shiftId))
    .innerJoin(sessionModel, eq(sessionModel.id, pFrom.sessionId))
    .innerJoin(classFrom, eq(classFrom.id, pFrom.classId))
    .innerJoin(classTo, eq(classTo.id, params.toClassId))
    .leftJoin(
      pTo,
      and(
        eq(pTo.studentId, pFrom.studentId),
        eq(pTo.sessionId, params.toSessionId),
        eq(pTo.classId, params.toClassId),
      ),
    )
    .where(base);

  return {
    all: Number(agg?.allCount ?? 0),
    eligible: agg?.eligible ?? 0,
    ineligible: agg?.ineligible ?? 0,
    suspended: agg?.suspended ?? 0,
    promoted: agg?.promoted ?? 0,
  };
}

export async function getPromotionRosterPage(
  params: PromotionRosterParams,
): Promise<{
  content: PromotionRosterRow[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  counts: PromotionRosterBucketCounts | null;
}> {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const includeBucketCounts = params.includeBucketCounts === true;
  const base = baseFilters(params);

  const policy = await precomputeBuilderPolicy(params.toClassId);

  const bucketPart = bucketPredicate(params.bucket, policy);
  const whereAll = bucketPart ? and(base, bucketPart) : base;

  const order =
    params.sortDir === "desc"
      ? desc(sortColumn(params.sortBy))
      : asc(sortColumn(params.sortBy));

  const rosterJoins = db
    .select({
      studentId: studentModel.id,
      promotionId: pFrom.id,
      uid: studentModel.uid,
      rollNumber: studentModel.rollNumber,
      registrationNumber: studentModel.registrationNumber,
      studentName: userModel.name,
      affiliationId: programCourseModel.affiliationId,
      affiliationName: affiliationModel.name,
      regulationName: regulationTypeModel.name,
      programCourseName: programCourseModel.name,
      shiftName: shiftModel.name,
      fromClassName: classFrom.name,
      toClassName: classTo.name,
      bucket: rowBucketExpr(policy),
    })
    .from(pFrom)
    .innerJoin(studentModel, eq(studentModel.id, pFrom.studentId))
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .innerJoin(
      programCourseModel,
      eq(programCourseModel.id, pFrom.programCourseId),
    )
    .leftJoin(
      affiliationModel,
      eq(affiliationModel.id, programCourseModel.affiliationId),
    )
    .leftJoin(
      regulationTypeModel,
      eq(regulationTypeModel.id, programCourseModel.regulationTypeId),
    )
    .innerJoin(shiftModel, eq(shiftModel.id, pFrom.shiftId))
    .innerJoin(sessionModel, eq(sessionModel.id, pFrom.sessionId))
    .innerJoin(classFrom, eq(classFrom.id, pFrom.classId))
    .innerJoin(classTo, eq(classTo.id, params.toClassId))
    .leftJoin(
      pTo,
      and(
        eq(pTo.studentId, pFrom.studentId),
        eq(pTo.sessionId, params.toSessionId),
        eq(pTo.classId, params.toClassId),
      ),
    );

  const policyInel = includeBucketCounts ? sqlPolicyIneligible(policy) : null;

  const bucketAggregateQuery =
    includeBucketCounts && policyInel
      ? db
          .select({
            allCount: count(),
            eligible: sql<number>`cast(coalesce(sum(case
          when not (${sqlPromoted}) and not (${sqlSuspended}) and not (${policyInel}) then 1
          else 0 end), 0) as int)`,
            ineligible: sql<number>`cast(coalesce(sum(case
          when not (${sqlPromoted}) and not (${sqlSuspended}) and (${policyInel}) then 1
          else 0 end), 0) as int)`,
            suspended: sql<number>`cast(coalesce(sum(case
          when (${sqlSuspended}) and not (${sqlPromoted}) then 1
          else 0 end), 0) as int)`,
            promoted: sql<number>`cast(coalesce(sum(case
          when (${sqlPromoted}) then 1
          else 0 end), 0) as int)`,
          })
          .from(pFrom)
          .innerJoin(studentModel, eq(studentModel.id, pFrom.studentId))
          .innerJoin(userModel, eq(userModel.id, studentModel.userId))
          .innerJoin(
            programCourseModel,
            eq(programCourseModel.id, pFrom.programCourseId),
          )
          .innerJoin(shiftModel, eq(shiftModel.id, pFrom.shiftId))
          .innerJoin(sessionModel, eq(sessionModel.id, pFrom.sessionId))
          .innerJoin(classFrom, eq(classFrom.id, pFrom.classId))
          .innerJoin(classTo, eq(classTo.id, params.toClassId))
          .leftJoin(
            pTo,
            and(
              eq(pTo.studentId, pFrom.studentId),
              eq(pTo.sessionId, params.toSessionId),
              eq(pTo.classId, params.toClassId),
            ),
          )
          .where(base)
      : Promise.resolve(null);

  const [rows, totalRow, countsRows] = await Promise.all([
    rosterJoins
      .where(whereAll)
      .orderBy(order)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ totalElements: count() })
      .from(pFrom)
      .innerJoin(studentModel, eq(studentModel.id, pFrom.studentId))
      .innerJoin(userModel, eq(userModel.id, studentModel.userId))
      .innerJoin(
        programCourseModel,
        eq(programCourseModel.id, pFrom.programCourseId),
      )
      .innerJoin(shiftModel, eq(shiftModel.id, pFrom.shiftId))
      .innerJoin(sessionModel, eq(sessionModel.id, pFrom.sessionId))
      .innerJoin(classFrom, eq(classFrom.id, pFrom.classId))
      .innerJoin(classTo, eq(classTo.id, params.toClassId))
      .leftJoin(
        pTo,
        and(
          eq(pTo.studentId, pFrom.studentId),
          eq(pTo.sessionId, params.toSessionId),
          eq(pTo.classId, params.toClassId),
        ),
      )
      .where(whereAll),
    bucketAggregateQuery,
  ]);

  const total = Number(totalRow[0]?.totalElements ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const agg = countsRows?.[0];

  return {
    content: rows as PromotionRosterRow[],
    page,
    pageSize,
    totalElements: total,
    totalPages,
    counts:
      includeBucketCounts && agg
        ? {
            all: Number(agg.allCount ?? 0),
            eligible: agg.eligible ?? 0,
            ineligible: agg.ineligible ?? 0,
            suspended: agg.suspended ?? 0,
            promoted: agg.promoted ?? 0,
          }
        : null,
  };
}

/** Matches `meta.operation` on socket progress updates for semester bulk promote. */
export const SEMESTER_PROMOTION_SOCKET_OP = "semester_promotion";

export type BulkSemesterPromoteParams = Pick<
  PromotionRosterParams,
  | "academicYearId"
  | "fromSessionId"
  | "fromClassId"
  | "toSessionId"
  | "toClassId"
  | "affiliationIds"
  | "regulationTypeIds"
  | "programCourseIds"
  | "shiftIds"
> & { studentIds: number[] };

export type BulkSemesterPromoteSkipped = { studentId: number; reason: string };

export type BulkSemesterPromoteResult = {
  /** New `promotions` rows inserted. */
  created: number;
  /** Existing rows for the same student + target session + target class updated in place. */
  updated: number;
  skipped: BulkSemesterPromoteSkipped[];
};

function emitSemesterPromotionProgress(
  progressUserId: string | undefined,
  message: string,
  progress: number,
  status: "started" | "in_progress" | "completed" | "error",
  meta?: Record<string, unknown>,
) {
  if (!progressUserId) return;
  const update = socketService.createExportProgressUpdate(
    progressUserId,
    message,
    progress,
    status,
    undefined,
    undefined,
    undefined,
    { operation: SEMESTER_PROMOTION_SOCKET_OP, ...meta },
  );
  socketService.sendProgressUpdate(progressUserId, update);
}

function joiningDateFromSession(from: Date | string): Date {
  if (from instanceof Date) return from;
  const d = new Date(from);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Creates `promotions` rows for eligible students (same program course, shift, section roll data
 * as source promotion) for the target session and class.
 */
export async function bulkPromoteSemesterStudents(
  params: BulkSemesterPromoteParams,
  options?: { progressUserId?: string },
): Promise<BulkSemesterPromoteResult> {
  const progressUserId = options?.progressUserId;
  const uniqueIds = [
    ...new Set(params.studentIds.filter((n) => Number.isFinite(n) && n > 0)),
  ];

  if (uniqueIds.length === 0) {
    return { created: 0, updated: 0, skipped: [] };
  }

  emitSemesterPromotionProgress(
    progressUserId,
    "Starting semester promotion…",
    2,
    "started",
    { total: uniqueIds.length },
  );

  const baseParams: PromotionRosterParams = {
    academicYearId: params.academicYearId,
    fromSessionId: params.fromSessionId,
    fromClassId: params.fromClassId,
    toSessionId: params.toSessionId,
    toClassId: params.toClassId,
    affiliationIds: params.affiliationIds,
    regulationTypeIds: params.regulationTypeIds,
    programCourseIds: params.programCourseIds,
    shiftIds: params.shiftIds,
    bucket: "all",
    sortBy: "uid",
    sortDir: "asc",
    page: 1,
    pageSize: 20,
    q: undefined,
  };
  const base = baseFilters(baseParams)!;

  const policy = await precomputeBuilderPolicy(params.toClassId);

  const [toSessionRow] = await db
    .select({ from: sessionModel.from })
    .from(sessionModel)
    .where(
      and(
        eq(sessionModel.id, params.toSessionId),
        eq(sessionModel.academicYearId, params.academicYearId),
      ),
    )
    .limit(1);

  if (!toSessionRow) {
    emitSemesterPromotionProgress(
      progressUserId,
      "Target session not found for this academic year.",
      100,
      "error",
    );
    return {
      created: 0,
      updated: 0,
      skipped: uniqueIds.map((studentId) => ({
        studentId,
        reason: "Target session not found for this academic year.",
      })),
    };
  }

  const sessionJoiningFallback = joiningDateFromSession(toSessionRow.from!);

  const whereBulk = and(base, inArray(studentModel.id, uniqueIds));

  const candidateRows = await db
    .select({
      studentId: studentModel.id,
      bucket: rowBucketExpr(policy),
      /** Canonical program course: admission chain, else `students.program_course_id`. */
      programCourseId: sql<number>`coalesce(${admissionProgramCourseModel.programCourseId}, ${studentModel.programCourseId})`,
      shiftId: pFrom.shiftId,
      sectionId: pFrom.sectionId,
      classRollNumber: pFrom.classRollNumber,
      examFormFillupId: pFrom.examFormFillupId,
      /** Prefer `exam_form_fillup.created_at` linked from source promotion; else target session start. */
      examFillupCreatedAt: examFormFillupModel.createdAt,
    })
    .from(pFrom)
    .innerJoin(studentModel, eq(studentModel.id, pFrom.studentId))
    .leftJoin(
      admissionCourseDetailsModel,
      eq(admissionCourseDetailsModel.id, studentModel.admissionCourseDetailsId),
    )
    .leftJoin(
      admissionProgramCourseModel,
      eq(
        admissionProgramCourseModel.id,
        admissionCourseDetailsModel.admissionProgramCourseId,
      ),
    )
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(
      examFormFillupModel,
      eq(examFormFillupModel.id, pFrom.examFormFillupId),
    )
    .innerJoin(
      programCourseModel,
      eq(programCourseModel.id, pFrom.programCourseId),
    )
    .leftJoin(
      affiliationModel,
      eq(affiliationModel.id, programCourseModel.affiliationId),
    )
    .leftJoin(
      regulationTypeModel,
      eq(regulationTypeModel.id, programCourseModel.regulationTypeId),
    )
    .innerJoin(shiftModel, eq(shiftModel.id, pFrom.shiftId))
    .innerJoin(sessionModel, eq(sessionModel.id, pFrom.sessionId))
    .innerJoin(classFrom, eq(classFrom.id, pFrom.classId))
    .innerJoin(classTo, eq(classTo.id, params.toClassId))
    .leftJoin(
      pTo,
      and(
        eq(pTo.studentId, pFrom.studentId),
        eq(pTo.sessionId, params.toSessionId),
        eq(pTo.classId, params.toClassId),
      ),
    )
    .where(whereBulk);

  emitSemesterPromotionProgress(
    progressUserId,
    `Evaluated ${candidateRows.length} roster row(s)…`,
    25,
    "in_progress",
  );

  const byStudent = new Map(
    candidateRows.map((r) => [r.studentId, r] as const),
  );
  const skipped: BulkSemesterPromoteSkipped[] = [];
  const toInsert: (typeof candidateRows)[number][] = [];

  for (const sid of uniqueIds) {
    const row = byStudent.get(sid);
    if (!row) {
      skipped.push({
        studentId: sid,
        reason: "Not in the source roster for the selected filters.",
      });
      continue;
    }
    if (row.bucket !== "eligible") {
      const reason =
        row.bucket === "promoted"
          ? "Already promoted to the target session and class."
          : row.bucket === "suspended"
            ? "Student account is suspended."
            : "Promotion rules are not satisfied for this target.";
      skipped.push({ studentId: sid, reason });
      continue;
    }
    toInsert.push(row);
  }

  if (toInsert.length === 0) {
    emitSemesterPromotionProgress(
      progressUserId,
      "No eligible students to promote.",
      100,
      "completed",
      { created: 0, updated: 0, skippedCount: skipped.length },
    );
    return { created: 0, updated: 0, skipped };
  }

  emitSemesterPromotionProgress(
    progressUserId,
    `Saving ${toInsert.length} promotion record(s) (insert or update)…`,
    55,
    "in_progress",
    { upserting: toInsert.length },
  );

  const promotionPayload = (
    r: (typeof toInsert)[number],
  ): Omit<
    typeof promotionModel.$inferInsert,
    "id" | "createdAt" | "updatedAt"
  > => ({
    studentId: r.studentId,
    programCourseId: r.programCourseId!,
    sessionId: params.toSessionId,
    shiftId: r.shiftId!,
    classId: params.toClassId,
    sectionId: r.sectionId,
    dateOfJoining: r.examFillupCreatedAt ?? sessionJoiningFallback,
    classRollNumber: r.classRollNumber!,
    examFormFillupId: r.examFormFillupId,
  });

  let created = 0;
  let updated = 0;

  try {
    await db.transaction(async (tx) => {
      const targetStudentIds = [...new Set(toInsert.map((r) => r.studentId))];

      const existing = await tx
        .select({
          id: promotionModel.id,
          studentId: promotionModel.studentId,
        })
        .from(promotionModel)
        .where(
          and(
            eq(promotionModel.sessionId, params.toSessionId),
            eq(promotionModel.classId, params.toClassId),
            inArray(promotionModel.studentId, targetStudentIds),
          ),
        )
        .orderBy(desc(promotionModel.id));

      const promotionIdByStudent = new Map<number, number>();
      for (const row of existing) {
        if (row.studentId != null && !promotionIdByStudent.has(row.studentId)) {
          promotionIdByStudent.set(row.studentId, row.id!);
        }
      }

      const toCreate = toInsert.filter(
        (r) => !promotionIdByStudent.has(r.studentId),
      );
      const toUpsert = toInsert.filter((r) =>
        promotionIdByStudent.has(r.studentId),
      );

      if (toCreate.length > 0) {
        await tx.insert(promotionModel).values(toCreate.map(promotionPayload));
        created = toCreate.length;
      }

      const now = new Date();
      for (const r of toUpsert) {
        const id = promotionIdByStudent.get(r.studentId)!;
        await tx
          .update(promotionModel)
          .set({
            ...promotionPayload(r),
            updatedAt: now,
          })
          .where(eq(promotionModel.id, id));
        updated++;
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    emitSemesterPromotionProgress(
      progressUserId,
      `Promotion failed: ${msg}`,
      100,
      "error",
      { error: msg },
    );
    throw e;
  }

  emitSemesterPromotionProgress(
    progressUserId,
    `Done: ${created} inserted, ${updated} updated.`,
    100,
    "completed",
    { created, updated, skippedCount: skipped.length },
  );

  return { created, updated, skipped };
}
