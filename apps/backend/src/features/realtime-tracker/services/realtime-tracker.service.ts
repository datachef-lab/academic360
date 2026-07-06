import { db } from "@/db/index.js";
import {
  affiliationModel,
  classModel,
  cuRegistrationCorrectionRequestModel,
  feeStructureModel,
  feeStudentMappingModel,
  idCardIssueModel,
  idCardTemplateModel,
  personalDetailsModel,
  programCourseModel,
  promotionModel,
  sessionModel,
  studentModel,
  studentSubjectSelectionModel,
  userModel,
} from "@repo/db/schemas";
import { and, countDistinct, eq, inArray, sql, type SQL } from "drizzle-orm";
import {
  canonicalRealtimeTrackerFilters,
  type RealtimeTrackerFilters,
} from "@/utils/realtime-tracker-filters.js";
import {
  getFeesDashboardFeeMisSlice,
  hasDashboardScope,
  mappingIdsWhere,
  resolveDashboardScope,
  type FeesDashboardFilters,
  type FeesDashboardScope,
} from "@/features/fees/services/fees-dashboard.service.js";

const ACTIVE_STUDENT_SQL = and(
  eq(userModel.isActive, true),
  eq(userModel.type, "STUDENT"),
)!;

const ACTIVE_PROMOTION_SQL = sql`${promotionModel.endDate} IS NULL AND COALESCE(${promotionModel.isDeprecated}, false) = false`;

const PAID_MAPPING_SQL = sql`COALESCE(${feeStudentMappingModel.totalPayable}, 0) > 0 AND COALESCE(${feeStudentMappingModel.amountPaid}, 0) >= COALESCE(${feeStudentMappingModel.totalPayable}, 0)`;
const UNPAID_MAPPING_SQL = sql`COALESCE(${feeStudentMappingModel.totalPayable}, 0) > 0 AND COALESCE(${feeStudentMappingModel.amountPaid}, 0) < COALESCE(${feeStudentMappingModel.totalPayable}, 0)`;

export type AffiliationRegistrationRow = {
  programCourseName: string;
  admitted: number;
  idCardIssued: number;
  subjectSelectionDone: number;
  onlineRegDone: number;
  physicalRegDone: number;
  sortOrder: number;
};

export type AffiliationRegistrationPayload = {
  updatedAt: string;
  filters: RealtimeTrackerFilters;
  data: AffiliationRegistrationRow[];
};

export type FeeMisCourseRow = {
  index: number;
  courseName: string;
  groupKey: string;
  semesterLabel?: string;
  totalStudents: number;
  notPaid: number;
  receivableAmt: number;
  collectedAmt: number;
  pendingAmt: number;
  receivableNos: number;
  collectedNos: number;
  pendingNos: number;
  isSubtotal?: boolean;
  isGrandTotal?: boolean;
};

export type FeeMisSemesterRow = {
  semester: string;
  receivableAmt: number;
  receivableNos: number;
  collectedAmt: number;
  collectedNos: number;
  pendingAmt: number;
  pendingNos: number;
};

export type FeeMisPayload = {
  updatedAt: string;
  filters: RealtimeTrackerFilters;
  /** Class/semester names for selected classIds (Fee MIS semester column). */
  semesterDisplayLabels: string[];
  courseRows: FeeMisCourseRow[];
  semesterRows: FeeMisSemesterRow[];
  paidStatus: { paid: number; unpaid: number; paidPct: number };
};

function toFeesDashboardFilters(
  filters: RealtimeTrackerFilters,
): FeesDashboardFilters {
  return {
    academicYearIds: filters.academicYearIds,
    programCourseIds: filters.programCourseIds,
    classIds: filters.classIds,
    shiftIds: filters.shiftIds,
    streamIds: filters.streamIds,
    courseLevelIds: filters.courseLevelIds,
    regulationTypeIds: filters.regulationTypeIds,
    affiliationIds: filters.affiliationIds,
    categoryIds: filters.categoryIds,
    religionIds: filters.religionIds,
    genders: filters.genders,
    paymentStatuses: filters.paymentStatuses,
    paymentModes: filters.paymentModes,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  };
}

