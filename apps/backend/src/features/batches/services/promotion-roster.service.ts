import { db } from "@/db/index.js";
import {
  boardResultStatusModel,
  classModel,
  programCourseModel,
  promotionModel,
  sessionModel,
  shiftModel,
  studentModel,
  userModel,
} from "@repo/db/schemas";
import { alias } from "drizzle-orm/pg-core";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

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

const sqlIneligibleBoard = sql`${boardResultStatusModel.result} = 'FAIL'`;

function bucketPredicate(bucket: PromotionRosterBucket): SQL | undefined {
  switch (bucket) {
    case "all":
      return undefined;
    case "promoted":
      return sqlPromoted;
    case "inactive":
      return sql`(${sqlInactive}) AND NOT (${sqlPromoted})`;
    case "ineligible":
      return sql`NOT (${sqlPromoted}) AND NOT (${sqlInactive}) AND (${sqlIneligibleBoard})`;
    case "eligible":
      return sql`NOT (${sqlPromoted}) AND NOT (${sqlInactive}) AND NOT (${sqlIneligibleBoard})`;
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
  programCourseName: string | null;
  shiftName: string;
  fromClassName: string;
  toClassName: string;
  bucket: "eligible" | "ineligible" | "inactive" | "promoted";
};

function rowBucketExpr() {
  return sql<PromotionRosterRow["bucket"]>`
    CASE
      WHEN ${sqlPromoted} THEN 'promoted'
      WHEN ${sqlInactive} THEN 'inactive'
      WHEN ${sqlIneligibleBoard} THEN 'ineligible'
      ELSE 'eligible'
    END
  `;
}

export async function getPromotionRosterPage(
  params: PromotionRosterParams,
): Promise<{
  content: PromotionRosterRow[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  counts: {
    all: number;
    eligible: number;
    ineligible: number;
    inactive: number;
    promoted: number;
  };
}> {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const base = baseFilters(params);
  const bucketPart = bucketPredicate(params.bucket);
  const whereAll = bucketPart ? and(base, bucketPart) : base;

  const order =
    params.sortDir === "desc"
      ? desc(sortColumn(params.sortBy))
      : asc(sortColumn(params.sortBy));

  const rows = await db
    .select({
      studentId: studentModel.id,
      promotionId: pFrom.id,
      uid: studentModel.uid,
      rollNumber: studentModel.rollNumber,
      registrationNumber: studentModel.registrationNumber,
      studentName: userModel.name,
      programCourseName: programCourseModel.name,
      shiftName: shiftModel.name,
      fromClassName: classFrom.name,
      toClassName: classTo.name,
      bucket: rowBucketExpr(),
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
      boardResultStatusModel,
      eq(boardResultStatusModel.id, pFrom.boardResultStatusId),
    )
    .leftJoin(
      pTo,
      and(
        eq(pTo.studentId, pFrom.studentId),
        eq(pTo.sessionId, params.toSessionId),
        eq(pTo.classId, params.toClassId),
      ),
    )
    .where(whereAll)
    .orderBy(order)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ totalElements }] = await db
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
      boardResultStatusModel,
      eq(boardResultStatusModel.id, pFrom.boardResultStatusId),
    )
    .leftJoin(
      pTo,
      and(
        eq(pTo.studentId, pFrom.studentId),
        eq(pTo.sessionId, params.toSessionId),
        eq(pTo.classId, params.toClassId),
      ),
    )
    .where(whereAll);

  const [{ allCount }] = await db
    .select({ allCount: count() })
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
      boardResultStatusModel,
      eq(boardResultStatusModel.id, pFrom.boardResultStatusId),
    )
    .leftJoin(
      pTo,
      and(
        eq(pTo.studentId, pFrom.studentId),
        eq(pTo.sessionId, params.toSessionId),
        eq(pTo.classId, params.toClassId),
      ),
    )
    .where(base);

  const [agg] = await db
    .select({
      eligible: sql<number>`cast(count(*) filter (where NOT (${sqlPromoted}) AND NOT (${sqlInactive}) AND NOT (${sqlIneligibleBoard})) as int)`,
      ineligible: sql<number>`cast(count(*) filter (where NOT (${sqlPromoted}) AND NOT (${sqlInactive}) AND (${sqlIneligibleBoard})) as int)`,
      inactive: sql<number>`cast(count(*) filter (where (${sqlInactive}) AND NOT (${sqlPromoted})) as int)`,
      promoted: sql<number>`cast(count(*) filter (where (${sqlPromoted})) as int)`,
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
      boardResultStatusModel,
      eq(boardResultStatusModel.id, pFrom.boardResultStatusId),
    )
    .leftJoin(
      pTo,
      and(
        eq(pTo.studentId, pFrom.studentId),
        eq(pTo.sessionId, params.toSessionId),
        eq(pTo.classId, params.toClassId),
      ),
    )
    .where(base);

  const total = Number(totalElements);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    content: rows as PromotionRosterRow[],
    page,
    pageSize,
    totalElements: total,
    totalPages,
    counts: {
      all: Number(allCount),
      eligible: agg?.eligible ?? 0,
      ineligible: agg?.ineligible ?? 0,
      inactive: agg?.inactive ?? 0,
      promoted: agg?.promoted ?? 0,
    },
  };
}
