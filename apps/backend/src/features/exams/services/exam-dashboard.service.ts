import { db } from "@/db";
import {
  classModel,
  examCandidateModel,
  examFormFillupModel,
  examGroupModel,
  examModel,
  examProgramCourseModel,
  examRoomModel,
  examSubjectModel,
  examSubjectTypeModel,
  examTypeModel,
  floorModel,
  paperModel,
  programCourseModel,
  promotionModel,
  promotionStatusModel,
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
  inArray,
  isNotNull,
  lte,
  sql,
  SQL,
} from "drizzle-orm";

export type ExamDashboardFilters = {
  academicYearIds?: number[];
  examTypeIds?: number[];
  classIds?: number[];
  shiftIds?: number[];
  programCourseIds?: number[];
  subjectTypeIds?: number[];
  dateFrom?: Date;
  dateTo?: Date;
};

export type ExamDashboardStats = {
  // Headline totals — student-centric: the roster stores one row per
  // student × paper, but staff think in students, so every user-facing
  // number is COUNT(DISTINCT student) unless it is explicitly about rows.
  examGroups: number;
  exams: number;
  papersScheduled: number;
  candidateRows: number;
  students: number;
  studentsSeated: number;
  studentsDownloaded: number;
  /** 0–100, of students in scope that downloaded their admit card. */
  downloadRate: number;
  physicalDistributions: number;
  upcomingPapers30d: number;
  pendingAllotmentCount: number;
  /** Exam cycles bucketed by schedule: a group with a paper today is
   *  "today"; else future papers → "upcoming"; else all papers past →
   *  "completed". Groups with no scheduled papers fall in none. */
  cycleStatus: { today: number; upcoming: number; completed: number };
  roomsTotal: number;
  floorsTotal: number;
  roomsInUse: number;
  floorsInUse: number;
  totalRoomCapacity: number;

  // Form fill-up reconciliation — two independent sources:
  //  - staff bulk upload → exam_form_fillup rows
  //  - student console  → promotions.is_exam_form_submitted
  // linked = students whose promotion carries exam_form_fillup_id_fk.
  formFillupTotal: number;
  formFillupCompleted: number;
  promotionsFormSubmitted: number;
  linkedStudents: number;
  /** Students with a staff-uploaded form linked but no console submission. */
  uploadedNotSubmitted: number;
  /** Students who submitted from the console but have no uploaded form. */
  submittedNotUploaded: number;

  papersByMonth: Array<{ month: string; papers: number; exams: number }>;
  /** Programme-course × semester breakdown behind each papers-per-month
   *  bucket — feeds the chart tooltip. */
  papersByMonthDetail: Array<{
    month: string;
    programCourse: string;
    className: string | null;
    papers: number;
  }>;
  downloadsByDay: Array<{ day: string; count: number }>;
  distributionsByDay: Array<{ day: string; count: number }>;
  formFillupByDay: Array<{ day: string; count: number }>;
  studentSubmissionsByDay: Array<{ day: string; count: number }>;

  studentsByShift: Array<{ name: string; count: number }>;
  studentsBySubjectType: Array<{ name: string; count: number }>;
  examCyclesByType: Array<{
    name: string;
    shortName: string | null;
    count: number;
  }>;
  formsByAppearType: Array<{ name: string; count: number }>;
  formReconciliationByProgramCourse: Array<{
    name: string;
    staffRecorded: number;
    studentSubmitted: number;
    linked: number;
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
  /** Exams still missing rooms and/or candidates — the "draft" queue that
   *  the Allot Exam page works through. */
  pendingAllotment: Array<{
    examId: number;
    examGroupName: string | null;
    examTypeName: string | null;
    className: string | null;
    firstPaperAt: string | null;
    candidates: number;
    rooms: number;
  }>;
  /** One row per exam group: feeds the admit-card and seating tables. */
  groupStats: Array<{
    examGroupId: number;
    name: string;
    commencementDate: string;
    students: number;
    studentsSeated: number;
    studentsDownloaded: number;
    rooms: number;
    admitCardStart: string | null;
    admitCardLast: string | null;
  }>;
  roomsByFloor: Array<{
    floor: string;
    rooms: number;
    capacity: number;
    inUse: number;
  }>;
  topRooms: Array<{
    name: string;
    floor: string | null;
    capacity: number;
    timesUsed: number;
  }>;
  /** Staff who scheduled exams, by exams scheduled (exams.scheduledByUserId). */
  scheduledBy: Array<{ name: string; count: number }>;
  topDistributors: Array<{ name: string; count: number }>;
};

const ids = (v?: number[]) => (v && v.length ? v : undefined);

/** Dimension filters live on the exam row (year / type / class directly;
 *  shift / programme-course / subject-category via the exam's junction
 *  tables); each time series is additionally scoped by its own timestamp
 *  column (subject start, download, distribution, form fill-up) so a date
 *  range means "activity in this window". */
function examDimensionWhere(filters: ExamDashboardFilters): SQL | undefined {
  const clauses: SQL[] = [];
  const years = ids(filters.academicYearIds);
  const types = ids(filters.examTypeIds);
  const classes = ids(filters.classIds);
  const shifts = ids(filters.shiftIds);
  const pcs = ids(filters.programCourseIds);
  const subjectTypes = ids(filters.subjectTypeIds);
  if (years) clauses.push(inArray(examModel.academicYearId, years));
  if (types) clauses.push(inArray(examModel.examTypeId, types));
  if (classes) clauses.push(inArray(examModel.classId, classes));
  if (shifts)
    clauses.push(
      sql`EXISTS (SELECT 1 FROM exam_shifts esh WHERE esh.exam_id_fk = ${examModel.id} AND esh.shift_id_fk IN (${sql.join(shifts, sql`, `)}))`,
    );
  if (pcs)
    clauses.push(
      sql`EXISTS (SELECT 1 FROM exam_program_courses epc WHERE epc.exam_id_fk = ${examModel.id} AND epc.program_course_id_fk IN (${sql.join(pcs, sql`, `)}))`,
    );
  if (subjectTypes)
    clauses.push(
      sql`EXISTS (SELECT 1 FROM exam_subject_types est WHERE est.exam_id_fk = ${examModel.id} AND est.subject_type_id_fk IN (${sql.join(subjectTypes, sql`, `)}))`,
    );
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

  const classIds = ids(filters.classIds);
  const yearIds = ids(filters.academicYearIds);
  const pcIds = ids(filters.programCourseIds);
  const shiftIdsF = ids(filters.shiftIds);

  const formFillupWhere = and(
    classIds ? inArray(examFormFillupModel.classId, classIds) : undefined,
    pcIds ? inArray(examFormFillupModel.programCourseId, pcIds) : undefined,
    yearIds ? inArray(sessionModel.academicYearId, yearIds) : undefined,
    fillupRange,
  );

  // Cohort clauses on the promotion row — shared by the student-submission
  // and linked-form queries so both sides of the reconciliation see the
  // same population.
  const promotionCohortWhere = and(
    classIds ? inArray(promotionModel.classId, classIds) : undefined,
    pcIds ? inArray(promotionModel.programCourseId, pcIds) : undefined,
    shiftIdsF ? inArray(promotionModel.shiftId, shiftIdsF) : undefined,
  );

  const promotionSubmittedWhere = and(
    eq(promotionModel.isExamFormSubmitted, true),
    promotionCohortWhere,
    rangeWhere(promotionModel.examFormSubmissionTimeStamp, filters),
  );

  const candidateCountSql = (where: string) =>
    sql<number>`(SELECT COUNT(*) FROM ${examCandidateModel} ec ${sql.raw(where)})`;

  // ── Batch 1: headline totals ─────────────────────────────────────────────
  const [
    [scheduleTotals],
    [candidateTotals],
    [distributionTotals],
    [fillupTotals],
    [promotionTotals],
    [linkedTotals],
    [uploadedNotSubmittedRow],
    [submittedNotUploadedRow],
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
        candidateRows: sql<number>`COUNT(*)`.mapWith(Number),
        students: countDistinct(promotionModel.studentId),
        studentsSeated:
          sql<number>`COUNT(DISTINCT ${promotionModel.studentId}) FILTER (WHERE ${examCandidateModel.examRoomId} IS NOT NULL)`.mapWith(
            Number,
          ),
        studentsDownloaded:
          sql<number>`COUNT(DISTINCT ${promotionModel.studentId}) FILTER (WHERE ${examCandidateModel.admitCardDownloadedAt} IS NOT NULL)`.mapWith(
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
      .select({ count: countDistinct(promotionModel.studentId) })
      .from(promotionModel)
      .where(promotionSubmittedWhere),
    db
      .select({ count: countDistinct(promotionModel.studentId) })
      .from(promotionModel)
      .where(
        and(isNotNull(promotionModel.examFormFillupId), promotionCohortWhere),
      ),
    // Directional mismatches — a student counts once per direction:
    //  - uploaded-not-submitted: has a linked form on some promotion but no
    //    submitted promotion at all (staff uploaded, student never hit
    //    submit — the BBA −6 case);
    //  - submitted-not-uploaded: submitted from the console but no promotion
    //    carries an uploaded-form link.
    db
      .select({
        count: sql<number>`(SELECT COUNT(*) FROM (
            SELECT DISTINCT ${promotionModel.studentId} FROM ${promotionModel} WHERE ${promotionModel.examFormFillupId} IS NOT NULL${promotionCohortWhere ? sql` AND ${promotionCohortWhere}` : sql``}
            EXCEPT
            SELECT DISTINCT ${promotionModel.studentId} FROM ${promotionModel} WHERE ${promotionModel.isExamFormSubmitted} = TRUE${promotionCohortWhere ? sql` AND ${promotionCohortWhere}` : sql``}
          ) t)`.mapWith(Number),
      })
      .from(sql`(SELECT 1) one`),
    db
      .select({
        count: sql<number>`(SELECT COUNT(*) FROM (
            SELECT DISTINCT ${promotionModel.studentId} FROM ${promotionModel} WHERE ${promotionModel.isExamFormSubmitted} = TRUE${promotionCohortWhere ? sql` AND ${promotionCohortWhere}` : sql``}
            EXCEPT
            SELECT DISTINCT ${promotionModel.studentId} FROM ${promotionModel} WHERE ${promotionModel.examFormFillupId} IS NOT NULL${promotionCohortWhere ? sql` AND ${promotionCohortWhere}` : sql``}
          ) t)`.mapWith(Number),
      })
      .from(sql`(SELECT 1) one`),
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
      .select({
        rooms: countDistinct(examRoomModel.roomId),
        floors: countDistinct(roomModel.floorId),
      })
      .from(examRoomModel)
      .innerJoin(examModel, eq(examRoomModel.examId, examModel.id))
      .innerJoin(roomModel, eq(examRoomModel.roomId, roomModel.id))
      .where(dimWhere),
  ]);

  // ── Batch 2: series, groupings and tables ────────────────────────────────
  const monthExpr = sql<string>`TO_CHAR(${examSubjectModel.startTime}, 'YYYY-MM')`;
  const downloadDayExpr = sql<string>`TO_CHAR(${examCandidateModel.admitCardDownloadedAt}, 'YYYY-MM-DD')`;
  const distributionDayExpr = sql<string>`TO_CHAR(${tempAdmitCardDistributionsModel.createdAt}, 'YYYY-MM-DD')`;
  const fillupDayExpr = sql<string>`TO_CHAR(${examFormFillupModel.createdAt}, 'YYYY-MM-DD')`;
  const submissionDayExpr = sql<string>`TO_CHAR(${promotionModel.examFormSubmissionTimeStamp}, 'YYYY-MM-DD')`;

  const [
    papersByMonthRaw,
    papersByMonthDetailRaw,
    downloadsByDayRaw,
    distributionsByDayRaw,
    formFillupByDayRaw,
    studentSubmissionsByDayRaw,
    studentsByShiftRaw,
    studentsBySubjectTypeRaw,
    examCyclesByTypeRaw,
    formsByAppearTypeRaw,
    fillupByProgramCourseRaw,
    submittedByProgramCourseRaw,
    linkedByProgramCourseRaw,
    upcomingPapersRaw,
    groupScheduleRaw,
    pendingAllotmentRaw,
    groupStatsRaw,
    roomsByGroupRaw,
    floorTotalsRaw,
    floorsInUseRaw,
    topRoomsRaw,
    scheduledByRaw,
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
        month: monthExpr,
        programCourse: sql<string>`COALESCE(${programCourseModel.name}, 'Unknown')`,
        className: classModel.name,
        papers: countDistinct(examSubjectModel.id),
      })
      .from(examSubjectModel)
      .innerJoin(examModel, eq(examSubjectModel.examId, examModel.id))
      .innerJoin(
        examProgramCourseModel,
        eq(examProgramCourseModel.examId, examModel.id),
      )
      .leftJoin(
        programCourseModel,
        eq(examProgramCourseModel.programCourseId, programCourseModel.id),
      )
      .leftJoin(classModel, eq(examModel.classId, classModel.id))
      .where(and(dimWhere, subjectRange))
      .groupBy(
        monthExpr,
        sql`COALESCE(${programCourseModel.name}, 'Unknown')`,
        classModel.name,
      )
      .orderBy(monthExpr, desc(countDistinct(examSubjectModel.id))),
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
        day: submissionDayExpr,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(promotionModel)
      .where(
        and(
          promotionSubmittedWhere,
          isNotNull(promotionModel.examFormSubmissionTimeStamp),
        ),
      )
      .groupBy(submissionDayExpr)
      .orderBy(submissionDayExpr),
    db
      .select({
        name: sql<string>`COALESCE(${shiftModel.name}, 'Unknown')`,
        count: countDistinct(promotionModel.studentId),
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
      .orderBy(desc(countDistinct(promotionModel.studentId))),
    db
      .select({
        name: sql<string>`COALESCE(${subjectTypeModel.name}, 'Unknown')`,
        count: countDistinct(promotionModel.studentId),
      })
      .from(examCandidateModel)
      .innerJoin(examModel, eq(examCandidateModel.examId, examModel.id))
      .innerJoin(
        promotionModel,
        eq(examCandidateModel.promotionId, promotionModel.id),
      )
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
      .orderBy(desc(countDistinct(promotionModel.studentId))),
    db
      .select({
        name: examTypeModel.name,
        shortName: examTypeModel.shortName,
        count: countDistinct(examModel.examGroupId),
      })
      .from(examModel)
      .innerJoin(examTypeModel, eq(examModel.examTypeId, examTypeModel.id))
      .where(dimWhere)
      .groupBy(examTypeModel.name, examTypeModel.shortName)
      .orderBy(desc(countDistinct(examModel.examGroupId))),
    db
      .select({
        name: sql<string>`COALESCE(${promotionStatusModel.name}, 'Unknown')`,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(examFormFillupModel)
      .leftJoin(
        sessionModel,
        eq(examFormFillupModel.sessionId, sessionModel.id),
      )
      .leftJoin(
        promotionStatusModel,
        eq(examFormFillupModel.appearTypeId, promotionStatusModel.id),
      )
      .where(formFillupWhere)
      .groupBy(sql`COALESCE(${promotionStatusModel.name}, 'Unknown')`)
      .orderBy(desc(sql`COUNT(*)`)),
    db
      .select({
        name: sql<string>`COALESCE(${programCourseModel.name}, 'Unknown')`,
        count: countDistinct(examFormFillupModel.studentId),
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
      .groupBy(sql`COALESCE(${programCourseModel.name}, 'Unknown')`),
    db
      .select({
        name: sql<string>`COALESCE(${programCourseModel.name}, 'Unknown')`,
        count: countDistinct(promotionModel.studentId),
      })
      .from(promotionModel)
      .leftJoin(
        programCourseModel,
        eq(promotionModel.programCourseId, programCourseModel.id),
      )
      .where(promotionSubmittedWhere)
      .groupBy(sql`COALESCE(${programCourseModel.name}, 'Unknown')`),
    db
      .select({
        name: sql<string>`COALESCE(${programCourseModel.name}, 'Unknown')`,
        count: countDistinct(promotionModel.studentId),
      })
      .from(promotionModel)
      .leftJoin(
        programCourseModel,
        eq(promotionModel.programCourseId, programCourseModel.id),
      )
      .where(
        and(isNotNull(promotionModel.examFormFillupId), promotionCohortWhere),
      )
      .groupBy(sql`COALESCE(${programCourseModel.name}, 'Unknown')`),
    db
      .select({
        examSubjectId: examSubjectModel.id,
        subjectName: subjectModel.name,
        paperCode: paperModel.code,
        examGroupName: examGroupModel.name,
        className: classModel.name,
        startTime: examSubjectModel.startTime,
        endTime: examSubjectModel.endTime,
        candidateCount: candidateCountSql(
          `WHERE ec.exam_subject_id_fk = "exam_subjects"."id"`,
        ).mapWith(Number),
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
        hasToday: sql<boolean>`BOOL_OR(${examSubjectModel.startTime}::date = CURRENT_DATE)`,
        hasFuture: sql<boolean>`BOOL_OR(${examSubjectModel.startTime} > NOW())`,
        allPast: sql<boolean>`BOOL_AND(${examSubjectModel.endTime} < NOW())`,
      })
      .from(examSubjectModel)
      .innerJoin(examModel, eq(examSubjectModel.examId, examModel.id))
      .innerJoin(examGroupModel, eq(examModel.examGroupId, examGroupModel.id))
      .where(dimWhere)
      .groupBy(examGroupModel.id),
    db
      .select({
        examId: examModel.id,
        examGroupName: examGroupModel.name,
        examTypeName: examTypeModel.name,
        className: classModel.name,
        firstPaperAt: sql<
          string | null
        >`(SELECT MIN(es.start_time) FROM ${examSubjectModel} es WHERE es.exam_id_fk = ${examModel.id})`,
        candidates: candidateCountSql(
          `WHERE ec.exam_id_fk = "exams"."id"`,
        ).mapWith(Number),
        rooms:
          sql<number>`(SELECT COUNT(*) FROM ${examRoomModel} er WHERE er.exam_id_fk = ${examModel.id})`.mapWith(
            Number,
          ),
      })
      .from(examModel)
      .leftJoin(examGroupModel, eq(examModel.examGroupId, examGroupModel.id))
      .leftJoin(examTypeModel, eq(examModel.examTypeId, examTypeModel.id))
      .leftJoin(classModel, eq(examModel.classId, classModel.id))
      .where(
        and(
          dimWhere,
          sql`(
            NOT EXISTS (SELECT 1 FROM ${examRoomModel} er WHERE er.exam_id_fk = ${examModel.id})
            OR NOT EXISTS (SELECT 1 FROM ${examCandidateModel} ec WHERE ec.exam_id_fk = ${examModel.id})
          )`,
        ),
      )
      .orderBy(desc(examModel.createdAt))
      .limit(20),
    db
      .select({
        examGroupId: examGroupModel.id,
        name: examGroupModel.name,
        commencementDate: examGroupModel.examCommencementDate,
        students: countDistinct(promotionModel.studentId),
        studentsSeated:
          sql<number>`COUNT(DISTINCT ${promotionModel.studentId}) FILTER (WHERE ${examCandidateModel.examRoomId} IS NOT NULL)`.mapWith(
            Number,
          ),
        studentsDownloaded:
          sql<number>`COUNT(DISTINCT ${promotionModel.studentId}) FILTER (WHERE ${examCandidateModel.admitCardDownloadedAt} IS NOT NULL)`.mapWith(
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
      .leftJoin(
        promotionModel,
        eq(examCandidateModel.promotionId, promotionModel.id),
      )
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
        floor: sql<string>`COALESCE(${floorModel.name}, 'Unassigned')`,
        rooms: sql<number>`COUNT(*)`.mapWith(Number),
        capacity:
          sql<number>`COALESCE(SUM(${roomModel.numberOfBenches} * ${roomModel.maxStudentsPerBench}), 0)`.mapWith(
            Number,
          ),
      })
      .from(roomModel)
      .leftJoin(floorModel, eq(roomModel.floorId, floorModel.id))
      .where(eq(roomModel.isActive, true))
      .groupBy(sql`COALESCE(${floorModel.name}, 'Unassigned')`)
      .orderBy(sql`COALESCE(${floorModel.name}, 'Unassigned')`),
    db
      .select({
        floor: sql<string>`COALESCE(${floorModel.name}, 'Unassigned')`,
        inUse: countDistinct(examRoomModel.roomId),
      })
      .from(examRoomModel)
      .innerJoin(examModel, eq(examRoomModel.examId, examModel.id))
      .innerJoin(roomModel, eq(examRoomModel.roomId, roomModel.id))
      .leftJoin(floorModel, eq(roomModel.floorId, floorModel.id))
      .where(dimWhere)
      .groupBy(sql`COALESCE(${floorModel.name}, 'Unassigned')`),
    db
      .select({
        name: roomModel.name,
        floor: floorModel.name,
        capacity:
          sql<number>`${roomModel.numberOfBenches} * ${roomModel.maxStudentsPerBench}`.mapWith(
            Number,
          ),
        timesUsed: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(examRoomModel)
      .innerJoin(examModel, eq(examRoomModel.examId, examModel.id))
      .innerJoin(roomModel, eq(examRoomModel.roomId, roomModel.id))
      .leftJoin(floorModel, eq(roomModel.floorId, floorModel.id))
      .where(dimWhere)
      .groupBy(
        roomModel.id,
        roomModel.name,
        floorModel.name,
        roomModel.numberOfBenches,
        roomModel.maxStudentsPerBench,
      )
      .orderBy(desc(sql`COUNT(*)`))
      .limit(8),
    db
      .select({
        name: sql<string>`COALESCE(${userModel.name}, 'Unknown')`,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(examModel)
      .leftJoin(userModel, eq(examModel.scheduledByUserId, userModel.id))
      .where(dimWhere)
      .groupBy(sql`COALESCE(${userModel.name}, 'Unknown')`)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(8),
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
  const inUseByFloor = new Map(
    floorsInUseRaw.map((r) => [r.floor, num(r.inUse)]),
  );
  const students = num(candidateTotals?.students);
  const studentsDownloaded = num(candidateTotals?.studentsDownloaded);

  const cycleStatus = { today: 0, upcoming: 0, completed: 0 };
  for (const g of groupScheduleRaw) {
    if (g.hasToday) cycleStatus.today += 1;
    else if (g.hasFuture) cycleStatus.upcoming += 1;
    else if (g.allPast) cycleStatus.completed += 1;
  }

  // Merge the three per-programme-course groupings into one reconciliation
  // row set, ordered by student submissions.
  const reconciliation = new Map<
    string,
    { staffRecorded: number; studentSubmitted: number; linked: number }
  >();
  const reconRow = (name: string) => {
    let row = reconciliation.get(name);
    if (!row) {
      row = { staffRecorded: 0, studentSubmitted: 0, linked: 0 };
      reconciliation.set(name, row);
    }
    return row;
  };
  for (const r of fillupByProgramCourseRaw)
    reconRow(r.name).staffRecorded = num(r.count);
  for (const r of submittedByProgramCourseRaw)
    reconRow(r.name).studentSubmitted = num(r.count);
  for (const r of linkedByProgramCourseRaw)
    reconRow(r.name).linked = num(r.count);

  return {
    examGroups: num(scheduleTotals?.examGroups),
    exams: num(scheduleTotals?.exams),
    papersScheduled: num(scheduleTotals?.papers),
    candidateRows: num(candidateTotals?.candidateRows),
    students,
    studentsSeated: num(candidateTotals?.studentsSeated),
    studentsDownloaded,
    downloadRate:
      students > 0 ? Math.round((studentsDownloaded / students) * 100) : 0,
    physicalDistributions: num(distributionTotals?.count),
    formFillupTotal: num(fillupTotals?.total),
    formFillupCompleted: num(fillupTotals?.completed),
    promotionsFormSubmitted: num(promotionTotals?.count),
    linkedStudents: num(linkedTotals?.count),
    uploadedNotSubmitted: num(uploadedNotSubmittedRow?.count),
    submittedNotUploaded: num(submittedNotUploadedRow?.count),
    upcomingPapers30d: num(upcomingTotals?.count),
    pendingAllotmentCount: pendingAllotmentRaw.length,
    cycleStatus,
    roomsTotal: num(roomTotals?.count),
    totalRoomCapacity: num(roomTotals?.capacity),
    floorsTotal: num(floorTotals?.count),
    roomsInUse: num(roomsInUseTotals?.rooms),
    floorsInUse: num(roomsInUseTotals?.floors),

    papersByMonth: papersByMonthRaw.map((r) => ({
      month: r.month,
      papers: num(r.papers),
      exams: num(r.exams),
    })),
    papersByMonthDetail: papersByMonthDetailRaw.map((r) => ({
      month: r.month,
      programCourse: r.programCourse,
      className: r.className,
      papers: num(r.papers),
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
    studentSubmissionsByDay: studentSubmissionsByDayRaw.map((r) => ({
      day: r.day,
      count: num(r.count),
    })),

    studentsByShift: studentsByShiftRaw.map((r) => ({
      name: r.name,
      count: num(r.count),
    })),
    studentsBySubjectType: studentsBySubjectTypeRaw.map((r) => ({
      name: r.name,
      count: num(r.count),
    })),
    examCyclesByType: examCyclesByTypeRaw.map((r) => ({
      name: r.name,
      shortName: r.shortName,
      count: num(r.count),
    })),
    formsByAppearType: formsByAppearTypeRaw.map((r) => ({
      name: r.name,
      count: num(r.count),
    })),
    formReconciliationByProgramCourse: Array.from(reconciliation.entries())
      .map(([name, r]) => ({ name, ...r }))
      .sort(
        (a, b) =>
          b.studentSubmitted +
          b.staffRecorded -
          (a.studentSubmitted + a.staffRecorded),
      ),

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
    pendingAllotment: pendingAllotmentRaw.map((r) => ({
      examId: r.examId,
      examGroupName: r.examGroupName,
      examTypeName: r.examTypeName,
      className: r.className,
      firstPaperAt: r.firstPaperAt ? String(r.firstPaperAt) : null,
      candidates: num(r.candidates),
      rooms: num(r.rooms),
    })),
    groupStats: groupStatsRaw.map((r) => ({
      examGroupId: r.examGroupId,
      name: r.name,
      commencementDate: String(r.commencementDate),
      students: num(r.students),
      studentsSeated: num(r.studentsSeated),
      studentsDownloaded: num(r.studentsDownloaded),
      rooms: roomsByGroup.get(r.examGroupId) ?? 0,
      admitCardStart: r.admitCardStart ? String(r.admitCardStart) : null,
      admitCardLast: r.admitCardLast ? String(r.admitCardLast) : null,
    })),
    roomsByFloor: floorTotalsRaw.map((r) => ({
      floor: r.floor,
      rooms: num(r.rooms),
      capacity: num(r.capacity),
      inUse: inUseByFloor.get(r.floor) ?? 0,
    })),
    topRooms: topRoomsRaw.map((r) => ({
      name: r.name,
      floor: r.floor,
      capacity: num(r.capacity),
      timesUsed: num(r.timesUsed),
    })),
    scheduledBy: scheduledByRaw.map((r) => ({
      name: r.name,
      count: num(r.count),
    })),
    topDistributors: topDistributorsRaw.map((r) => ({
      name: r.name,
      count: num(r.count),
    })),
  };
}