async function resolveSessionIds(
  filters: RealtimeTrackerFilters,
): Promise<number[] | undefined> {
  if (filters.sessionIds?.length) return filters.sessionIds;
  if (!filters.academicYearIds?.length) return undefined;
  const rows = await db
    .select({ id: sessionModel.id })
    .from(sessionModel)
    .where(inArray(sessionModel.academicYearId, filters.academicYearIds));
  const ids = rows.map((r) => r.id).filter((id): id is number => id != null);
  return ids.length ? ids : undefined;
}

function buildPromotionScope(): SQL[] {
  return [ACTIVE_STUDENT_SQL, eq(promotionModel.isAlumni, false)];
}

async function buildPromotionWhere(
  filters: RealtimeTrackerFilters,
): Promise<SQL | undefined> {
  const parts = buildPromotionScope();

  const sessionIds = await resolveSessionIds(filters);
  // Whether the caller pinned a specific academic year / session.
  const yearScoped = !!(
    filters.academicYearIds?.length || filters.sessionIds?.length
  );

  if (sessionIds?.length) {
    parts.push(inArray(promotionModel.sessionId, sessionIds));
  } else if (yearScoped) {
    // An academic-year/session filter that resolves to NO sessions must match
    // nothing — silently dropping it would show all years' data as if the
    // filter were applied (e.g. a DB without a session for the selected year).
    parts.push(sql`FALSE`);
  }

  // Live view (no year/session selected) → only ACTIVE promotions, i.e. the
  // current enrolment snapshot. When a specific year IS selected, show that
  // year's full cohort regardless of active state — a past year's promotions
  // are all closed (end_date set), so the active filter would zero them out.
  // Students are de-duplicated downstream via countDistinct(student.id).
  if (!yearScoped) {
    parts.push(ACTIVE_PROMOTION_SQL);
  }
  if (filters.classIds?.length) {
    parts.push(inArray(promotionModel.classId, filters.classIds));
  }
  if (filters.shiftIds?.length) {
    parts.push(inArray(promotionModel.shiftId, filters.shiftIds));
  }
  if (filters.programCourseIds?.length) {
    parts.push(
      inArray(promotionModel.programCourseId, filters.programCourseIds),
    );
  }

  return parts.length ? and(...parts) : undefined;
}

function buildProgramCourseScope(filters: RealtimeTrackerFilters): SQL[] {
  const parts: SQL[] = [];
  if (filters.affiliationIds?.length) {
    parts.push(
      inArray(programCourseModel.affiliationId, filters.affiliationIds),
    );
  }
  if (filters.regulationTypeIds?.length) {
    parts.push(
      inArray(programCourseModel.regulationTypeId, filters.regulationTypeIds),
    );
  }
  if (filters.streamIds?.length) {
    parts.push(inArray(programCourseModel.streamId, filters.streamIds));
  }
  if (filters.courseLevelIds?.length) {
    parts.push(
      inArray(programCourseModel.courseLevelId, filters.courseLevelIds),
    );
  }
  if (filters.programCourseIds?.length) {
    parts.push(inArray(programCourseModel.id, filters.programCourseIds));
  }
  return parts;
}

function buildStudentDemographicScope(filters: RealtimeTrackerFilters): SQL[] {
  const parts: SQL[] = [];
  if (filters.genders?.length) {
    parts.push(inArray(personalDetailsModel.gender, filters.genders as never));
  }
  if (filters.categoryIds?.length) {
    parts.push(inArray(personalDetailsModel.categoryId, filters.categoryIds));
  }
  if (filters.religionIds?.length) {
    parts.push(inArray(personalDetailsModel.religionId, filters.religionIds));
  }
  return parts;
}

