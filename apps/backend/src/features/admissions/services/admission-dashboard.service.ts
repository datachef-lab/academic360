import { and, count, countDistinct, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  applicationFormModel,
  admissionModel,
  sessionModel,
  academicYearModel,
  admissionCourseDetailsModel,
  admissionProgramCourseModel,
  programCourseModel,
  admissionGeneralInfoModel,
  admissionAdditionalInfoModel,
  admissionAcademicInfoModel,
  personalDetailsModel,
  addressModel,
  healthModel,
  categoryModel,
  religionModel,
  nationalityModel,
  countryModel,
  stateModel,
  annualIncomeModel,
  bloodGroupModel,
  boardModel,
} from "@repo/db/schemas";

/**
 * Admission Home dashboard stats — built against the CANONICAL @repo/db schema
 * (NOT the legacy backend-local admission models). Every stat is filtered by
 * academic year through the session link:
 *   application_forms → admissions.sessionId → sessions.academicYearId
 */

export type DashboardFilters = {
  academicYearId?: number | null;
  level?: string | null;
  formStatus?: string | null;
};

export type Bucket = { key: string; label: string; count: number };

// Resolve the academic year to scope by: explicit id, else the current year.
async function resolveAcademicYearId(
  f: DashboardFilters,
): Promise<number | null> {
  if (f.academicYearId) return f.academicYearId;
  const [cur] = await db
    .select({ id: academicYearModel.id })
    .from(academicYearModel)
    .where(eq(academicYearModel.isCurrentYear, true))
    .limit(1);
  return cur?.id ?? null;
}

// Spine filters — applied to every query (each joins admissions + sessions).
function spineConds(academicYearId: number | null, f: DashboardFilters): SQL[] {
  const c: SQL[] = [];
  if (academicYearId) c.push(eq(sessionModel.academicYearId, academicYearId));
  if (f.level) c.push(eq(applicationFormModel.level, f.level as never));
  if (f.formStatus)
    c.push(eq(applicationFormModel.formStatus, f.formStatus as never));
  return c;
}

const asBuckets = (
  rows: Array<{ key: unknown; label: unknown; count: number | string }>,
): Bucket[] =>
  rows.map((r) => ({
    key: r.key == null ? "UNKNOWN" : String(r.key),
    label: r.label == null ? "Unspecified" : String(r.label),
    count: Number(r.count),
  }));

