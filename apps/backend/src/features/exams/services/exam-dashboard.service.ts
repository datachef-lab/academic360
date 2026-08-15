import { db } from "@/db";
import {
  classModel,
  examCandidateModel,
  examFormFillupModel,
  examGroupModel,
  examModel,
  examRoomModel,
  examSubjectModel,
  examSubjectTypeModel,
  examTypeModel,
  floorModel,
  paperModel,
  programCourseModel,
  promotionModel,
  roomModel,
  sessionModel,
  shiftModel,
  subjectModel,
  subjectTypeModel,
  tempAdmitCardDistributionsModel,
  userModel,
} from "@repo/db/schemas";
import {
  and,
  countDistinct,
  desc,
  eq,
  gte,
  isNotNull,
  lte,
  sql,
  SQL,
} from "drizzle-orm";

export type ExamDashboardFilters = {
  academicYearId?: number;
  examTypeId?: number;
  classId?: number;
  dateFrom?: Date;
  dateTo?: Date;
};

export type ExamDashboardStats = {
  examGroups: number;
  exams: number;
  papersScheduled: number;
  candidates: number;
  distinctStudents: number;
  candidatesSeated: number;
  admitCardsDownloaded: number;
  /** 0–100, of candidates in scope that have downloaded their admit card. */
  downloadRate: number;
  physicalDistributions: number;
  formFillupTotal: number;
  formFillupCompleted: number;
  promotionsFormSubmitted: number;
  upcomingPapers30d: number;
  roomsTotal: number;
  floorsTotal: number;
  roomsInUse: number;
  totalRoomCapacity: number;

  papersByMonth: Array<{ month: string; papers: number; exams: number }>;
  downloadsByDay: Array<{ day: string; count: number }>;
  distributionsByDay: Array<{ day: string; count: number }>;
  formFillupByDay: Array<{ day: string; count: number }>;

  candidatesByProgramCourse: Array<{ name: string; count: number }>;
  candidatesByShift: Array<{ name: string; count: number }>;
  candidatesBySubjectType: Array<{ name: string; count: number }>;
  examsByType: Array<{ name: string; shortName: string | null; count: number }>;
  formFillupByProgramCourse: Array<{
    name: string;
    completed: number;
    pending: number;
  }>;

  upcomingPapers: Array<{
    examSubjectId: number;
    subjectName: string;
    paperCode: string | null;
    examGroupName: string | null;
    className: string | null;
    startTime: string;
    endTime: string;
    candidateCount: number;
  }>;
  /** One row per exam group: feeds both the admit-card and seating tables. */
  groupStats: Array<{
    examGroupId: number;
    name: string;
    commencementDate: string;
    candidates: number;
    downloaded: number;
    seated: number;
    rooms: number;
    admitCardStart: string | null;
    admitCardLast: string | null;
  }>;
  topDistributors: Array<{ name: string; count: number }>;
};

/** Dimension filters live on the exam row; each time series is additionally
 *  scoped by its own timestamp column (subject start, download, distribution,
 *  form fill-up) so a date range means "activity in this window". */
function examDimensionWhere(filters: ExamDashboardFilters): SQL | undefined {
  const clauses: SQL[] = [];
  if (filters.academicYearId)
    clauses.push(eq(examModel.academicYearId, filters.academicYearId));
  if (filters.examTypeId)
    clauses.push(eq(examModel.examTypeId, filters.examTypeId));
  if (filters.classId) clauses.push(eq(examModel.classId, filters.classId));
  return clauses.length ? and(...clauses) : undefined;
}

function rangeWhere(
  column: SQL.Aliased | any,
  filters: ExamDashboardFilters,
): SQL | undefined {
  const clauses: SQL[] = [];
  if (filters.dateFrom) clauses.push(gte(column, filters.dateFrom));
  if (filters.dateTo) clauses.push(lte(column, filters.dateTo));
  return clauses.length ? and(...clauses) : undefined;
}

const num = (v: unknown) => Number(v ?? 0);