/** Students with at least one active subject selection row. */
const SUBJECT_SELECTION_EXISTS_SQL = sql`EXISTS (
  SELECT 1 FROM ${studentSubjectSelectionModel} sss
  WHERE sss.student_id_fk = ${studentModel.id}
    AND sss.is_active = TRUE
)`;

/**
 * Students holding an ID card: at least one id_card_issues row. A student can
 * have several rows (issued / re-issued / renewed) but counts once — the card
 * has been provided to them either way.
 *
 * Academic-year scoping (when the tracker filters by AY/sessions):
 *  - a card's year is its TEMPLATE's academic year (id_card_templates.academic_year_id_fk);
 *  - legacy-synced cards have NO template, so those fall back to the issue date
 *    landing inside the selected session window(s) (with a pre-session grace,
 *    since cards are printed shortly before the session opens).
 */
async function buildIdCardIssuedExistsSql(
  filters: RealtimeTrackerFilters,
): Promise<SQL> {
  const anyCard = sql`EXISTS (
    SELECT 1 FROM ${idCardIssueModel} ici
    WHERE ici.student_id_fk = ${studentModel.id}
  )`;
  const hasYearFilter = !!(
    filters.academicYearIds?.length || filters.sessionIds?.length
  );
  if (!hasYearFilter) return anyCard;
  const sessionIds = await resolveSessionIds(filters);

  // Target academic years: from the filter, else derived from the sessions.
  let academicYearIds = filters.academicYearIds ?? [];
  if (!academicYearIds.length && sessionIds?.length) {
    const rows = await db
      .select({ ayId: sessionModel.academicYearId })
      .from(sessionModel)
      .where(inArray(sessionModel.id, sessionIds));
    academicYearIds = [
      ...new Set(
        rows.map((r) => r.ayId).filter((id): id is number => id != null),
      ),
    ];
  }

  const windows = sessionIds?.length
    ? await db
        .select({ from: sessionModel.from, to: sessionModel.to })
        .from(sessionModel)
        .where(inArray(sessionModel.id, sessionIds))
    : [];
  const froms = windows.map((w) => w.from).filter(Boolean) as string[];
  const tos = windows.map((w) => w.to).filter(Boolean) as string[];
  // Year filter present but nothing resolvable -> match no cards (never all).
  if (!academicYearIds.length && (!froms.length || !tos.length))
    return sql`FALSE`;

  const conditions: SQL[] = [];
  if (academicYearIds.length) {
    conditions.push(
      sql`ict.academic_year_id_fk IN (${sql.join(
        academicYearIds.map((id) => sql`${id}`),
        sql`, `,
      )})`,
    );
  }
  if (froms.length && tos.length) {
    const minFrom = froms.sort()[0];
    const maxTo = tos.sort()[tos.length - 1];
    // 60-day pre-session grace: cards are printed shortly BEFORE the session
    // opens (e.g. 2026-27 cards issued 30-Jun-2026 for the 01-Jul start).
    conditions.push(
      sql`(ici.template_id_fk IS NULL
        AND ici.issue_date >= (${minFrom}::date - INTERVAL '60 days')
        AND ici.issue_date < (${maxTo}::date + INTERVAL '1 day'))`,
    );
  }

  return sql`EXISTS (
    SELECT 1 FROM ${idCardIssueModel} ici
    LEFT JOIN ${idCardTemplateModel} ict ON ict.id = ici.template_id_fk
    WHERE ici.student_id_fk = ${studentModel.id}
      AND (${sql.join(conditions, sql` OR `)})
  )`;
}

