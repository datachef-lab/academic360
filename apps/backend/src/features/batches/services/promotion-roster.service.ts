import { db } from "@/db/index.js";
import {
  affiliationModel,
  classModel,
  examFormFillupModel,
  programCourseModel,
  promotionBuilderClauseClassMappingModel,
  promotionBuilderClauseMappingModel,
  promotionBuilderModel,
  promotionClauseClassMappingModel,
  promotionClauseModel,
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

import { primaryPromotionClause } from "../default-promotion-clause-data.js";

export type PromotionRosterBucket =
  | "all"
  | "eligible"
  | "ineligible"
  | "inactive"
  | "promoted";

export type PromotionRosterSort = "uid" | "rollNumber" | "registrationNumber";

export type PromotionRosterParams = {
  academicYearId: number;
  fromSessionId: number;
  fromClassId: number;
  toSessionId: number;
  toClassId: number;
  affiliationId?: number;
  regulationTypeId?: number;
  programCourseId?: number;
  shiftId?: number;
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
  ];
  if (params.affiliationId != null) {
    parts.push(eq(programCourseModel.affiliationId, params.affiliationId));
  }
  if (params.regulationTypeId != null) {
    parts.push(
      eq(programCourseModel.regulationTypeId, params.regulationTypeId),
    );
  }
  if (params.programCourseId != null) {
    parts.push(eq(pFrom.programCourseId, params.programCourseId));
  }
  if (params.shiftId != null) {
    parts.push(eq(pFrom.shiftId, params.shiftId));
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

/** Inactive / suspended — not eligible for promotion workflow in this step. */
const sqlInactive = sql`(
  COALESCE(${userModel.isSuspended}, false) = true
  OR COALESCE(${studentModel.active}, true) = false
  OR COALESCE(${userModel.isActive}, true) = false
)`;

const sqlPromoted = sql`${pTo.id} IS NOT NULL`;

// ---------------------------------------------------------------------------
// Pre-computed builder policy — replaces per-row correlated subqueries
// ---------------------------------------------------------------------------

type ConditionalBuilderReqs = {
  requiredClassIds: number[];
  requiresSourceFormFillup: boolean;
};

type PrecomputedBuilderPolicy = {
  allBuilderAffIds: number[];
  autoPromoteAffIds: number[];
  conditionalReqs: Map<number, ConditionalBuilderReqs>;
};

/**
 * Fetches builder configuration for the given target class in a few small queries
 * (typically 2-4 rows total). The result drives a flat CASE expression instead of
 * the old deeply-nested correlated subqueries that ran per row.
 */
async function precomputeBuilderPolicy(
  toClassId: number,
): Promise<PrecomputedBuilderPolicy> {
  const formClause = primaryPromotionClause.Form_Fill_Up_Status;

  const builders = await db
    .select({
      id: promotionBuilderModel.id,
      affiliationId: promotionBuilderModel.affiliationId,
      logic: promotionBuilderModel.logic,
    })
    .from(promotionBuilderModel)
    .where(
      and(
        eq(promotionBuilderModel.targetClassId, toClassId),
        eq(promotionBuilderModel.isActive, true),
      ),
    );

  const allBuilderAffIds = [...new Set(builders.map((b) => b.affiliationId))];
  const autoPromoteAffIds = [
    ...new Set(
      builders
        .filter((b) => b.logic === "AUTO_PROMOTE")
        .map((b) => b.affiliationId),
    ),
  ];

  const conditionalReqs = new Map<number, ConditionalBuilderReqs>();
  const conditionalBuilders = builders.filter(
    (b) =>
      b.logic === "CONDITIONAL" && !autoPromoteAffIds.includes(b.affiliationId),
  );

  for (const cb of conditionalBuilders) {
    if (conditionalReqs.has(cb.affiliationId)) continue;

    const rules = await db
      .select({
        ruleId: promotionBuilderClauseMappingModel.id,
        clauseName: promotionClauseModel.name,
        operator: promotionBuilderClauseMappingModel.operator,
      })
      .from(promotionBuilderClauseMappingModel)
      .innerJoin(
        promotionClauseModel,
        eq(
          promotionClauseModel.id,
          promotionBuilderClauseMappingModel.promotionClauseId,
        ),
      )
      .where(eq(promotionBuilderClauseMappingModel.promotionBuilderId, cb.id));

    const classIds: number[] = [];
    let sourceRequired = false;

    for (const rule of rules) {
      if (rule.clauseName !== formClause || rule.operator !== "EQUALS")
        continue;

      const classMappings = await db
        .select({ classId: promotionClauseClassMappingModel.classId })
        .from(promotionBuilderClauseClassMappingModel)
        .innerJoin(
          promotionClauseClassMappingModel,
          eq(
            promotionClauseClassMappingModel.id,
            promotionBuilderClauseClassMappingModel.promotionClauseClassId,
          ),
        )
        .where(
          eq(
            promotionBuilderClauseClassMappingModel.promotionBuilderClauseId,
            rule.ruleId,
          ),
        );

      if (classMappings.length > 0) {
        for (const cm of classMappings) classIds.push(cm.classId);
      } else {
        sourceRequired = true;
      }
    }

    conditionalReqs.set(cb.affiliationId, {
      requiredClassIds: [...new Set(classIds)],
      requiresSourceFormFillup: sourceRequired,
    });
  }

  return { allBuilderAffIds, autoPromoteAffIds, conditionalReqs };
}

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
          SELECT count(DISTINCT ${promotionModel.classId})::int
          FROM ${promotionModel}
          INNER JOIN ${examFormFillupModel}
            ON ${examFormFillupModel.promotionId} = ${promotionModel.id}
          WHERE ${promotionModel.studentId} = ${pFrom.studentId}
            AND ${promotionModel.programCourseId} = ${pFrom.programCourseId}
            AND ${promotionModel.shiftId} = ${pFrom.shiftId}
            AND ${promotionModel.classId} IN (${inList})
            AND ${examFormFillupModel.status} = 'COMPLETED'
        ) = ${reqCount}`,
      );
    }

    if (reqs.requiresSourceFormFillup) {
      checks.push(
        sql`EXISTS (
          SELECT 1 FROM ${examFormFillupModel}
          WHERE ${examFormFillupModel.promotionId} = ${pFrom.id}
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
    case "inactive":
      return sql`(${sqlInactive}) AND NOT (${sqlPromoted})`;
    case "ineligible":
      return sql`NOT (${sqlPromoted}) AND NOT (${sqlInactive}) AND (${sqlPolicyIneligible(policy)})`;
    case "eligible":
      return sql`NOT (${sqlPromoted}) AND NOT (${sqlInactive}) AND NOT (${sqlPolicyIneligible(policy)})`;
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
  bucket: "eligible" | "ineligible" | "inactive" | "promoted";
};

function rowBucketExpr(policy: PrecomputedBuilderPolicy) {
  return sql<PromotionRosterRow["bucket"]>`
    CASE
      WHEN ${sqlPromoted} THEN 'promoted'
      WHEN ${sqlInactive} THEN 'inactive'
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
  | "affiliationId"
  | "regulationTypeId"
  | "programCourseId"
  | "shiftId"
  | "q"
>;

export type PromotionRosterBucketCounts = {
  all: number;
  eligible: number;
  ineligible: number;
  inactive: number;
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
          when not (${sqlPromoted}) and not (${sqlInactive}) and not (${policyInel}) then 1
          else 0 end), 0) as int)`,
      ineligible: sql<number>`cast(coalesce(sum(case
          when not (${sqlPromoted}) and not (${sqlInactive}) and (${policyInel}) then 1
          else 0 end), 0) as int)`,
      inactive: sql<number>`cast(coalesce(sum(case
          when (${sqlInactive}) and not (${sqlPromoted}) then 1
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
    inactive: agg?.inactive ?? 0,
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
          when not (${sqlPromoted}) and not (${sqlInactive}) and not (${policyInel}) then 1
          else 0 end), 0) as int)`,
            ineligible: sql<number>`cast(coalesce(sum(case
          when not (${sqlPromoted}) and not (${sqlInactive}) and (${policyInel}) then 1
          else 0 end), 0) as int)`,
            inactive: sql<number>`cast(coalesce(sum(case
          when (${sqlInactive}) and not (${sqlPromoted}) then 1
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
            inactive: agg.inactive ?? 0,
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
  | "affiliationId"
  | "regulationTypeId"
  | "programCourseId"
  | "shiftId"
> & { studentIds: number[] };

export type BulkSemesterPromoteSkipped = { studentId: number; reason: string };

export type BulkSemesterPromoteResult = {
  created: number;
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
    return { created: 0, skipped: [] };
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
    affiliationId: params.affiliationId,
    regulationTypeId: params.regulationTypeId,
    programCourseId: params.programCourseId,
    shiftId: params.shiftId,
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
      skipped: uniqueIds.map((studentId) => ({
        studentId,
        reason: "Target session not found for this academic year.",
      })),
    };
  }

  const joiningDate = joiningDateFromSession(toSessionRow.from!);

  const whereBulk = and(base, inArray(studentModel.id, uniqueIds));

  const candidateRows = await db
    .select({
      studentId: studentModel.id,
      bucket: rowBucketExpr(policy),
      programCourseId: pFrom.programCourseId,
      shiftId: pFrom.shiftId,
      sectionId: pFrom.sectionId,
      classRollNumber: pFrom.classRollNumber,
      rollNumber: pFrom.rollNumber,
      rollNumberSI: pFrom.rollNumberSI,
      examNumber: pFrom.examNumber,
      examSerialNumber: pFrom.examSerialNumber,
      promotionStatusId: pFrom.promotionStatusId,
      boardResultStatusId: pFrom.boardResultStatusId,
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
          : row.bucket === "inactive"
            ? "Student account is inactive or suspended."
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
      { created: 0, skippedCount: skipped.length },
    );
    return { created: 0, skipped };
  }

  emitSemesterPromotionProgress(
    progressUserId,
    `Creating ${toInsert.length} promotion record(s)…`,
    55,
    "in_progress",
    { creating: toInsert.length },
  );

  try {
    await db.transaction(async (tx) => {
      await tx.insert(promotionModel).values(
        toInsert.map((r) => ({
          studentId: r.studentId,
          programCourseId: r.programCourseId!,
          sessionId: params.toSessionId,
          shiftId: r.shiftId!,
          classId: params.toClassId,
          sectionId: r.sectionId,
          dateOfJoining: joiningDate,
          classRollNumber: r.classRollNumber!,
          rollNumber: r.rollNumber,
          rollNumberSI: r.rollNumberSI,
          examNumber: r.examNumber,
          examSerialNumber: r.examSerialNumber,
          promotionStatusId: r.promotionStatusId!,
          boardResultStatusId: r.boardResultStatusId,
          isAlumni: false,
        })),
      );
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
    `Promoted ${toInsert.length} student(s).`,
    100,
    "completed",
    { created: toInsert.length, skippedCount: skipped.length },
  );

  return { created: toInsert.length, skipped };
}