export async function getAdmissionDashboard(f: DashboardFilters) {
  const academicYearId = await resolveAcademicYearId(f);
  const where = and(...spineConds(academicYearId, f));

  // --- KPI row (application_forms funnel) ---
  const kpiP = db
    .select({
      total: count(applicationFormModel.id),
      drafts:
        sql<number>`count(*) filter (where ${applicationFormModel.formStatus} = 'DRAFT')`.mapWith(
          Number,
        ),
      submitted:
        sql<number>`count(*) filter (where ${applicationFormModel.formStatus} = 'SUBMITTED')`.mapWith(
          Number,
        ),
      approved:
        sql<number>`count(*) filter (where ${applicationFormModel.formStatus} = 'APPROVED')`.mapWith(
          Number,
        ),
      rejected:
        sql<number>`count(*) filter (where ${applicationFormModel.formStatus} = 'REJECTED')`.mapWith(
          Number,
        ),
      cancelled:
        sql<number>`count(*) filter (where ${applicationFormModel.formStatus} = 'CANCELLED')`.mapWith(
          Number,
        ),
      admitted:
        sql<number>`count(*) filter (where ${applicationFormModel.formStatus} = 'ADMITTED')`.mapWith(
          Number,
        ),
      blocked:
        sql<number>`count(*) filter (where ${applicationFormModel.isBlocked} = true)`.mapWith(
          Number,
        ),
    })
    .from(applicationFormModel)
    .innerJoin(
      admissionModel,
      eq(admissionModel.id, applicationFormModel.admissionId),
    )
    .innerJoin(sessionModel, eq(sessionModel.id, admissionModel.sessionId))
    .where(where);

  // --- KPI row (admission_course_details: payment / verify / merit) ---
  const courseKpiP = db
    .select({
      courseApplications: count(admissionCourseDetailsModel.id),
      paymentReceived:
        sql<number>`count(*) filter (where ${admissionCourseDetailsModel.receivedPayment} = true)`.mapWith(
          Number,
        ),
      paymentPending:
        sql<number>`count(*) filter (where ${admissionCourseDetailsModel.receivedPayment} = false)`.mapWith(
          Number,
        ),
      amountCollected:
        sql<number>`coalesce(sum(${admissionCourseDetailsModel.amount}) filter (where ${admissionCourseDetailsModel.receivedPayment} = true), 0)`.mapWith(
          Number,
        ),
      feesPaid:
        sql<number>`count(*) filter (where ${admissionCourseDetailsModel.isFeesPaid} = true)`.mapWith(
          Number,
        ),
      verified:
        sql<number>`count(*) filter (where ${admissionCourseDetailsModel.isVerified} = true)`.mapWith(
          Number,
        ),
      meritListed:
        sql<number>`count(*) filter (where ${admissionCourseDetailsModel.isMeritListed} = true)`.mapWith(
          Number,
        ),
      cancelled:
        sql<number>`count(*) filter (where ${admissionCourseDetailsModel.isCancelled} = true)`.mapWith(
          Number,
        ),
    })
    .from(admissionCourseDetailsModel)
    .innerJoin(
      applicationFormModel,
      eq(
        applicationFormModel.id,
        admissionCourseDetailsModel.applicationFormId,
      ),
    )
    .innerJoin(
      admissionModel,
      eq(admissionModel.id, applicationFormModel.admissionId),
    )
    .innerJoin(sessionModel, eq(sessionModel.id, admissionModel.sessionId))
    .where(where);

  // --- Spine-only breakdowns (no fan-out → count application_forms) ---
  const byStatusP = db
    .select({
      key: applicationFormModel.formStatus,
      label: applicationFormModel.formStatus,
      count: count(applicationFormModel.id),
    })
    .from(applicationFormModel)
    .innerJoin(
      admissionModel,
      eq(admissionModel.id, applicationFormModel.admissionId),
    )
    .innerJoin(sessionModel, eq(sessionModel.id, admissionModel.sessionId))
    .where(where)
    .groupBy(applicationFormModel.formStatus);

  const byLevelP = db
    .select({
      key: applicationFormModel.level,
      label: applicationFormModel.level,
      count: count(applicationFormModel.id),
    })
    .from(applicationFormModel)
    .innerJoin(
      admissionModel,
      eq(admissionModel.id, applicationFormModel.admissionId),
    )
    .innerJoin(sessionModel, eq(sessionModel.id, admissionModel.sessionId))
    .where(where)
    .groupBy(applicationFormModel.level);

  const byStepP = db
    .select({
      key: applicationFormModel.admissionStep,
      label: applicationFormModel.admissionStep,
      count: count(applicationFormModel.id),
    })
    .from(applicationFormModel)
    .innerJoin(
      admissionModel,
      eq(admissionModel.id, applicationFormModel.admissionId),
    )
    .innerJoin(sessionModel, eq(sessionModel.id, admissionModel.sessionId))
    .where(where)
    .groupBy(applicationFormModel.admissionStep);

  // --- Personal-details chain (general_info → personal_details) ---
  const byGenderP = db
    .select({
      key: personalDetailsModel.gender,
      label: personalDetailsModel.gender,
      count: countDistinct(applicationFormModel.id),
    })
    .from(applicationFormModel)
    .innerJoin(
      admissionModel,
      eq(admissionModel.id, applicationFormModel.admissionId),
    )
    .innerJoin(sessionModel, eq(sessionModel.id, admissionModel.sessionId))
    .leftJoin(
      admissionGeneralInfoModel,
      eq(admissionGeneralInfoModel.applicationFormId, applicationFormModel.id),
    )
    .leftJoin(
      personalDetailsModel,
      eq(
        personalDetailsModel.admissionGeneralInfoId,
        admissionGeneralInfoModel.id,
      ),
    )
    .where(where)
    .groupBy(personalDetailsModel.gender);

  const byCategoryP = db
    .select({
      key: categoryModel.id,
      label: categoryModel.name,
      count: countDistinct(applicationFormModel.id),
    })
    .from(applicationFormModel)
    .innerJoin(
      admissionModel,
      eq(admissionModel.id, applicationFormModel.admissionId),
    )
    .innerJoin(sessionModel, eq(sessionModel.id, admissionModel.sessionId))
    .leftJoin(
      admissionGeneralInfoModel,
      eq(admissionGeneralInfoModel.applicationFormId, applicationFormModel.id),
    )
    .leftJoin(
      personalDetailsModel,
      eq(
        personalDetailsModel.admissionGeneralInfoId,
        admissionGeneralInfoModel.id,
      ),
    )
    .leftJoin(
      categoryModel,
      eq(categoryModel.id, personalDetailsModel.categoryId),
    )
    .where(where)
    .groupBy(categoryModel.id, categoryModel.name);

  const byReligionP = db
    .select({
      key: religionModel.id,
      label: religionModel.name,
      count: countDistinct(applicationFormModel.id),
    })
    .from(applicationFormModel)
    .innerJoin(
      admissionModel,
      eq(admissionModel.id, applicationFormModel.admissionId),
    )
    .innerJoin(sessionModel, eq(sessionModel.id, admissionModel.sessionId))
    .leftJoin(
      admissionGeneralInfoModel,
      eq(admissionGeneralInfoModel.applicationFormId, applicationFormModel.id),
    )
    .leftJoin(
      personalDetailsModel,
      eq(
        personalDetailsModel.admissionGeneralInfoId,
        admissionGeneralInfoModel.id,
      ),
    )
    .leftJoin(
      religionModel,
      eq(religionModel.id, personalDetailsModel.religionId),
    )
    .where(where)
    .groupBy(religionModel.id, religionModel.name);

  const byNationalityP = db
    .select({
      key: nationalityModel.id,
      label: nationalityModel.name,
      count: countDistinct(applicationFormModel.id),
    })
    .from(applicationFormModel)
    .innerJoin(
      admissionModel,
      eq(admissionModel.id, applicationFormModel.admissionId),
    )
    .innerJoin(sessionModel, eq(sessionModel.id, admissionModel.sessionId))
    .leftJoin(
      admissionGeneralInfoModel,
      eq(admissionGeneralInfoModel.applicationFormId, applicationFormModel.id),
    )
    .leftJoin(
      personalDetailsModel,
      eq(
        personalDetailsModel.admissionGeneralInfoId,
        admissionGeneralInfoModel.id,
      ),
    )
    .leftJoin(
      nationalityModel,
      eq(nationalityModel.id, personalDetailsModel.nationalityId),
    )
    .where(where)
    .groupBy(nationalityModel.id, nationalityModel.name);

  const byBloodGroupP = db
    .select({
      key: bloodGroupModel.id,
      label: bloodGroupModel.type,
      count: countDistinct(applicationFormModel.id),
    })
    .from(applicationFormModel)
    .innerJoin(
      admissionModel,
      eq(admissionModel.id, applicationFormModel.admissionId),
    )
    .innerJoin(sessionModel, eq(sessionModel.id, admissionModel.sessionId))
    .leftJoin(
      admissionGeneralInfoModel,
      eq(admissionGeneralInfoModel.applicationFormId, applicationFormModel.id),
    )
    .leftJoin(
      healthModel,
      eq(healthModel.admissionGeneralInfoId, admissionGeneralInfoModel.id),
    )
    .leftJoin(bloodGroupModel, eq(bloodGroupModel.id, healthModel.bloodGroupId))
    .where(where)
    .groupBy(bloodGroupModel.id, bloodGroupModel.type);

  // --- Address chain (personal_details may have >1 address → countDistinct) ---
  const byCountryP = db
    .select({
      key: countryModel.id,
      label: countryModel.name,
      count: countDistinct(applicationFormModel.id),
    })
    .from(applicationFormModel)
    .innerJoin(
      admissionModel,
      eq(admissionModel.id, applicationFormModel.admissionId),
    )
    .innerJoin(sessionModel, eq(sessionModel.id, admissionModel.sessionId))
    .leftJoin(
      admissionGeneralInfoModel,
      eq(admissionGeneralInfoModel.applicationFormId, applicationFormModel.id),
    )
    .leftJoin(
      personalDetailsModel,
      eq(
        personalDetailsModel.admissionGeneralInfoId,
        admissionGeneralInfoModel.id,
      ),
    )
    .leftJoin(
      addressModel,
      eq(addressModel.personalDetailsId, personalDetailsModel.id),
    )
    .leftJoin(countryModel, eq(countryModel.id, addressModel.countryId))
    .where(where)
    .groupBy(countryModel.id, countryModel.name);

  const byStateP = db
    .select({
      key: stateModel.id,
      label: stateModel.name,
      count: countDistinct(applicationFormModel.id),
    })
    .from(applicationFormModel)
    .innerJoin(
      admissionModel,
      eq(admissionModel.id, applicationFormModel.admissionId),
    )
    .innerJoin(sessionModel, eq(sessionModel.id, admissionModel.sessionId))
    .leftJoin(
      admissionGeneralInfoModel,
      eq(admissionGeneralInfoModel.applicationFormId, applicationFormModel.id),
    )
    .leftJoin(
      personalDetailsModel,
      eq(
        personalDetailsModel.admissionGeneralInfoId,
        admissionGeneralInfoModel.id,
      ),
    )
    .leftJoin(
      addressModel,
      eq(addressModel.personalDetailsId, personalDetailsModel.id),
    )
    .leftJoin(stateModel, eq(stateModel.id, addressModel.stateId))
    .where(where)
    .groupBy(stateModel.id, stateModel.name);

  // --- Additional-info chain (annual income) ---
  const byIncomeP = db
    .select({
      key: annualIncomeModel.id,
      label: annualIncomeModel.range,
      count: countDistinct(applicationFormModel.id),
    })
    .from(applicationFormModel)
    .innerJoin(
      admissionModel,
      eq(admissionModel.id, applicationFormModel.admissionId),
    )
    .innerJoin(sessionModel, eq(sessionModel.id, admissionModel.sessionId))
    .leftJoin(
      admissionAdditionalInfoModel,
      eq(
        admissionAdditionalInfoModel.applicationFormId,
        applicationFormModel.id,
      ),
    )
    .leftJoin(
      annualIncomeModel,
      eq(annualIncomeModel.id, admissionAdditionalInfoModel.annualIncomeId),
    )
    .where(where)
    .groupBy(annualIncomeModel.id, annualIncomeModel.range);

  // --- Academic-info chain (board) ---
  const byBoardP = db
    .select({
      key: boardModel.id,
      label: boardModel.name,
      count: countDistinct(applicationFormModel.id),
    })
    .from(applicationFormModel)
    .innerJoin(
      admissionModel,
      eq(admissionModel.id, applicationFormModel.admissionId),
    )
    .innerJoin(sessionModel, eq(sessionModel.id, admissionModel.sessionId))
    .leftJoin(
      admissionAcademicInfoModel,
      eq(admissionAcademicInfoModel.applicationFormId, applicationFormModel.id),
    )
    .leftJoin(boardModel, eq(boardModel.id, admissionAcademicInfoModel.boardId))
    .where(where)
    .groupBy(boardModel.id, boardModel.name);

  // --- Program-course mix (course_details → admission_program_courses → program_courses) ---
  const byProgramCourseP = db
    .select({
      key: programCourseModel.id,
      label: programCourseModel.name,
      count: count(admissionCourseDetailsModel.id),
    })
    .from(admissionCourseDetailsModel)
    .innerJoin(
      applicationFormModel,
      eq(
        applicationFormModel.id,
        admissionCourseDetailsModel.applicationFormId,
      ),
    )
    .innerJoin(
      admissionModel,
      eq(admissionModel.id, applicationFormModel.admissionId),
    )
    .innerJoin(sessionModel, eq(sessionModel.id, admissionModel.sessionId))
    .leftJoin(
      admissionProgramCourseModel,
      eq(
        admissionProgramCourseModel.id,
        admissionCourseDetailsModel.admissionProgramCourseId,
      ),
    )
    .leftJoin(
      programCourseModel,
      eq(programCourseModel.id, admissionProgramCourseModel.programCourseId),
    )
    .where(where)
    .groupBy(programCourseModel.id, programCourseModel.name);

  // --- Special groups (flag-based; no direct quota-type FK in canonical schema) ---
  const specialP = db
    .select({
      sports:
        sql<number>`count(distinct ${applicationFormModel.id}) filter (where ${admissionAdditionalInfoModel.applyUnderSportsCategory} = true)`.mapWith(
          Number,
        ),
      ncc: sql<number>`count(distinct ${applicationFormModel.id}) filter (where ${admissionAdditionalInfoModel.applyUnderNCCCategory} = true)`.mapWith(
        Number,
      ),
      minority:
        sql<number>`count(distinct ${applicationFormModel.id}) filter (where ${admissionGeneralInfoModel.isMinority} = true)`.mapWith(
          Number,
        ),
    })
    .from(applicationFormModel)
    .innerJoin(
      admissionModel,
      eq(admissionModel.id, applicationFormModel.admissionId),
    )
    .innerJoin(sessionModel, eq(sessionModel.id, admissionModel.sessionId))
    .leftJoin(
      admissionAdditionalInfoModel,
      eq(
        admissionAdditionalInfoModel.applicationFormId,
        applicationFormModel.id,
      ),
    )
    .leftJoin(
      admissionGeneralInfoModel,
      eq(admissionGeneralInfoModel.applicationFormId, applicationFormModel.id),
    )
    .where(where);

  // --- Daily application trend (spine createdAt) ---
  const trendP = db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${applicationFormModel.createdAt}), 'YYYY-MM-DD')`,
      count: count(applicationFormModel.id),
    })
    .from(applicationFormModel)
    .innerJoin(
      admissionModel,
      eq(admissionModel.id, applicationFormModel.admissionId),
    )
    .innerJoin(sessionModel, eq(sessionModel.id, admissionModel.sessionId))
    .where(where)
    .groupBy(sql`date_trunc('day', ${applicationFormModel.createdAt})`)
    .orderBy(sql`date_trunc('day', ${applicationFormModel.createdAt})`);

  const [
    kpi,
    courseKpi,
    byStatus,
    byLevel,
    byStep,
    byGender,
    byCategory,
    byReligion,
    byNationality,
    byBloodGroup,
    byCountry,
    byState,
    byIncome,
    byBoard,
    byProgramCourse,
    special,
    trend,
  ] = await Promise.all([
    kpiP,
    courseKpiP,
    byStatusP,
    byLevelP,
    byStepP,
    byGenderP,
    byCategoryP,
    byReligionP,
    byNationalityP,
    byBloodGroupP,
    byCountryP,
    byStateP,
    byIncomeP,
    byBoardP,
    byProgramCourseP,
    specialP,
    trendP,
  ]);

  const k = kpi[0];
  const c = courseKpi[0];
  const sg = special[0];

  return {
    academicYearId,
    filters: { level: f.level ?? null, formStatus: f.formStatus ?? null },
    kpis: {
      totalApplications: Number(k?.total ?? 0),
      drafts: Number(k?.drafts ?? 0),
      submitted: Number(k?.submitted ?? 0),
      approved: Number(k?.approved ?? 0),
      rejected: Number(k?.rejected ?? 0),
      cancelled: Number(k?.cancelled ?? 0),
      admitted: Number(k?.admitted ?? 0),
      blocked: Number(k?.blocked ?? 0),
      courseApplications: Number(c?.courseApplications ?? 0),
      paymentReceived: Number(c?.paymentReceived ?? 0),
      paymentPending: Number(c?.paymentPending ?? 0),
      amountCollected: Number(c?.amountCollected ?? 0),
      feesPaid: Number(c?.feesPaid ?? 0),
      verified: Number(c?.verified ?? 0),
      meritListed: Number(c?.meritListed ?? 0),
      courseCancelled: Number(c?.cancelled ?? 0),
    },
    breakdowns: {
      byStatus: asBuckets(byStatus),
      byLevel: asBuckets(byLevel),
      byStep: asBuckets(byStep),
      byProgramCourse: asBuckets(byProgramCourse),
      byGender: asBuckets(byGender),
      byCategory: asBuckets(byCategory),
      byReligion: asBuckets(byReligion),
      byNationality: asBuckets(byNationality),
      byBloodGroup: asBuckets(byBloodGroup),
      byCountry: asBuckets(byCountry),
      byState: asBuckets(byState),
      byAnnualIncome: asBuckets(byIncome),
      byBoard: asBuckets(byBoard),
      specialGroups: [
        {
          key: "SPORTS",
          label: "Sports quota",
          count: Number(sg?.sports ?? 0),
        },
        { key: "NCC", label: "NCC", count: Number(sg?.ncc ?? 0) },
        {
          key: "MINORITY",
          label: "Minority",
          count: Number(sg?.minority ?? 0),
        },
      ] as Bucket[],
    },
    trend: trend.map((t) => ({ date: String(t.day), count: Number(t.count) })),
  };
}