export async function getAffiliationRegistrationData(
  filtersInput: RealtimeTrackerFilters = {},
): Promise<AffiliationRegistrationPayload> {
  const filters = canonicalRealtimeTrackerFilters(filtersInput);
  const promotionWhere = await buildPromotionWhere(filters);
  const pcParts = buildProgramCourseScope(filters);
  const demoParts = buildStudentDemographicScope(filters);

  const whereParts: SQL[] = [];
  if (promotionWhere) whereParts.push(promotionWhere);
  if (pcParts.length) whereParts.push(and(...pcParts)!);
  if (demoParts.length) whereParts.push(and(...demoParts)!);

  const whereClause = whereParts.length ? and(...whereParts) : undefined;

  const idCardIssuedExistsSql = await buildIdCardIssuedExistsSql(filters);

  const programCourseData = await db
    .select({
      programCourseId: programCourseModel.id,
      programCourseName: programCourseModel.name,
      admitted: countDistinct(studentModel.id),
      idCardIssued: sql<number>`COUNT(DISTINCT CASE WHEN ${idCardIssuedExistsSql} THEN ${studentModel.id} END)`,
      subjectSelectionDone: sql<number>`COUNT(DISTINCT CASE WHEN ${SUBJECT_SELECTION_EXISTS_SQL} THEN ${studentModel.id} END)`,
      onlineRegDone: sql<number>`COUNT(DISTINCT CASE WHEN ${cuRegistrationCorrectionRequestModel.onlineRegistrationDone} = true THEN ${studentModel.id} END)`,
      physicalRegDone: sql<number>`COUNT(DISTINCT CASE WHEN ${cuRegistrationCorrectionRequestModel.physicalRegistrationDone} = true THEN ${studentModel.id} END)`,
    })
    .from(programCourseModel)
    .innerJoin(
      promotionModel,
      eq(promotionModel.programCourseId, programCourseModel.id),
    )
    .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(
      personalDetailsModel,
      eq(personalDetailsModel.userId, userModel.id),
    )
    .leftJoin(
      cuRegistrationCorrectionRequestModel,
      eq(cuRegistrationCorrectionRequestModel.studentId, studentModel.id),
    )
    .where(whereClause)
    .groupBy(programCourseModel.id, programCourseModel.name)
    .orderBy(programCourseModel.name);

  const totalData = await db
    .select({
      admitted: countDistinct(studentModel.id),
      idCardIssued: sql<number>`COUNT(DISTINCT CASE WHEN ${idCardIssuedExistsSql} THEN ${studentModel.id} END)`,
      subjectSelectionDone: sql<number>`COUNT(DISTINCT CASE WHEN ${SUBJECT_SELECTION_EXISTS_SQL} THEN ${studentModel.id} END)`,
      onlineRegDone: sql<number>`COUNT(DISTINCT CASE WHEN ${cuRegistrationCorrectionRequestModel.onlineRegistrationDone} = true THEN ${studentModel.id} END)`,
      physicalRegDone: sql<number>`COUNT(DISTINCT CASE WHEN ${cuRegistrationCorrectionRequestModel.physicalRegistrationDone} = true THEN ${studentModel.id} END)`,
    })
    .from(programCourseModel)
    .innerJoin(
      promotionModel,
      eq(promotionModel.programCourseId, programCourseModel.id),
    )
    .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(
      personalDetailsModel,
      eq(personalDetailsModel.userId, userModel.id),
    )
    .leftJoin(
      cuRegistrationCorrectionRequestModel,
      eq(cuRegistrationCorrectionRequestModel.studentId, studentModel.id),
    )
    .where(whereClause);

  const total = totalData[0] ?? {
    admitted: 0,
    idCardIssued: 0,
    subjectSelectionDone: 0,
    onlineRegDone: 0,
    physicalRegDone: 0,
  };

  const data: AffiliationRegistrationRow[] = [
    ...programCourseData.map((row) => ({
      programCourseName:
        row.programCourseName || `Program Course ${row.programCourseId}`,
      admitted: Number(row.admitted),
      idCardIssued: Number(row.idCardIssued),
      subjectSelectionDone: Number(row.subjectSelectionDone),
      onlineRegDone: Number(row.onlineRegDone),
      physicalRegDone: Number(row.physicalRegDone),
      sortOrder: 0,
    })),
    {
      programCourseName: "Total",
      admitted: Number(total.admitted),
      idCardIssued: Number(total.idCardIssued),
      subjectSelectionDone: Number(total.subjectSelectionDone),
      onlineRegDone: Number(total.onlineRegDone),
      physicalRegDone: Number(total.physicalRegDone),
      sortOrder: 1,
    },
  ];

  return {
    updatedAt: new Date().toISOString(),
    filters,
    data,
  };
}