export async function getExamDashboardStats(
  filters: ExamDashboardFilters = {},
): Promise<ExamDashboardStats> {
  const dimWhere = examDimensionWhere(filters);
  const subjectRange = rangeWhere(examSubjectModel.startTime, filters);
  const downloadRange = rangeWhere(
    examCandidateModel.admitCardDownloadedAt,
    filters,
  );
  const distributionRange = rangeWhere(
    tempAdmitCardDistributionsModel.createdAt,
    filters,
  );
  const fillupRange = rangeWhere(examFormFillupModel.createdAt, filters);

  const formFillupWhere = and(
    filters.classId
      ? eq(examFormFillupModel.classId, filters.classId)
      : undefined,
    filters.academicYearId
      ? eq(sessionModel.academicYearId, filters.academicYearId)
      : undefined,
    fillupRange,
  );

  // ── Batch 1: headline totals ─────────────────────────────────────────────
  const [
    [scheduleTotals],
    [candidateTotals],
    [distributionTotals],
    [fillupTotals],
    [promotionTotals],
    [upcomingTotals],
    [roomTotals],
    [floorTotals],
    [roomsInUseTotals],
  ] = await Promise.all([
    db
      .select({
        examGroups: countDistinct(examModel.examGroupId),
        exams: countDistinct(examModel.id),
        papers: countDistinct(examSubjectModel.id),
      })
      .from(examModel)
      .leftJoin(examSubjectModel, eq(examSubjectModel.examId, examModel.id))
      .where(and(dimWhere, subjectRange)),
    db
      .select({
        candidates: sql<number>`COUNT(*)`.mapWith(Number),
        distinctStudents: countDistinct(promotionModel.studentId),
        seated:
          sql<number>`COUNT(*) FILTER (WHERE ${examCandidateModel.examRoomId} IS NOT NULL)`.mapWith(
            Number,
          ),
        downloaded:
          sql<number>`COUNT(*) FILTER (WHERE ${examCandidateModel.admitCardDownloadedAt} IS NOT NULL)`.mapWith(
            Number,
          ),
      })
      .from(examCandidateModel)
      .innerJoin(examModel, eq(examCandidateModel.examId, examModel.id))
      .innerJoin(
        examSubjectModel,
        eq(examCandidateModel.examSubjectId, examSubjectModel.id),
      )
      .leftJoin(
        promotionModel,
        eq(examCandidateModel.promotionId, promotionModel.id),
      )
      .where(and(dimWhere, subjectRange)),
    db
      .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(tempAdmitCardDistributionsModel)
      .where(distributionRange),
    db
      .select({
        total: sql<number>`COUNT(*)`.mapWith(Number),
        completed:
          sql<number>`COUNT(*) FILTER (WHERE ${examFormFillupModel.status} = 'COMPLETED')`.mapWith(
            Number,
          ),
      })
      .from(examFormFillupModel)
      .leftJoin(
        sessionModel,
        eq(examFormFillupModel.sessionId, sessionModel.id),
      )
      .where(formFillupWhere),
    db
      .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(promotionModel)
      .where(
        and(
          eq(promotionModel.isExamFormSubmitted, true),
          filters.classId
            ? eq(promotionModel.classId, filters.classId)
            : undefined,
          rangeWhere(promotionModel.examFormSubmissionTimeStamp, filters),
        ),
      ),
    db
      .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(examSubjectModel)
      .innerJoin(examModel, eq(examSubjectModel.examId, examModel.id))
      .where(
        and(
          dimWhere,
          gte(examSubjectModel.startTime, sql`NOW()`),
          lte(examSubjectModel.startTime, sql`NOW() + INTERVAL '30 days'`),
        ),
      ),
    db
      .select({
        count: sql<number>`COUNT(*)`.mapWith(Number),
        capacity:
          sql<number>`COALESCE(SUM(${roomModel.numberOfBenches} * ${roomModel.maxStudentsPerBench}), 0)`.mapWith(
            Number,
          ),
      })
      .from(roomModel)
      .where(eq(roomModel.isActive, true)),
    db
      .select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(floorModel),
    db
      .select({ count: countDistinct(examRoomModel.roomId) })
      .from(examRoomModel)
      .innerJoin(examModel, eq(examRoomModel.examId, examModel.id))
      .where(dimWhere),
  ]);

  // ── Batch 2: series, groupings and tables ────────────────────────────────
  const monthExpr = sql<string>`TO_CHAR(${examSubjectModel.startTime}, 'YYYY-MM')`;
  const downloadDayExpr = sql<string>`TO_CHAR(${examCandidateModel.admitCardDownloadedAt}, 'YYYY-MM-DD')`;
  const distributionDayExpr = sql<string>`TO_CHAR(${tempAdmitCardDistributionsModel.createdAt}, 'YYYY-MM-DD')`;
  const fillupDayExpr = sql<string>`TO_CHAR(${examFormFillupModel.createdAt}, 'YYYY-MM-DD')`;

  const [
    papersByMonthRaw,
    downloadsByDayRaw,
    distributionsByDayRaw,
    formFillupByDayRaw,
    candidatesByProgramCourseRaw,
    candidatesByShiftRaw,
    candidatesBySubjectTypeRaw,
    examsByTypeRaw,
    formFillupByProgramCourseRaw,
    upcomingPapersRaw,
    groupStatsRaw,
    roomsByGroupRaw,
    topDistributorsRaw,
  ] = await Promise.all([
    db
      .select({
        month: monthExpr,
        papers: sql<number>`COUNT(*)`.mapWith(Number),
        exams: countDistinct(examSubjectModel.examId),
      })
      .from(examSubjectModel)
      .innerJoin(examModel, eq(examSubjectModel.examId, examModel.id))
      .where(and(dimWhere, subjectRange))
      .groupBy(monthExpr)
      .orderBy(monthExpr),
    db
      .select({
        day: downloadDayExpr,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(examCandidateModel)
      .innerJoin(examModel, eq(examCandidateModel.examId, examModel.id))
      .where(
        and(
          dimWhere,
          isNotNull(examCandidateModel.admitCardDownloadedAt),
          downloadRange,
        ),
      )
      .groupBy(downloadDayExpr)
      .orderBy(downloadDayExpr),
    db
      .select({
        day: distributionDayExpr,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(tempAdmitCardDistributionsModel)
      .where(distributionRange)
      .groupBy(distributionDayExpr)
      .orderBy(distributionDayExpr),
    db
      .select({
        day: fillupDayExpr,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(examFormFillupModel)
      .leftJoin(
        sessionModel,
        eq(examFormFillupModel.sessionId, sessionModel.id),
      )
      .where(formFillupWhere)
      .groupBy(fillupDayExpr)
      .orderBy(fillupDayExpr),
    db
      .select({
        name: sql<string>`COALESCE(${programCourseModel.name}, 'Unknown')`,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(examCandidateModel)
      .innerJoin(examModel, eq(examCandidateModel.examId, examModel.id))
      .innerJoin(
        promotionModel,
        eq(examCandidateModel.promotionId, promotionModel.id),
      )
      .leftJoin(
        programCourseModel,
        eq(promotionModel.programCourseId, programCourseModel.id),
      )
      .where(dimWhere)
      .groupBy(sql`COALESCE(${programCourseModel.name}, 'Unknown')`)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10),
    db
      .select({
        name: sql<string>`COALESCE(${shiftModel.name}, 'Unknown')`,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(examCandidateModel)
      .innerJoin(examModel, eq(examCandidateModel.examId, examModel.id))
      .innerJoin(
        promotionModel,
        eq(examCandidateModel.promotionId, promotionModel.id),
      )
      .leftJoin(shiftModel, eq(promotionModel.shiftId, shiftModel.id))
      .where(dimWhere)
      .groupBy(sql`COALESCE(${shiftModel.name}, 'Unknown')`)
      .orderBy(desc(sql`COUNT(*)`)),
    db
      .select({
        name: sql<string>`COALESCE(${subjectTypeModel.name}, 'Unknown')`,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(examCandidateModel)
      .innerJoin(examModel, eq(examCandidateModel.examId, examModel.id))
      .innerJoin(
        examSubjectTypeModel,
        eq(examCandidateModel.examSubjectTypeId, examSubjectTypeModel.id),
      )
      .leftJoin(
        subjectTypeModel,
        eq(examSubjectTypeModel.subjectTypeId, subjectTypeModel.id),
      )
      .where(dimWhere)
      .groupBy(sql`COALESCE(${subjectTypeModel.name}, 'Unknown')`)
      .orderBy(desc(sql`COUNT(*)`)),
    db
      .select({
        name: examTypeModel.name,
        shortName: examTypeModel.shortName,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(examModel)
      .innerJoin(examTypeModel, eq(examModel.examTypeId, examTypeModel.id))
      .where(dimWhere)
      .groupBy(examTypeModel.name, examTypeModel.shortName)
      .orderBy(desc(sql`COUNT(*)`)),
    db
      .select({
        name: sql<string>`COALESCE(${programCourseModel.name}, 'Unknown')`,
        completed:
          sql<number>`COUNT(*) FILTER (WHERE ${examFormFillupModel.status} = 'COMPLETED')`.mapWith(
            Number,
          ),
        pending:
          sql<number>`COUNT(*) FILTER (WHERE ${examFormFillupModel.status} = 'PENDING')`.mapWith(
            Number,
          ),
      })
      .from(examFormFillupModel)
      .leftJoin(
        sessionModel,
        eq(examFormFillupModel.sessionId, sessionModel.id),
      )
      .leftJoin(
        programCourseModel,
        eq(examFormFillupModel.programCourseId, programCourseModel.id),
      )
      .where(formFillupWhere)
      .groupBy(sql`COALESCE(${programCourseModel.name}, 'Unknown')`)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(12),
    db
      .select({
        examSubjectId: examSubjectModel.id,
        subjectName: subjectModel.name,
        paperCode: paperModel.code,
        examGroupName: examGroupModel.name,
        className: classModel.name,
        startTime: examSubjectModel.startTime,
        endTime: examSubjectModel.endTime,
        candidateCount:
          sql<number>`(SELECT COUNT(*) FROM ${examCandidateModel} ec WHERE ec.exam_subject_id_fk = ${examSubjectModel.id})`.mapWith(
            Number,
          ),
      })
      .from(examSubjectModel)
      .innerJoin(examModel, eq(examSubjectModel.examId, examModel.id))
      .innerJoin(subjectModel, eq(examSubjectModel.subjectId, subjectModel.id))
      .leftJoin(paperModel, eq(examSubjectModel.paperId, paperModel.id))
      .leftJoin(examGroupModel, eq(examModel.examGroupId, examGroupModel.id))
      .leftJoin(classModel, eq(examModel.classId, classModel.id))
      .where(and(dimWhere, gte(examSubjectModel.startTime, sql`NOW()`)))
      .orderBy(examSubjectModel.startTime)
      .limit(10),
    db
      .select({
        examGroupId: examGroupModel.id,
        name: examGroupModel.name,
        commencementDate: examGroupModel.examCommencementDate,
        candidates: sql<number>`COUNT(*)`.mapWith(Number),
        downloaded:
          sql<number>`COUNT(*) FILTER (WHERE ${examCandidateModel.admitCardDownloadedAt} IS NOT NULL)`.mapWith(
            Number,
          ),
        seated:
          sql<number>`COUNT(*) FILTER (WHERE ${examCandidateModel.examRoomId} IS NOT NULL)`.mapWith(
            Number,
          ),
        admitCardStart: sql<
          string | null
        >`MIN(${examModel.admitCardStartDownloadDate})`,
        admitCardLast: sql<
          string | null
        >`MAX(${examModel.admitCardLastDownloadDate})`,
      })
      .from(examCandidateModel)
      .innerJoin(examModel, eq(examCandidateModel.examId, examModel.id))
      .innerJoin(examGroupModel, eq(examModel.examGroupId, examGroupModel.id))
      .where(dimWhere)
      .groupBy(
        examGroupModel.id,
        examGroupModel.name,
        examGroupModel.examCommencementDate,
      )
      .orderBy(desc(examGroupModel.examCommencementDate)),
    db
      .select({
        examGroupId: examGroupModel.id,
        rooms: countDistinct(examRoomModel.roomId),
      })
      .from(examRoomModel)
      .innerJoin(examModel, eq(examRoomModel.examId, examModel.id))
      .innerJoin(examGroupModel, eq(examModel.examGroupId, examGroupModel.id))
      .where(dimWhere)
      .groupBy(examGroupModel.id),
    db
      .select({
        name: sql<string>`COALESCE(${userModel.name}, 'Unknown')`,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(tempAdmitCardDistributionsModel)
      .leftJoin(
        userModel,
        eq(tempAdmitCardDistributionsModel.distributedByUserId, userModel.id),
      )
      .where(distributionRange)
      .groupBy(sql`COALESCE(${userModel.name}, 'Unknown')`)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(8),
  ]);

  const roomsByGroup = new Map(
    roomsByGroupRaw.map((r) => [r.examGroupId, num(r.rooms)]),
  );
  const candidates = num(candidateTotals?.candidates);
  const downloaded = num(candidateTotals?.downloaded);

  return {
    examGroups: num(scheduleTotals?.examGroups),
    exams: num(scheduleTotals?.exams),
    papersScheduled: num(scheduleTotals?.papers),
    candidates,
    distinctStudents: num(candidateTotals?.distinctStudents),
    candidatesSeated: num(candidateTotals?.seated),
    admitCardsDownloaded: downloaded,
    downloadRate:
      candidates > 0 ? Math.round((downloaded / candidates) * 100) : 0,
    physicalDistributions: num(distributionTotals?.count),
    formFillupTotal: num(fillupTotals?.total),
    formFillupCompleted: num(fillupTotals?.completed),
    promotionsFormSubmitted: num(promotionTotals?.count),
    upcomingPapers30d: num(upcomingTotals?.count),
    roomsTotal: num(roomTotals?.count),
    totalRoomCapacity: num(roomTotals?.capacity),
    floorsTotal: num(floorTotals?.count),
    roomsInUse: num(roomsInUseTotals?.count),

    papersByMonth: papersByMonthRaw.map((r) => ({
      month: r.month,
      papers: num(r.papers),
      exams: num(r.exams),
    })),
    downloadsByDay: downloadsByDayRaw.map((r) => ({
      day: r.day,
      count: num(r.count),
    })),
    distributionsByDay: distributionsByDayRaw.map((r) => ({
      day: r.day,
      count: num(r.count),
    })),
    formFillupByDay: formFillupByDayRaw.map((r) => ({
      day: r.day,
      count: num(r.count),
    })),

    candidatesByProgramCourse: candidatesByProgramCourseRaw.map((r) => ({
      name: r.name,
      count: num(r.count),
    })),
    candidatesByShift: candidatesByShiftRaw.map((r) => ({
      name: r.name,
      count: num(r.count),
    })),
    candidatesBySubjectType: candidatesBySubjectTypeRaw.map((r) => ({
      name: r.name,
      count: num(r.count),
    })),
    examsByType: examsByTypeRaw.map((r) => ({
      name: r.name,
      shortName: r.shortName,
      count: num(r.count),
    })),
    formFillupByProgramCourse: formFillupByProgramCourseRaw.map((r) => ({
      name: r.name,
      completed: num(r.completed),
      pending: num(r.pending),
    })),

    upcomingPapers: upcomingPapersRaw.map((r) => ({
      examSubjectId: r.examSubjectId,
      subjectName: r.subjectName,
      paperCode: r.paperCode,
      examGroupName: r.examGroupName,
      className: r.className,
      startTime:
        r.startTime instanceof Date
          ? r.startTime.toISOString()
          : String(r.startTime),
      endTime:
        r.endTime instanceof Date ? r.endTime.toISOString() : String(r.endTime),
      candidateCount: num(r.candidateCount),
    })),
    groupStats: groupStatsRaw.map((r) => ({
      examGroupId: r.examGroupId,
      name: r.name,
      commencementDate: String(r.commencementDate),
      candidates: num(r.candidates),
      downloaded: num(r.downloaded),
      seated: num(r.seated),
      rooms: roomsByGroup.get(r.examGroupId) ?? 0,
      admitCardStart: r.admitCardStart ? String(r.admitCardStart) : null,
      admitCardLast: r.admitCardLast ? String(r.admitCardLast) : null,
    })),
    topDistributors: topDistributorsRaw.map((r) => ({
      name: r.name,
      count: num(r.count),
    })),
  };
}