function inferCourseGroup(name: string): string {
  const u = name.toUpperCase();
  if (u.includes("B.COM")) return "B.COM";
  if (u.includes("BBA")) return "BBA";
  if (u.includes("B.A.")) return "B.A.";
  if (u.includes("B.SC")) return "B.SC.";
  if (u.includes("M.COM")) return "M.COM";
  if (/\bMA\b/.test(u) || u.startsWith("MA ")) return "MA";
  return "OTHER";
}

const GROUP_ORDER = ["B.COM", "BBA", "B.A.", "B.SC.", "MA", "M.COM", "OTHER"];

/** One row per program course (sum students when multiple semester/class rows). */
function mergeFeeMisProgramRows(
  rows: FeeMisCourseRow[],
  allowedSemesterLabels?: Set<string>,
): FeeMisCourseRow[] {
  const byCourse = new Map<string, FeeMisCourseRow>();
  for (const row of rows) {
    const key = `${row.groupKey}::${row.courseName}`;
    const hit = byCourse.get(key);
    if (!hit) {
      byCourse.set(key, { ...row });
      continue;
    }
    hit.totalStudents += row.totalStudents;
    hit.notPaid += row.notPaid;
    const labels = new Set<string>();
    for (const label of [hit.semesterLabel, row.semesterLabel]) {
      if (!label?.trim()) continue;
      if (allowedSemesterLabels && !allowedSemesterLabels.has(label.trim())) {
        continue;
      }
      labels.add(label.trim());
    }
    hit.semesterLabel =
      labels.size > 1
        ? [...labels].sort((a, b) => a.localeCompare(b)).join(", ")
        : (hit.semesterLabel ?? row.semesterLabel);
  }
  return [...byCourse.values()].sort((a, b) =>
    a.courseName.localeCompare(b.courseName),
  );
}

async function resolveClassDisplayLabels(
  classIds?: number[],
): Promise<{ labels: string[]; labelSet: Set<string> }> {
  if (!classIds?.length) {
    return { labels: [], labelSet: new Set() };
  }
  const rows = await db
    .select({ name: classModel.name })
    .from(classModel)
    .where(inArray(classModel.id, classIds))
    .orderBy(classModel.id);
  const labels = rows
    .map((r) => r.name?.trim())
    .filter((name): name is string => Boolean(name));
  return { labels, labelSet: new Set(labels) };
}

function buildFeeMisMappingWhere(
  mappingWhere: SQL,
  feesFilters: FeesDashboardFilters,
  filters: RealtimeTrackerFilters,
): SQL {
  const parts: SQL[] = [
    mappingWhere,
    sql`COALESCE(${feeStudentMappingModel.totalPayable}, 0) > 0`,
  ];
  if (feesFilters.academicYearIds?.length) {
    parts.push(
      inArray(feeStructureModel.academicYearId, feesFilters.academicYearIds),
    );
  }
  if (feesFilters.classIds?.length) {
    parts.push(inArray(feeStructureModel.classId, feesFilters.classIds));
  }
  if (feesFilters.shiftIds?.length) {
    parts.push(inArray(feeStructureModel.shiftId, feesFilters.shiftIds));
  }
  if (feesFilters.programCourseIds?.length) {
    parts.push(
      inArray(feeStructureModel.programCourseId, feesFilters.programCourseIds),
    );
  }
  const pcParts = buildProgramCourseScope(filters);
  if (pcParts.length) {
    parts.push(and(...pcParts)!);
  }
  return and(...parts)!;
}

async function loadFeeMisCourseRows(
  filters: RealtimeTrackerFilters,
  preResolvedScope?: FeesDashboardScope,
): Promise<FeeMisCourseRow[]> {
  const feesFilters = toFeesDashboardFilters(filters);
  if (!hasDashboardScope(feesFilters)) {
    return [
      {
        index: 0,
        courseName: "ALL COURSE TOTAL",
        groupKey: "ALL",
        totalStudents: 0,
        notPaid: 0,
        receivableAmt: 0,
        collectedAmt: 0,
        pendingAmt: 0,
        receivableNos: 0,
        collectedNos: 0,
        pendingNos: 0,
        isGrandTotal: true,
      },
    ];
  }

  const scope =
    preResolvedScope ??
    (await resolveDashboardScope(feesFilters, {
      includeClosedPromotions: true,
    }));
  if (!scope.canonicalMappingIds.length) {
    return [
      {
        index: 0,
        courseName: "ALL COURSE TOTAL",
        groupKey: "ALL",
        totalStudents: 0,
        notPaid: 0,
        receivableAmt: 0,
        collectedAmt: 0,
        pendingAmt: 0,
        receivableNos: 0,
        collectedNos: 0,
        pendingNos: 0,
        isGrandTotal: true,
      },
    ];
  }

  const mappingWhere = mappingIdsWhere(scope.canonicalMappingIds);
  const rowWhere = buildFeeMisMappingWhere(mappingWhere, feesFilters, filters);
  const { labelSet: allowedSemesterLabels } = await resolveClassDisplayLabels(
    filters.classIds,
  );

  const rows = await db
    .select({
      programCourseId: programCourseModel.id,
      programCourseName: programCourseModel.name,
      semesterLabel: classModel.name,
      totalStudents: countDistinct(feeStudentMappingModel.studentId),
      notPaid: sql<number>`COUNT(DISTINCT CASE WHEN ${UNPAID_MAPPING_SQL} THEN ${feeStudentMappingModel.studentId} END)`,
      receivableAmt: sql<number>`COALESCE(SUM(COALESCE(${feeStudentMappingModel.totalPayable}, 0)), 0)::float`,
      collectedAmt: sql<number>`COALESCE(SUM(COALESCE(${feeStudentMappingModel.amountPaid}, 0)), 0)::float`,
      collectedNos: sql<number>`COUNT(DISTINCT CASE WHEN ${PAID_MAPPING_SQL} THEN ${feeStudentMappingModel.studentId} END)`,
      pendingNos: sql<number>`COUNT(DISTINCT CASE WHEN ${UNPAID_MAPPING_SQL} THEN ${feeStudentMappingModel.studentId} END)`,
    })
    .from(feeStudentMappingModel)
    .innerJoin(
      feeStructureModel,
      eq(feeStructureModel.id, feeStudentMappingModel.feeStructureId),
    )
    .innerJoin(
      programCourseModel,
      eq(programCourseModel.id, feeStructureModel.programCourseId),
    )
    .innerJoin(classModel, eq(classModel.id, feeStructureModel.classId))
    .where(rowWhere)
    .groupBy(
      programCourseModel.id,
      programCourseModel.name,
      classModel.id,
      classModel.name,
    )
    .orderBy(programCourseModel.name, classModel.id);

  const detailRows = mergeFeeMisProgramRows(
    rows
      .filter((r) => {
        const label = r.semesterLabel?.trim();
        if (!allowedSemesterLabels.size) return true;
        return Boolean(label && allowedSemesterLabels.has(label));
      })
      .map((r) => {
        const receivableAmt = Math.round(Number(r.receivableAmt ?? 0));
        const collectedAmt = Math.round(Number(r.collectedAmt ?? 0));
        const receivableNos = Number(r.totalStudents);
        const collectedNos = Number(r.collectedNos);
        const pendingNos = Number(r.pendingNos);
        return {
          index: 0,
          courseName: r.programCourseName ?? "—",
          groupKey: inferCourseGroup(r.programCourseName ?? ""),
          semesterLabel: r.semesterLabel?.trim() || undefined,
          totalStudents: receivableNos,
          notPaid: Number(r.notPaid),
          receivableAmt,
          collectedAmt,
          pendingAmt: Math.max(0, receivableAmt - collectedAmt),
          receivableNos,
          collectedNos,
          pendingNos,
        };
      }),
    allowedSemesterLabels.size ? allowedSemesterLabels : undefined,
  );

  const grouped = new Map<string, FeeMisCourseRow[]>();
  for (const row of detailRows) {
    const list = grouped.get(row.groupKey) ?? [];
    list.push(row);
    grouped.set(row.groupKey, list);
  }

  const out: FeeMisCourseRow[] = [];
  let runningIndex = 0;
  let ugTotal = { total: 0, notPaid: 0 };
  let grandTotal = { total: 0, notPaid: 0 };

  for (const groupKey of GROUP_ORDER) {
    const items = grouped.get(groupKey);
    if (!items?.length) continue;

    let subTotal = 0;
    let subNotPaid = 0;
    let subReceivable = 0;
    let subCollected = 0;
    let subReceivableNos = 0;
    let subCollectedNos = 0;
    let subPendingNos = 0;
    for (const item of items) {
      runningIndex += 1;
      out.push({ ...item, index: runningIndex });
      subTotal += item.totalStudents;
      subNotPaid += item.notPaid;
      subReceivable += item.receivableAmt;
      subCollected += item.collectedAmt;
      subReceivableNos += item.receivableNos;
      subCollectedNos += item.collectedNos;
      subPendingNos += item.pendingNos;
      grandTotal.total += item.totalStudents;
      grandTotal.notPaid += item.notPaid;
      if (!["MA", "M.COM"].includes(groupKey)) {
        ugTotal.total += item.totalStudents;
        ugTotal.notPaid += item.notPaid;
      }
    }
    out.push({
      index: 0,
      courseName: "TOTAL",
      groupKey,
      totalStudents: subTotal,
      notPaid: subNotPaid,
      receivableAmt: subReceivable,
      collectedAmt: subCollected,
      pendingAmt: Math.max(0, subReceivable - subCollected),
      receivableNos: subReceivableNos,
      collectedNos: subCollectedNos,
      pendingNos: subPendingNos,
      isSubtotal: true,
    });
  }

  const grandReceivable = detailRows.reduce((s, r) => s + r.receivableAmt, 0);
  const grandCollected = detailRows.reduce((s, r) => s + r.collectedAmt, 0);
  const grandReceivableNos = detailRows.reduce(
    (s, r) => s + r.receivableNos,
    0,
  );
  const grandCollectedNos = detailRows.reduce((s, r) => s + r.collectedNos, 0);
  const grandPendingNos = detailRows.reduce((s, r) => s + r.pendingNos, 0);

  if (ugTotal.total > 0) {
    const ugRows = detailRows.filter(
      (r) => !["MA", "M.COM"].includes(r.groupKey),
    );
    const ugReceivable = ugRows.reduce((s, r) => s + r.receivableAmt, 0);
    const ugCollected = ugRows.reduce((s, r) => s + r.collectedAmt, 0);
    out.push({
      index: 0,
      courseName: "UG TOTAL",
      groupKey: "UG",
      totalStudents: ugTotal.total,
      notPaid: ugTotal.notPaid,
      receivableAmt: ugReceivable,
      collectedAmt: ugCollected,
      pendingAmt: Math.max(0, ugReceivable - ugCollected),
      receivableNos: ugRows.reduce((s, r) => s + r.receivableNos, 0),
      collectedNos: ugRows.reduce((s, r) => s + r.collectedNos, 0),
      pendingNos: ugRows.reduce((s, r) => s + r.pendingNos, 0),
      isSubtotal: true,
    });
  }

  out.push({
    index: 0,
    courseName: "ALL COURSE TOTAL",
    groupKey: "ALL",
    totalStudents: grandTotal.total,
    notPaid: grandTotal.notPaid,
    receivableAmt: grandReceivable,
    collectedAmt: grandCollected,
    pendingAmt: Math.max(0, grandReceivable - grandCollected),
    receivableNos: grandReceivableNos,
    collectedNos: grandCollectedNos,
    pendingNos: grandPendingNos,
    isGrandTotal: true,
  });

  return out;
}

export async function getFeeMisData(
  filtersInput: RealtimeTrackerFilters = {},
): Promise<FeeMisPayload> {
  const filters = canonicalRealtimeTrackerFilters(filtersInput);
  const feesFilters = toFeesDashboardFilters(filters);

  if (!hasDashboardScope(feesFilters)) {
    const [{ labels: semesterDisplayLabels }, courseRows] = await Promise.all([
      resolveClassDisplayLabels(filters.classIds),
      loadFeeMisCourseRows(filters),
    ]);
    return {
      updatedAt: new Date().toISOString(),
      filters,
      semesterDisplayLabels,
      courseRows,
      semesterRows: [],
      paidStatus: { paid: 0, unpaid: 0, paidPct: 0 },
    };
  }

  const scope = await resolveDashboardScope(feesFilters, {
    includeClosedPromotions: true,
  });

  const [{ labels: semesterDisplayLabels }, dashboard, courseRows] =
    await Promise.all([
      resolveClassDisplayLabels(filters.classIds),
      getFeesDashboardFeeMisSlice(feesFilters, scope),
      loadFeeMisCourseRows(filters, scope),
    ]);

  const semesterRows: FeeMisSemesterRow[] = dashboard.semesterBreakdown.map(
    (s) => ({
      semester: s.semester,
      receivableAmt: Math.round(s.receivable),
      receivableNos: s.eligibleStudents,
      collectedAmt: Math.round(s.collected),
      collectedNos: s.fullyPaidStudents,
      pendingAmt: Math.round(s.pending),
      pendingNos: s.unpaidStudents,
    }),
  );

  const paid = dashboard.fullyPaid;
  const unpaid = dashboard.partialOrUnpaid;
  const total = paid + unpaid;
  const paidPct = total > 0 ? Math.round((paid / total) * 10000) / 100 : 0;

  return {
    updatedAt: dashboard.updatedAt,
    filters,
    semesterDisplayLabels,
    courseRows,
    semesterRows,
    paidStatus: { paid, unpaid, paidPct },
  };
}

/** Backward-compatible wrapper for legacy sessionId/classId API. */
export async function getMisTableDataLegacy(
  sessionId?: number,
  classId?: number,
) {
  const filters: RealtimeTrackerFilters = {};
  if (sessionId) filters.sessionIds = [sessionId];
  if (classId) filters.classIds = [classId];
  const payload = await getAffiliationRegistrationData(filters);
  return {
    updatedAt: payload.updatedAt,
    sessionId,
    classId,
    data: payload.data,
  };
}

export async function getAffiliationDisplayLabel(
  affiliationIds?: number[],
): Promise<string> {
  if (!affiliationIds?.length) return "Affiliation Registration";
  const rows = await db
    .select({
      name: affiliationModel.name,
      shortName: affiliationModel.shortName,
    })
    .from(affiliationModel)
    .where(inArray(affiliationModel.id, affiliationIds));

  if (rows.length === 1) {
    const a = rows[0];
    const label = a.shortName?.trim() || a.name?.trim() || "Affiliation";
    return `${label} Registration`;
  }
  if (rows.length > 1) {
    return "Affiliation Registration";
  }
  return "Affiliation Registration";
}
