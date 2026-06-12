import { db } from "@/db/index.js";
import {
  academicYearModel,
  classModel,
  feeCategoryModel,
  feeGroupModel,
  feeGroupPromotionMappingModel,
  feeSlabModel,
  feeStructureModel,
  feeStudentMappingModel,
  paymentModel,
  programCourseModel,
  promotionModel,
  personalDetailsModel,
  studentModel,
  userModel,
} from "@repo/db/schemas";
import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

/** Paytm fee rows use ADMISSION; staff cash marking uses FEE (see payment.service). */
const FEE_PAYMENT_CONTEXTS = ["FEE", "ADMISSION"] as const;

function feePaymentContextWhere(): SQL {
  return inArray(paymentModel.context, [...FEE_PAYMENT_CONTEXTS]);
}

export type FeesDashboardFilters = {
  academicYearIds?: number[];
  programCourseIds?: number[];
  classIds?: number[];
  shiftIds?: number[];
  streamIds?: number[];
  courseLevelIds?: number[];
  regulationTypeIds?: number[];
  affiliationIds?: number[];
  categoryIds?: number[];
  religionIds?: number[];
  genders?: string[];
  paymentStatuses?: string[];
  paymentModes?: string[];
  transactionStatuses?: string[];
  dateFrom?: string;
  dateTo?: string;
  studentSearch?: string;
};

export type FeesDashboardMetrics = {
  fee_receivable: number;
  fee_collected: number;
  fee_pending: number;
  total_students: number;
  eligible_students: number;
  fully_paid: number;
  partial_or_unpaid: number;
  collection_rate: number;
  challans_generated: number;
  challans_pending: number;
  today_collected: number;
  today_challans: number;
  today_receipts: number;
  today_failed_payments: number;
  receipts_issued: number;
  challan_only: number;
  online_receipts: number;
  cash_receipts: number;
  cheque_receipts: number;
  cash_collected: number;
  online_collected: number;
  failed_payments: number;
  waived_amount: number;
  late_fee_due: number;
  fee_structures_total: number;
  semester_fee_scopes_open: number;
  fee_slabs_registered: number;
  fee_categories_count: number;
  fee_groups_count: number;
};

export type PaymentStatusRow = {
  status: string;
  count: number;
  amount: number;
  sharePct: number;
};

export type SemesterBreakdownRow = {
  semester: string;
  receivable: number;
  collected: number;
  pending: number;
  eligibleStudents: number;
  /** Distinct students with mapping fully paid (Fee MIS NOS — collected). */
  fullyPaidStudents: number;
  /** Distinct students with mapping unpaid / partial (Fee MIS NOS — pending). */
  unpaidStudents: number;
  challansGenerated: number;
  challanPending: number;
  challanOnly: number;
  receiptsIssued: number;
  onlineCollected: number;
  cashCollected: number;
  chequeCollected: number;
  structuresCount: number;
  transactionsCount: number;
};

export type HourlyActivityRow = {
  hour: string;
  /** Successful linked payments (chart line). */
  txns: number;
  success: number;
  failed: number;
};

export type MixRow = {
  name: string;
  count: number;
  amount: number;
};

export type PaymentChannelRow = {
  channel: string;
  studentCount: number;
  amount: number;
};

export type ChallansByProgramRow = {
  program: string;
  programCourse: string;
  generated: number;
  pending: number;
};

export type EnrollmentMatrixCell = {
  paid: number;
  notPaid: number;
  /** Distinct students with a fee mapping in scope for this program × semester. */
  eligible: number;
};

export type EnrollmentMatrixRow = {
  program: string;
  bySemester: Record<string, EnrollmentMatrixCell>;
};

export type CollectionTrendRow = {
  monthLabel: string;
  collected: number;
  pending: number;
};

export type PromotionBreakdownRow = {
  programCourse: string;
  semester: string;
  session: string;
  eligible: number;
  receivable: number;
  collected: number;
};

export type SlabBreakdownRow = {
  slabName: string;
  semester: string;
  eligible: number;
  fullyPaid: number;
  partialUnpaid: number;
  challanGenerated: number;
};

export type FeesDashboardPayload = {
  metrics: FeesDashboardMetrics;
  paymentStatus: PaymentStatusRow[];
  semesterBreakdown: SemesterBreakdownRow[];
  hourlyActivity: HourlyActivityRow[];
  transactionMix: MixRow[];
  paymentChannels: PaymentChannelRow[];
  gatewayMix: MixRow[];
  challansByProgram: ChallansByProgramRow[];
  enrollmentMatrix: EnrollmentMatrixRow[];
  collectionTrend: CollectionTrendRow[];
  promotionBreakdown: PromotionBreakdownRow[];
  slabBreakdown: SlabBreakdownRow[];
  updatedAt: string;
};

/** Active portal users only — matches fee export "Active" student gate on user.isActive. */
const ACTIVE_USER_SQL = sql`COALESCE(${userModel.isActive}, true) = true`;

const PAID_MAPPING_SQL = sql`COALESCE(${feeStudentMappingModel.totalPayable}, 0) > 0 AND COALESCE(${feeStudentMappingModel.amountPaid}, 0) >= COALESCE(${feeStudentMappingModel.totalPayable}, 0)`;
const UNPAID_MAPPING_SQL = sql`COALESCE(${feeStudentMappingModel.totalPayable}, 0) > 0 AND COALESCE(${feeStudentMappingModel.amountPaid}, 0) < COALESCE(${feeStudentMappingModel.totalPayable}, 0)`;
const CHALLAN_OR_RECEIPT_SQL = sql`${feeStudentMappingModel.challanGeneratedAt} IS NOT NULL OR NULLIF(TRIM(COALESCE(${feeStudentMappingModel.receiptNumber}, '')), '') IS NOT NULL`;
const CHALLAN_ISSUED_SQL = sql`${feeStudentMappingModel.challanGeneratedAt} IS NOT NULL`;

/** Open, non-deprecated promotion row for the student. */
const ACTIVE_PROMOTION_ROW_SQL = sql`${promotionModel.endDate} IS NULL AND COALESCE(${promotionModel.isDeprecated}, false) = false`;

type MappingWhereOptions = {
  /** Live "today" widgets ignore dateFrom/dateTo on mapping.updatedAt. */
  forTodayLive?: boolean;
};

function resolveDashboardFilters(
  filters?: FeesDashboardFilters | null,
): FeesDashboardFilters {
  return filters ?? {};
}

export function hasDashboardScope(filters: FeesDashboardFilters): boolean {
  return Boolean(
    filters.academicYearIds?.length ||
    filters.programCourseIds?.length ||
    filters.classIds?.length ||
    filters.shiftIds?.length ||
    filters.streamIds?.length ||
    filters.courseLevelIds?.length ||
    filters.regulationTypeIds?.length ||
    filters.affiliationIds?.length ||
    filters.categoryIds?.length ||
    filters.religionIds?.length ||
    filters.genders?.length ||
    filters.paymentStatuses?.length ||
    filters.paymentModes?.length ||
    filters.transactionStatuses?.length ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.studentSearch?.trim(),
  );
}

function buildEmptyDashboardPayload(): FeesDashboardPayload {
  return {
    metrics: {
      fee_receivable: 0,
      fee_collected: 0,
      fee_pending: 0,
      total_students: 0,
      eligible_students: 0,
      fully_paid: 0,
      partial_or_unpaid: 0,
      collection_rate: 0,
      challans_generated: 0,
      challans_pending: 0,
      today_collected: 0,
      today_challans: 0,
      today_receipts: 0,
      today_failed_payments: 0,
      receipts_issued: 0,
      challan_only: 0,
      online_receipts: 0,
      cash_receipts: 0,
      cheque_receipts: 0,
      cash_collected: 0,
      online_collected: 0,
      failed_payments: 0,
      waived_amount: 0,
      late_fee_due: 0,
      fee_structures_total: 0,
      semester_fee_scopes_open: 0,
      fee_slabs_registered: 0,
      fee_categories_count: 0,
      fee_groups_count: 0,
    },
    paymentStatus: [],
    semesterBreakdown: [],
    hourlyActivity: [],
    transactionMix: [],
    paymentChannels: [],
    gatewayMix: [],
    challansByProgram: [],
    enrollmentMatrix: [],
    collectionTrend: [],
    promotionBreakdown: [],
    slabBreakdown: [],
    updatedAt: new Date().toISOString(),
  };
}

/** Calendar-day window in DB session TZ (Asia/Kolkata on app pool). */
const SQL_TODAY_START = sql`CURRENT_DATE`;
const SQL_TODAY_END = sql`CURRENT_DATE + INTERVAL '1 day'`;

function isTimestampToday(
  column:
    | typeof feeStudentMappingModel.challanGeneratedAt
    | typeof feeStudentMappingModel.updatedAt
    | typeof paymentModel.createdAt,
): SQL {
  return and(gte(column, SQL_TODAY_START), sql`${column} < ${SQL_TODAY_END}`)!;
}

/**
 * When the payment actually occurred (gateway / cash desk txnDate), not when the
 * row was inserted (legacy imports set createdAt to import time).
 */
/** Group gateways case-insensitively (Paytm vs PAYTM). */
const GATEWAY_VENDOR_KEY_SQL = sql`UPPER(COALESCE(NULLIF(TRIM(${paymentModel.paymentGatewayVendor}), ''), 'UNKNOWN'))`;

const GATEWAY_DISPLAY_LABELS: Record<string, string> = {
  PAYTM: "Paytm",
  RAZORPAY: "Razorpay",
  PHONEPE: "PhonePe",
  UNKNOWN: "Unknown",
};

function formatGatewayLabel(vendorKey: string): string {
  const key = vendorKey.trim().toUpperCase() || "UNKNOWN";
  return (
    GATEWAY_DISPLAY_LABELS[key] ?? key.charAt(0) + key.slice(1).toLowerCase()
  );
}

function mergeGatewayMixRows(rows: MixRow[]): MixRow[] {
  const byKey = new Map<string, MixRow>();
  for (const row of rows) {
    const key = row.name.trim().toUpperCase() || "UNKNOWN";
    const label = formatGatewayLabel(key);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { name: label, count: row.count, amount: row.amount });
      continue;
    }
    existing.count += row.count;
    existing.amount += row.amount;
  }
  return [...byKey.values()].map((r) => ({
    ...r,
    amount: Math.round(r.amount),
  }));
}

const PAYMENT_EVENT_TIME_SQL = sql`COALESCE(
  CASE
    WHEN NULLIF(TRIM(${paymentModel.txnDate}), '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
    THEN SUBSTRING(NULLIF(TRIM(${paymentModel.txnDate}), '') FROM 1 FOR 19)::timestamptz
    ELSE NULL
  END,
  ${paymentModel.createdAt}
)`;

function isPaymentEventToday(): SQL {
  return and(
    gte(PAYMENT_EVENT_TIME_SQL, SQL_TODAY_START),
    sql`${PAYMENT_EVENT_TIME_SQL} < ${SQL_TODAY_END}`,
  )!;
}

/** Staff-side fee activity that genuinely happened today (not rows merely touched today). */
const MAPPING_CHALLAN_TODAY_SQL = isTimestampToday(
  feeStudentMappingModel.challanGeneratedAt,
);

const MAPPING_RECEIPT_TODAY_SQL = and(
  sql`NULLIF(TRIM(COALESCE(${feeStudentMappingModel.receiptNumber}, '')), '') IS NOT NULL`,
  isTimestampToday(feeStudentMappingModel.updatedAt),
)!;

/** Structure filters for fee-student-mapping queries (shift is applied via active promotion). */
function buildMappingStructureScope(
  filtersInput?: FeesDashboardFilters | null,
): SQL | undefined {
  const filters = resolveDashboardFilters(filtersInput);
  const parts: SQL[] = [];
  if (filters.academicYearIds?.length) {
    parts.push(
      inArray(feeStructureModel.academicYearId, filters.academicYearIds),
    );
  }
  if (filters.programCourseIds?.length) {
    parts.push(
      inArray(feeStructureModel.programCourseId, filters.programCourseIds),
    );
  }
  if (filters.classIds?.length) {
    parts.push(inArray(feeStructureModel.classId, filters.classIds));
  }
  return parts.length ? and(...parts) : undefined;
}

/** Structure filters including shift — used when counting fee structures, not student mappings. */
function buildStructureScope(
  filtersInput?: FeesDashboardFilters | null,
): SQL | undefined {
  const filters = resolveDashboardFilters(filtersInput);
  const parts: SQL[] = [];
  const mappingScope = buildMappingStructureScope(filters);
  if (mappingScope) parts.push(mappingScope);
  const shiftIds = filters.shiftIds;
  if (shiftIds?.length) {
    parts.push(inArray(feeStructureModel.shiftId, shiftIds));
  }
  return parts.length ? and(...parts) : undefined;
}

/**
 * After a shift change, paid fees stay on the old shift's fee structure while the student's
 * active promotion carries the new shift. Closed promotions (exam history) may retain stale
 * mappings — exclude those and filter shift on promotion, not fee_structure.shift_id.
 *
 * When shift changes (especially close+clone), a student can briefly hold two fee_student_mapping
 * rows for the same active promotion (old + new shift structures). Pick one canonical row per
 * (student, promotion): prefer challan/receipt, then paid, then shift-aligned structure.
 */
function activePromotionJoinCondition(
  filtersInput?: FeesDashboardFilters | null,
): SQL {
  const filters = resolveDashboardFilters(filtersInput);
  const parts: SQL[] = [
    eq(promotionModel.id, feeGroupPromotionMappingModel.promotionId),
    ACTIVE_PROMOTION_ROW_SQL,
    eq(promotionModel.studentId, feeStudentMappingModel.studentId),
    eq(promotionModel.classId, feeStructureModel.classId),
    eq(promotionModel.programCourseId, feeStructureModel.programCourseId),
  ];
  const shiftIds = filters.shiftIds;
  if (shiftIds?.length) {
    parts.push(inArray(promotionModel.shiftId, shiftIds));
  }
  if (filters.classIds?.length) {
    parts.push(inArray(promotionModel.classId, filters.classIds));
  }
  return and(...parts)!;
}

/** FGPM rows linked to an open, non-deprecated promotion (shift filter when set). */
function activePromotionFgpmSubquery(
  filtersInput?: FeesDashboardFilters | null,
) {
  const filters = resolveDashboardFilters(filtersInput);
  const promoParts: SQL[] = [
    eq(promotionModel.id, feeGroupPromotionMappingModel.promotionId),
    ACTIVE_PROMOTION_ROW_SQL,
  ];
  const shiftIds = filters.shiftIds;
  if (shiftIds?.length) {
    promoParts.push(inArray(promotionModel.shiftId, shiftIds));
  }
  return db
    .select({ id: feeGroupPromotionMappingModel.id })
    .from(feeGroupPromotionMappingModel)
    .innerJoin(promotionModel, and(...promoParts)!);
}

function buildMappingScopeWhere(
  filtersInput?: FeesDashboardFilters | null,
  options?: MappingWhereOptions,
): SQL {
  const filters = resolveDashboardFilters(filtersInput);
  const parts: SQL[] = [ACTIVE_USER_SQL];
  const structureScope = buildMappingStructureScope(filters);
  if (structureScope) parts.push(structureScope);

  const programCourseScope = buildProgramCourseScope(filters);
  if (programCourseScope) parts.push(programCourseScope);

  const demographicScope = buildStudentDemographicScope(filters);
  if (demographicScope) parts.push(demographicScope);

  const paymentStatusScope = buildPaymentStatusScope(filters);
  if (paymentStatusScope) parts.push(paymentStatusScope);

  const paymentModeScope = buildPaymentModeScope(filters);
  if (paymentModeScope) parts.push(paymentModeScope);

  const transactionStatusScope = buildTransactionStatusScope(filters);
  if (transactionStatusScope) parts.push(transactionStatusScope);

  if (!options?.forTodayLive) {
    if (filters.dateFrom) {
      parts.push(
        gte(feeStudentMappingModel.updatedAt, new Date(filters.dateFrom)),
      );
    }
    if (filters.dateTo) {
      parts.push(
        lte(feeStudentMappingModel.updatedAt, new Date(filters.dateTo)),
      );
    }
  }

  const search = filters.studentSearch?.trim();
  if (search) {
    const pattern = `%${search}%`;
    parts.push(
      or(
        ilike(studentModel.uid, pattern),
        ilike(studentModel.rollNumber, pattern),
        ilike(userModel.name, pattern),
      )!,
    );
  }

  return and(...parts)!;
}

function canonicalActiveMappingIdsSubquery(
  filtersInput?: FeesDashboardFilters | null,
  options?: MappingWhereOptions,
) {
  const filters = resolveDashboardFilters(filtersInput);
  const scopeWhere = buildMappingScopeWhere(filters, options);

  return db
    .selectDistinctOn([feeStudentMappingModel.studentId, promotionModel.id], {
      id: feeStudentMappingModel.id,
    })
    .from(feeStudentMappingModel)
    .innerJoin(
      feeStructureModel,
      eq(feeStudentMappingModel.feeStructureId, feeStructureModel.id),
    )
    .innerJoin(
      feeGroupPromotionMappingModel,
      eq(
        feeGroupPromotionMappingModel.id,
        feeStudentMappingModel.feeGroupPromotionMappingId,
      ),
    )
    .innerJoin(promotionModel, activePromotionJoinCondition(filters))
    .innerJoin(
      studentModel,
      eq(studentModel.id, feeStudentMappingModel.studentId),
    )
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .where(scopeWhere)
    .orderBy(
      feeStudentMappingModel.studentId,
      promotionModel.id,
      desc(sql`CASE WHEN ${CHALLAN_OR_RECEIPT_SQL} THEN 1 ELSE 0 END`),
      desc(
        sql`CASE WHEN COALESCE(${feeStudentMappingModel.amountPaid}, 0) > 0 THEN 1 ELSE 0 END`,
      ),
      desc(
        sql`CASE WHEN ${feeStructureModel.shiftId} = ${promotionModel.shiftId} THEN 1 ELSE 0 END`,
      ),
      desc(feeStudentMappingModel.updatedAt),
      desc(feeStudentMappingModel.id),
    );
}

function buildProgramCourseScope(
  filtersInput?: FeesDashboardFilters | null,
): SQL | undefined {
  const filters = resolveDashboardFilters(filtersInput);
  const parts: SQL[] = [];
  if (filters.streamIds?.length) {
    parts.push(inArray(programCourseModel.streamId, filters.streamIds));
  }
  if (filters.courseLevelIds?.length) {
    parts.push(
      inArray(programCourseModel.courseLevelId, filters.courseLevelIds),
    );
  }
  if (filters.regulationTypeIds?.length) {
    parts.push(
      inArray(programCourseModel.regulationTypeId, filters.regulationTypeIds),
    );
  }
  if (filters.affiliationIds?.length) {
    parts.push(
      inArray(programCourseModel.affiliationId, filters.affiliationIds),
    );
  }
  if (!parts.length) return undefined;

  const matchingProgramCourses = db
    .select({ id: programCourseModel.id })
    .from(programCourseModel)
    .where(and(...parts));

  return inArray(feeStructureModel.programCourseId, matchingProgramCourses);
}

function buildStudentDemographicScope(
  filtersInput?: FeesDashboardFilters | null,
): SQL | undefined {
  const filters = resolveDashboardFilters(filtersInput);
  const pdParts: SQL[] = [];
  if (filters.categoryIds?.length) {
    pdParts.push(inArray(personalDetailsModel.categoryId, filters.categoryIds));
  }
  if (filters.religionIds?.length) {
    pdParts.push(inArray(personalDetailsModel.religionId, filters.religionIds));
  }
  if (filters.genders?.length) {
    pdParts.push(
      inArray(personalDetailsModel.gender, filters.genders as never),
    );
  }
  if (!pdParts.length) return undefined;

  const matchingStudents = db
    .select({ id: studentModel.id })
    .from(studentModel)
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .innerJoin(
      personalDetailsModel,
      eq(personalDetailsModel.userId, userModel.id),
    )
    .where(and(...pdParts));

  return inArray(feeStudentMappingModel.studentId, matchingStudents);
}

function buildPaymentStatusScope(
  filtersInput?: FeesDashboardFilters | null,
): SQL | undefined {
  const filters = resolveDashboardFilters(filtersInput);
  if (!filters.paymentStatuses?.length) return undefined;
  const parts: SQL[] = [];
  for (const status of filters.paymentStatuses) {
    const normalized = status.trim().toUpperCase();
    if (normalized === "PAID") parts.push(PAID_MAPPING_SQL);
    if (normalized === "UNPAID" || normalized === "PARTIAL") {
      parts.push(UNPAID_MAPPING_SQL);
    }
    if (normalized === "FAILED") {
      const failedMappings = db
        .select({ id: paymentModel.feeStudentMappingId })
        .from(paymentModel)
        .where(
          and(feePaymentContextWhere(), eq(paymentModel.status, "FAILED")),
        );
      parts.push(inArray(feeStudentMappingModel.id, failedMappings));
    }
  }
  return parts.length ? or(...parts) : undefined;
}

function buildPaymentModeScope(
  filtersInput?: FeesDashboardFilters | null,
): SQL | undefined {
  const filters = resolveDashboardFilters(filtersInput);
  if (!filters.paymentModes?.length) return undefined;
  const modes = filters.paymentModes.map((m) => m.trim().toUpperCase());
  const paymentMatches = db
    .select({ id: paymentModel.feeStudentMappingId })
    .from(paymentModel)
    .where(
      and(
        feePaymentContextWhere(),
        eq(paymentModel.isLinked, true),
        eq(paymentModel.status, "SUCCESS"),
        inArray(paymentModel.paymentMode, modes as never),
      ),
    );

  const parts: SQL[] = [inArray(feeStudentMappingModel.id, paymentMatches)];
  if (modes.includes("CASH") || modes.includes("CHEQUE")) {
    parts.push(
      sql`(COALESCE(${feeStudentMappingModel.amountPaid}, 0) > 0 OR NULLIF(TRIM(COALESCE(${feeStudentMappingModel.receiptNumber}, '')), '') IS NOT NULL)`,
    );
  }
  return or(...parts);
}

function buildTransactionStatusScope(
  filtersInput?: FeesDashboardFilters | null,
): SQL | undefined {
  const filters = resolveDashboardFilters(filtersInput);
  if (!filters.transactionStatuses?.length) return undefined;
  const statuses = filters.transactionStatuses.map((s) =>
    s.trim().toUpperCase(),
  );
  const paymentMatches = db
    .select({ id: paymentModel.feeStudentMappingId })
    .from(paymentModel)
    .where(
      and(
        feePaymentContextWhere(),
        inArray(paymentModel.status, statuses as never),
      ),
    );

  return inArray(feeStudentMappingModel.id, paymentMatches);
}

function buildMappingWhere(
  filtersInput?: FeesDashboardFilters | null,
  options?: MappingWhereOptions,
): SQL {
  const filters = resolveDashboardFilters(filtersInput);
  const scopeWhere = buildMappingScopeWhere(filters, options);
  return and(
    scopeWhere,
    inArray(
      feeStudentMappingModel.id,
      canonicalActiveMappingIdsSubquery(filters, options),
    ),
    inArray(
      feeStudentMappingModel.feeGroupPromotionMappingId,
      activePromotionFgpmSubquery(filters),
    ),
  )!;
}

export type FeesDashboardScope = {
  canonicalMappingIds: number[];
  filters: FeesDashboardFilters;
};

type DashboardScope = FeesDashboardScope;

const NO_MAPPING_SCOPE = sql`false`;

/** Scoped mapping rows by pre-resolved canonical ids (avoids re-running expensive subqueries). */
export function mappingIdsWhere(canonicalMappingIds: number[]): SQL {
  if (!canonicalMappingIds.length) return NO_MAPPING_SCOPE;
  return inArray(feeStudentMappingModel.id, canonicalMappingIds);
}

/** Payment rows limited to pre-resolved mapping ids — no join chain needed. */
function paymentScopeWhere(canonicalMappingIds: number[]): SQL {
  if (!canonicalMappingIds.length) return NO_MAPPING_SCOPE;
  return and(
    feePaymentContextWhere(),
    inArray(paymentModel.feeStudentMappingId, canonicalMappingIds),
  )!;
}

const CANONICAL_SCOPE_CACHE_TTL_MS = 90_000;
const canonicalScopeCache = new Map<
  string,
  { canonicalMappingIds: number[]; cachedAt: number }
>();

function canonicalScopeCacheKey(
  filters: FeesDashboardFilters,
  options?: MappingWhereOptions,
): string {
  return JSON.stringify({
    filters,
    forTodayLive: options?.forTodayLive ?? false,
  });
}

export function clearFeesDashboardScopeCache(): void {
  canonicalScopeCache.clear();
}

export async function resolveDashboardScope(
  filtersInput?: FeesDashboardFilters | null,
  options?: MappingWhereOptions,
): Promise<DashboardScope> {
  const filters = resolveDashboardFilters(filtersInput);
  const cacheKey = canonicalScopeCacheKey(filters, options);
  const cached = canonicalScopeCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CANONICAL_SCOPE_CACHE_TTL_MS) {
    return { canonicalMappingIds: cached.canonicalMappingIds, filters };
  }

  const canonicalRows = await canonicalActiveMappingIdsSubquery(
    filters,
    options,
  );
  const canonicalMappingIds = [
    ...new Set(
      canonicalRows
        .map((row) => row.id)
        .filter((id): id is number => id != null),
    ),
  ];
  canonicalScopeCache.set(cacheKey, {
    canonicalMappingIds,
    cachedAt: Date.now(),
  });
  return { canonicalMappingIds, filters };
}

export type FeesDashboardFeeMisSlice = {
  updatedAt: string;
  semesterBreakdown: SemesterBreakdownRow[];
  fullyPaid: number;
  partialOrUnpaid: number;
};

const EMPTY_FEE_MIS_SLICE: FeesDashboardFeeMisSlice = {
  updatedAt: new Date().toISOString(),
  semesterBreakdown: [],
  fullyPaid: 0,
  partialOrUnpaid: 0,
};

/** Lightweight dashboard data for realtime Fee MIS (avoids full "all" dashboard queries). */
export async function getFeesDashboardFeeMisSlice(
  rawFilters: FeesDashboardFilters = {},
  preResolvedScope?: FeesDashboardScope,
): Promise<FeesDashboardFeeMisSlice> {
  const filters = resolveDashboardFilters(rawFilters);
  if (!hasDashboardScope(filters)) {
    return { ...EMPTY_FEE_MIS_SLICE, updatedAt: new Date().toISOString() };
  }

  const scope = preResolvedScope ?? (await resolveDashboardScope(filters));
  if (!scope.canonicalMappingIds.length) {
    return { ...EMPTY_FEE_MIS_SLICE, updatedAt: new Date().toISOString() };
  }

  const mappingWhere = mappingIdsWhere(scope.canonicalMappingIds);
  const { canonicalMappingIds } = scope;

  const [coreStats, semesterBreakdown] = await Promise.all([
    loadCoreMappingStats(mappingWhere, canonicalMappingIds),
    loadSemesterBreakdown(mappingWhere, canonicalMappingIds),
  ]);

  return {
    updatedAt: new Date().toISOString(),
    semesterBreakdown,
    fullyPaid: coreStats.mappingAgg.fully_paid,
    partialOrUnpaid: coreStats.mappingAgg.partial_or_unpaid,
  };
}

async function loadMasterCounts(
  filtersInput?: FeesDashboardFilters | null,
): Promise<{
  fee_structures_total: number;
  fee_slabs_registered: number;
  fee_categories_count: number;
  fee_groups_count: number;
}> {
  const filters = resolveDashboardFilters(filtersInput);
  const scope = buildStructureScope(filters);

  const [[structures], [slabs], [categories], [groups]] = await Promise.all([
    scope
      ? db
          .select({
            count: sql<number>`COUNT(DISTINCT ${feeStructureModel.id})::int`,
          })
          .from(feeStructureModel)
          .where(scope)
      : db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(feeStructureModel),
    db.select({ count: sql<number>`COUNT(*)::int` }).from(feeSlabModel),
    db.select({ count: sql<number>`COUNT(*)::int` }).from(feeCategoryModel),
    db.select({ count: sql<number>`COUNT(*)::int` }).from(feeGroupModel),
  ]);

  return {
    fee_structures_total: Number(structures?.count ?? 0),
    fee_slabs_registered: Number(slabs?.count ?? 0),
    fee_categories_count: Number(categories?.count ?? 0),
    fee_groups_count: Number(groups?.count ?? 0),
  };
}

type MappingAggregateMetrics = {
  fee_receivable: number;
  fee_collected: number;
  fee_pending: number;
  eligible_students: number;
  fully_paid: number;
  partial_or_unpaid: number;
  collection_rate: number;
  challans_generated: number;
  challans_pending: number;
  receipts_issued: number;
  challan_only: number;
  waived_amount: number;
  today_challans: number;
  today_receipts: number;
};

function buildMappingAggregateMetrics(
  totals: Record<string, number | null | undefined> | undefined,
): MappingAggregateMetrics {
  const feeReceivable = Math.round(Number(totals?.fee_receivable ?? 0));
  const feeCollected = Math.round(Number(totals?.fee_collected ?? 0));
  const eligibleStudents = Number(totals?.eligible_students ?? 0);
  const fullyPaid = Number(totals?.fully_paid ?? 0);
  const partialOrUnpaid = Number(totals?.partial_or_unpaid ?? 0);
  const challansGenerated = Number(totals?.challans_generated ?? 0);

  return {
    fee_receivable: feeReceivable,
    fee_collected: feeCollected,
    fee_pending: Math.max(0, feeReceivable - feeCollected),
    eligible_students: eligibleStudents,
    fully_paid: fullyPaid,
    partial_or_unpaid: partialOrUnpaid,
    collection_rate:
      feeReceivable > 0
        ? Math.round((feeCollected / feeReceivable) * 1000) / 10
        : 0,
    challans_generated: challansGenerated,
    challans_pending: Math.max(0, eligibleStudents - challansGenerated),
    receipts_issued: Number(totals?.receipts_issued ?? 0),
    challan_only: Number(totals?.challan_only ?? 0),
    waived_amount: Math.round(Number(totals?.waived_amount ?? 0)),
    today_challans: Number(totals?.today_challans ?? 0),
    today_receipts: Number(totals?.today_receipts ?? 0),
  };
}

function buildPaymentStatusRows(
  row: {
    paidCount?: number | null;
    paidAmount?: number | null;
    unpaidCount?: number | null;
    unpaidAmount?: number | null;
  },
  failed?: { count: number; amount: number },
): PaymentStatusRow[] {
  const rows: PaymentStatusRow[] = [
    {
      status: "PAID",
      count: Number(row.paidCount ?? 0),
      amount: Math.round(Number(row.paidAmount ?? 0)),
      sharePct: 0,
    },
    {
      status: "UNPAID",
      count: Number(row.unpaidCount ?? 0),
      amount: Math.round(Number(row.unpaidAmount ?? 0)),
      sharePct: 0,
    },
  ];
  if (failed && (failed.count > 0 || failed.amount > 0)) {
    rows.push({
      status: "FAILED",
      count: failed.count,
      amount: Math.round(failed.amount),
      sharePct: 0,
    });
  }

  const visible = rows.filter((r) => r.count > 0 || r.amount > 0);
  const totalAmount = visible.reduce((s, r) => s + r.amount, 0);
  return visible.map((r) => ({
    ...r,
    sharePct:
      totalAmount > 0 ? Math.round((r.amount / totalAmount) * 1000) / 10 : 0,
  }));
}

/** Single scan for headline mapping metrics, student count, and payment-status breakdown. */
async function loadCoreMappingStats(
  mappingWhere: SQL,
  canonicalMappingIds: number[],
): Promise<{
  mappingAgg: MappingAggregateMetrics;
  totalStudents: number;
  paymentStatus: PaymentStatusRow[];
}> {
  const failedPaymentQuery =
    canonicalMappingIds.length > 0
      ? db
          .select({
            count: sql<number>`COUNT(*)::int`,
            amount: sql<number>`COALESCE(SUM(${paymentModel.amount}), 0)::float`,
          })
          .from(paymentModel)
          .where(
            and(
              paymentScopeWhere(canonicalMappingIds),
              eq(paymentModel.status, "FAILED"),
            ),
          )
      : Promise.resolve([{ count: 0, amount: 0 }]);

  const [[row], [failedPayment]] = await Promise.all([
    db
      .select({
        fee_receivable: sql<number>`COALESCE(SUM(${feeStudentMappingModel.totalPayable}), 0)::float`,
        fee_collected: sql<number>`COALESCE(SUM(COALESCE(${feeStudentMappingModel.amountPaid}, 0)), 0)::float`,
        eligible_students: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId})::int`,
        total_students: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId})::int`,
        fully_paid: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId}) FILTER (WHERE ${PAID_MAPPING_SQL})::int`,
        partial_or_unpaid: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId}) FILTER (WHERE ${UNPAID_MAPPING_SQL})::int`,
        challans_generated: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId}) FILTER (WHERE ${CHALLAN_ISSUED_SQL})::int`,
        receipts_issued: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId}) FILTER (WHERE NULLIF(TRIM(COALESCE(${feeStudentMappingModel.receiptNumber}, '')), '') IS NOT NULL)::int`,
        challan_only: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId}) FILTER (WHERE ${feeStudentMappingModel.challanGeneratedAt} IS NOT NULL AND NULLIF(TRIM(COALESCE(${feeStudentMappingModel.receiptNumber}, '')), '') IS NULL)::int`,
        waived_amount: sql<number>`COALESCE(SUM(CASE WHEN ${feeStudentMappingModel.isWaivedOff} THEN COALESCE(${feeStudentMappingModel.waivedOffAmount}, 0) ELSE 0 END), 0)::float`,
        today_challans: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId}) FILTER (WHERE ${MAPPING_CHALLAN_TODAY_SQL})::int`,
        today_receipts: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId}) FILTER (WHERE ${MAPPING_RECEIPT_TODAY_SQL})::int`,
        paidCount: sql<number>`COUNT(*) FILTER (WHERE ${PAID_MAPPING_SQL})::int`,
        paidAmount: sql<number>`COALESCE(SUM(CASE WHEN ${PAID_MAPPING_SQL} THEN COALESCE(${feeStudentMappingModel.amountPaid}, 0) ELSE 0 END), 0)::float`,
        unpaidCount: sql<number>`COUNT(*) FILTER (WHERE ${UNPAID_MAPPING_SQL})::int`,
        unpaidAmount: sql<number>`COALESCE(SUM(CASE WHEN ${UNPAID_MAPPING_SQL} THEN GREATEST(COALESCE(${feeStudentMappingModel.totalPayable}, 0) - COALESCE(${feeStudentMappingModel.amountPaid}, 0), 0) ELSE 0 END), 0)::float`,
      })
      .from(feeStudentMappingModel)
      .where(mappingWhere),
    failedPaymentQuery,
  ]);

  const failedCount = Number(failedPayment?.count ?? 0);
  const failedAmount = Number(failedPayment?.amount ?? 0);

  return {
    mappingAgg: buildMappingAggregateMetrics(row),
    totalStudents: Number(row?.total_students ?? 0),
    paymentStatus: buildPaymentStatusRows(row ?? {}, {
      count: failedCount,
      amount: failedAmount,
    }),
  };
}

const EMPTY_PAYMENT_AGG = {
  transactionMix: [] as MixRow[],
  gatewayMix: [] as MixRow[],
  paymentChannels: [] as PaymentChannelRow[],
  today_collected: 0,
  today_failed_payments: 0,
  online_receipts: 0,
  cash_receipts: 0,
  cheque_receipts: 0,
  online_collected: 0,
  cash_collected: 0,
  failed_payments: 0,
};

async function loadPaymentAggregates(canonicalMappingIds: number[]) {
  if (!canonicalMappingIds.length) return EMPTY_PAYMENT_AGG;

  const scoped = paymentScopeWhere(canonicalMappingIds);
  const linkedSuccess = and(
    scoped,
    eq(paymentModel.isLinked, true),
    eq(paymentModel.status, "SUCCESS"),
  )!;

  const [statusRows, todayRows, todayFailedRows, modeRows, gatewayRows] =
    await Promise.all([
      db
        .select({
          status: paymentModel.status,
          count: sql<number>`COUNT(*)::int`,
          amount: sql<number>`COALESCE(SUM(${paymentModel.amount}), 0)::float`,
        })
        .from(paymentModel)
        .where(scoped)
        .groupBy(paymentModel.status),
      db
        .select({
          amount: sql<number>`COALESCE(SUM(${paymentModel.amount}), 0)::float`,
        })
        .from(paymentModel)
        .where(
          and(linkedSuccess, gte(paymentModel.createdAt, sql`CURRENT_DATE`)),
        ),
      db
        .select({
          count: sql<number>`COUNT(*)::int`,
        })
        .from(paymentModel)
        .where(
          and(
            scoped,
            eq(paymentModel.status, "FAILED"),
            gte(paymentModel.createdAt, sql`CURRENT_DATE`),
          ),
        ),
      db
        .select({
          mode: paymentModel.paymentMode,
          count: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId})::int`,
          amount: sql<number>`COALESCE(SUM(${paymentModel.amount}), 0)::float`,
        })
        .from(paymentModel)
        .innerJoin(
          feeStudentMappingModel,
          eq(feeStudentMappingModel.id, paymentModel.feeStudentMappingId),
        )
        .where(linkedSuccess)
        .groupBy(paymentModel.paymentMode),
      db
        .select({
          gateway: GATEWAY_VENDOR_KEY_SQL,
          count: sql<number>`COUNT(*)::int`,
          amount: sql<number>`COALESCE(SUM(${paymentModel.amount}), 0)::float`,
        })
        .from(paymentModel)
        .where(and(linkedSuccess, eq(paymentModel.paymentMode, "ONLINE")))
        .groupBy(GATEWAY_VENDOR_KEY_SQL),
    ]);

  const todayRow = todayRows[0];
  const todayFailedRow = todayFailedRows[0];

  const transactionMix = statusRows.map((r) => ({
    name: String(r.status),
    count: Number(r.count ?? 0),
    amount: Math.round(Number(r.amount ?? 0)),
  }));

  const onlineRow = modeRows.find((r) => r.mode === "ONLINE");
  const cashRow = modeRows.find((r) => r.mode === "CASH");
  const chequeRow = modeRows.find((r) => r.mode === "CHEQUE");

  return {
    transactionMix,
    gatewayMix: mergeGatewayMixRows(
      gatewayRows.map((r) => ({
        name: formatGatewayLabel(String(r.gateway ?? "UNKNOWN")),
        count: Number(r.count ?? 0),
        amount: Math.round(Number(r.amount ?? 0)),
      })),
    ),
    paymentChannels: modeRows.map((r) => ({
      channel: String(r.mode),
      studentCount: Number(r.count ?? 0),
      amount: Math.round(Number(r.amount ?? 0)),
    })),
    today_collected: Math.round(Number(todayRow?.amount ?? 0)),
    today_failed_payments: Number(todayFailedRow?.count ?? 0),
    online_receipts: Number(onlineRow?.count ?? 0),
    cash_receipts: Number(cashRow?.count ?? 0),
    cheque_receipts: Number(chequeRow?.count ?? 0),
    online_collected: Math.round(Number(onlineRow?.amount ?? 0)),
    cash_collected: Math.round(
      Number(cashRow?.amount ?? 0) + Number(chequeRow?.amount ?? 0),
    ),
    failed_payments: Number(
      statusRows.find((r) => r.status === "FAILED")?.count ?? 0,
    ),
  };
}

async function loadSemesterBreakdown(
  mappingWhere: SQL,
  canonicalMappingIds: number[],
): Promise<SemesterBreakdownRow[]> {
  const paymentScoped = paymentScopeWhere(canonicalMappingIds);

  const [rows, paymentBySemester] = await Promise.all([
    db
      .select({
        semester: classModel.name,
        receivable: sql<number>`COALESCE(SUM(${feeStudentMappingModel.totalPayable}), 0)::float`,
        collected: sql<number>`COALESCE(SUM(COALESCE(${feeStudentMappingModel.amountPaid}, 0)), 0)::float`,
        eligibleStudents: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId})::int`,
        fullyPaidStudents: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId}) FILTER (WHERE ${PAID_MAPPING_SQL})::int`,
        unpaidStudents: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId}) FILTER (WHERE ${UNPAID_MAPPING_SQL})::int`,
        challansGenerated: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId}) FILTER (WHERE ${CHALLAN_ISSUED_SQL})::int`,
        receiptsIssued: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId}) FILTER (WHERE NULLIF(TRIM(COALESCE(${feeStudentMappingModel.receiptNumber}, '')), '') IS NOT NULL)::int`,
        challanOnly: sql<number>`COUNT(*) FILTER (WHERE ${feeStudentMappingModel.challanGeneratedAt} IS NOT NULL AND NULLIF(TRIM(COALESCE(${feeStudentMappingModel.receiptNumber}, '')), '') IS NULL)::int`,
        paidEntries: sql<number>`COUNT(*) FILTER (WHERE COALESCE(${feeStudentMappingModel.amountPaid}, 0) > 0)::int`,
        structuresCount: sql<number>`COUNT(DISTINCT ${feeStructureModel.id})::int`,
      })
      .from(feeStudentMappingModel)
      .innerJoin(
        feeStructureModel,
        eq(feeStudentMappingModel.feeStructureId, feeStructureModel.id),
      )
      .innerJoin(classModel, eq(classModel.id, feeStructureModel.classId))
      .where(mappingWhere)
      .groupBy(classModel.id, classModel.name)
      .orderBy(classModel.id),
    db
      .select({
        semester: classModel.name,
        onlineCollected: sql<number>`COALESCE(SUM(CASE WHEN ${paymentModel.paymentMode} = 'ONLINE' AND ${paymentModel.status} = 'SUCCESS' AND ${paymentModel.isLinked} = true THEN ${paymentModel.amount} ELSE 0 END), 0)::float`,
        cashCollected: sql<number>`COALESCE(SUM(CASE WHEN ${paymentModel.paymentMode} = 'CASH' AND ${paymentModel.status} = 'SUCCESS' AND ${paymentModel.isLinked} = true THEN ${paymentModel.amount} ELSE 0 END), 0)::float`,
        chequeCollected: sql<number>`COALESCE(SUM(CASE WHEN ${paymentModel.paymentMode} = 'CHEQUE' AND ${paymentModel.status} = 'SUCCESS' AND ${paymentModel.isLinked} = true THEN ${paymentModel.amount} ELSE 0 END), 0)::float`,
        transactionsCount: sql<number>`COUNT(${paymentModel.id})::int`,
      })
      .from(paymentModel)
      .innerJoin(
        feeStudentMappingModel,
        eq(feeStudentMappingModel.id, paymentModel.feeStudentMappingId),
      )
      .innerJoin(
        feeStructureModel,
        eq(feeStudentMappingModel.feeStructureId, feeStructureModel.id),
      )
      .innerJoin(classModel, eq(classModel.id, feeStructureModel.classId))
      .where(paymentScoped)
      .groupBy(classModel.id, classModel.name),
  ]);

  const paymentMap = new Map(paymentBySemester.map((r) => [r.semester, r]));

  return rows.map((r) => {
    const receivable = Math.round(Number(r.receivable ?? 0));
    const collected = Math.round(Number(r.collected ?? 0));
    const eligible = Number(r.eligibleStudents ?? 0);
    const challansGen = Number(r.challansGenerated ?? 0);
    const pay = paymentMap.get(r.semester ?? "");
    const onlineCollected = Math.round(Number(pay?.onlineCollected ?? 0));
    const cashCollected = Math.round(Number(pay?.cashCollected ?? 0));
    const chequeCollected = Math.round(Number(pay?.chequeCollected ?? 0));
    const paymentTxns = Number(pay?.transactionsCount ?? 0);
    const paidEntries = Number(r.paidEntries ?? 0);
    const offlineFromMapping =
      paymentTxns === 0 && paidEntries > 0
        ? Math.max(0, collected - onlineCollected)
        : cashCollected + chequeCollected;

    return {
      semester: r.semester ?? "Semester",
      receivable,
      collected,
      pending: Math.max(0, receivable - collected),
      eligibleStudents: eligible,
      fullyPaidStudents: Number(r.fullyPaidStudents ?? 0),
      unpaidStudents: Number(r.unpaidStudents ?? 0),
      challansGenerated: challansGen,
      challanPending: Math.max(0, eligible - challansGen),
      challanOnly: Number(r.challanOnly ?? 0),
      receiptsIssued: Number(r.receiptsIssued ?? 0),
      onlineCollected,
      cashCollected:
        paymentTxns === 0 && paidEntries > 0
          ? offlineFromMapping
          : cashCollected,
      chequeCollected:
        paymentTxns === 0 && paidEntries > 0 ? 0 : chequeCollected,
      structuresCount: Number(r.structuresCount ?? 0),
      transactionsCount: paymentTxns > 0 ? paymentTxns : paidEntries,
    };
  });
}

function normalizeHourKey(hour: string): string {
  const match = hour.trim().match(/^(\d{1,2})/);
  if (!match) return "00:00";
  return `${match[1]!.padStart(2, "0")}:00`;
}

/**
 * Fee payment attempts today by hour — institution-wide (not scoped to dashboard filters).
 * Shows all FEE/ADMISSION payments for the current calendar day.
 */
async function loadHourlyActivityToday(): Promise<HourlyActivityRow[]> {
  const scoped = feePaymentContextWhere();

  const [successRows, failedRows] = await Promise.all([
    db
      .select({
        hour: sql<string>`TO_CHAR(DATE_TRUNC('hour', ${PAYMENT_EVENT_TIME_SQL}), 'HH24:MI')`,
        count: sql<number>`COUNT(DISTINCT ${paymentModel.id})::int`,
      })
      .from(paymentModel)
      .where(
        and(
          scoped,
          eq(paymentModel.isLinked, true),
          eq(paymentModel.status, "SUCCESS"),
          isPaymentEventToday(),
        ),
      )
      .groupBy(sql`DATE_TRUNC('hour', ${PAYMENT_EVENT_TIME_SQL})`),
    db
      .select({
        hour: sql<string>`TO_CHAR(DATE_TRUNC('hour', ${paymentModel.createdAt}), 'HH24:MI')`,
        count: sql<number>`COUNT(DISTINCT ${paymentModel.id})::int`,
      })
      .from(paymentModel)
      .where(
        and(
          scoped,
          eq(paymentModel.status, "FAILED"),
          isTimestampToday(paymentModel.createdAt),
        ),
      )
      .groupBy(sql`DATE_TRUNC('hour', ${paymentModel.createdAt})`),
  ]);

  const successByHour = new Map<string, number>();
  for (const row of successRows) {
    successByHour.set(
      normalizeHourKey(String(row.hour ?? "00:00")),
      Number(row.count ?? 0),
    );
  }

  const failedByHour = new Map<string, number>();
  for (const row of failedRows) {
    failedByHour.set(
      normalizeHourKey(String(row.hour ?? "00:00")),
      Number(row.count ?? 0),
    );
  }

  const [nowRow] = await db
    .select({ currentHour: sql<number>`EXTRACT(HOUR FROM NOW())::int` })
    .from(studentModel)
    .limit(1);
  const currentHour = Number(nowRow?.currentHour ?? 0);

  const slots: HourlyActivityRow[] = [];
  for (let h = 0; h <= currentHour; h++) {
    const key = `${String(h).padStart(2, "0")}:00`;
    const success = successByHour.get(key) ?? 0;
    const failed = failedByHour.get(key) ?? 0;
    slots.push({ hour: key, success, failed, txns: success });
  }
  return slots;
}

async function loadTodayLiveMetrics(canonicalMappingIds: number[]): Promise<{
  today_collected: number;
  today_challans: number;
  today_receipts: number;
  today_failed_payments: number;
}> {
  if (!canonicalMappingIds.length) {
    return {
      today_collected: 0,
      today_challans: 0,
      today_receipts: 0,
      today_failed_payments: 0,
    };
  }

  const paymentScoped = paymentScopeWhere(canonicalMappingIds);
  const mappingWhere = mappingIdsWhere(canonicalMappingIds);

  const [collectedRows, challansRows, receiptsRows, failedRows] =
    await Promise.all([
      db
        .select({
          amount: sql<number>`COALESCE(SUM(${paymentModel.amount}), 0)::float`,
        })
        .from(paymentModel)
        .where(
          and(
            paymentScoped,
            eq(paymentModel.isLinked, true),
            eq(paymentModel.status, "SUCCESS"),
            isPaymentEventToday(),
          ),
        ),
      db
        .select({
          count: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId})::int`,
        })
        .from(feeStudentMappingModel)
        .where(and(mappingWhere, MAPPING_CHALLAN_TODAY_SQL)),
      db
        .select({
          count: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId})::int`,
        })
        .from(feeStudentMappingModel)
        .where(and(mappingWhere, MAPPING_RECEIPT_TODAY_SQL)),
      db
        .select({
          count: sql<number>`COUNT(DISTINCT ${paymentModel.id})::int`,
        })
        .from(paymentModel)
        .where(
          and(
            paymentScoped,
            eq(paymentModel.status, "FAILED"),
            isTimestampToday(paymentModel.createdAt),
          ),
        ),
    ]);

  const collectedRow = collectedRows[0];
  const challansRow = challansRows[0];
  const receiptsRow = receiptsRows[0];
  const failedRow = failedRows[0];

  return {
    today_collected: Math.round(Number(collectedRow?.amount ?? 0)),
    today_challans: Number(challansRow?.count ?? 0),
    today_receipts: Number(receiptsRow?.count ?? 0),
    today_failed_payments: Number(failedRow?.count ?? 0),
  };
}

async function loadLegacyDeskCashChannelRow(
  mappingWhere: SQL,
): Promise<PaymentChannelRow | null> {
  const hasCollection = sql`COALESCE(${feeStudentMappingModel.amountPaid}, 0) > 0 OR NULLIF(TRIM(COALESCE(${feeStudentMappingModel.receiptNumber}, '')), '') IS NOT NULL`;
  const noLinkedSuccessOnMapping = sql`NOT EXISTS (
    SELECT 1
    FROM ${paymentModel}
    WHERE ${paymentModel.feeStudentMappingId} = ${feeStudentMappingModel.id}
      AND ${paymentModel.context} IN ('FEE', 'ADMISSION')
      AND ${paymentModel.isLinked} = true
      AND ${paymentModel.status} = 'SUCCESS'
  )`;

  const [staffCashRow] = await db
    .select({
      studentCount: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId})::int`,
      amount: sql<number>`COALESCE(SUM(COALESCE(${feeStudentMappingModel.amountPaid}, 0)), 0)::float`,
    })
    .from(feeStudentMappingModel)
    .where(and(mappingWhere, hasCollection, noLinkedSuccessOnMapping));

  const studentCount = Number(staffCashRow?.studentCount ?? 0);
  const amount = Math.round(Number(staffCashRow?.amount ?? 0));
  if (studentCount <= 0 && amount <= 0) return null;

  return { channel: "CASH", studentCount, amount };
}

function mergePaymentChannelRows(
  ...groups: (PaymentChannelRow | PaymentChannelRow[])[]
): PaymentChannelRow[] {
  const byChannel = new Map<string, PaymentChannelRow>();
  for (const group of groups) {
    const rows = Array.isArray(group) ? group : [group];
    for (const row of rows) {
      if (row.amount <= 0 && row.studentCount <= 0) continue;
      const key = row.channel.toUpperCase();
      const existing = byChannel.get(key);
      if (!existing) {
        byChannel.set(key, { ...row, channel: key });
        continue;
      }
      existing.studentCount += row.studentCount;
      existing.amount += row.amount;
    }
  }
  return [...byChannel.values()];
}

async function loadMappingCollectionTrend(
  whereClause: SQL,
  totalReceivable = 0,
): Promise<CollectionTrendRow[]> {
  const rows = await db
    .select({
      monthLabel: sql<string>`TRIM(TO_CHAR(DATE_TRUNC('month', ${feeStudentMappingModel.updatedAt}), 'FMMonth YYYY'))`,
      collected: sql<number>`COALESCE(SUM(COALESCE(${feeStudentMappingModel.amountPaid}, 0)), 0)::float`,
    })
    .from(feeStudentMappingModel)
    .innerJoin(
      feeStructureModel,
      eq(feeStudentMappingModel.feeStructureId, feeStructureModel.id),
    )
    .where(
      and(
        whereClause,
        sql`COALESCE(${feeStudentMappingModel.amountPaid}, 0) > 0`,
        gte(
          feeStudentMappingModel.updatedAt,
          sql`CURRENT_DATE - INTERVAL '12 months'`,
        ),
      ),
    )
    .groupBy(sql`DATE_TRUNC('month', ${feeStudentMappingModel.updatedAt})`)
    .orderBy(sql`DATE_TRUNC('month', ${feeStudentMappingModel.updatedAt})`);

  const totalRecLakh = totalReceivable / 100_000;
  let cumulativeLakh = 0;

  return rows.map((r) => {
    const collectedLakh =
      Math.round((Number(r.collected ?? 0) / 100_000) * 10) / 10;
    cumulativeLakh += collectedLakh;
    return {
      monthLabel: String(r.monthLabel ?? ""),
      collected: collectedLakh,
      pending: Math.max(
        0,
        Math.round((totalRecLakh - cumulativeLakh) * 10) / 10,
      ),
    };
  });
}

function mergeCollectionTrends(
  paymentTrend: CollectionTrendRow[],
  mappingTrend: CollectionTrendRow[],
): CollectionTrendRow[] {
  if (paymentTrend.length === 0) return mappingTrend;
  if (mappingTrend.length === 0) return paymentTrend;

  const byMonth = new Map<string, CollectionTrendRow>();
  for (const row of [...paymentTrend, ...mappingTrend]) {
    const existing = byMonth.get(row.monthLabel);
    if (!existing) {
      byMonth.set(row.monthLabel, { ...row });
      continue;
    }
    existing.collected =
      Math.round((existing.collected + row.collected) * 10) / 10;
    existing.pending = Math.min(existing.pending, row.pending);
  }
  return [...byMonth.values()];
}

function buildMappingTransactionMix(
  mappingAgg: MappingAggregateMetrics,
): MixRow[] {
  const rows: MixRow[] = [];
  if (mappingAgg.fully_paid > 0) {
    rows.push({
      name: "PAID",
      count: mappingAgg.fully_paid,
      amount: mappingAgg.fee_collected,
    });
  }
  if (mappingAgg.partial_or_unpaid > 0) {
    rows.push({
      name: "PARTIAL/UNPAID",
      count: mappingAgg.partial_or_unpaid,
      amount: mappingAgg.fee_pending,
    });
  }
  return rows;
}

async function loadChallansByProgram(
  whereClause: SQL,
): Promise<ChallansByProgramRow[]> {
  const rows = await db
    .select({
      program: programCourseModel.shortName,
      programName: programCourseModel.name,
      generated: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId}) FILTER (WHERE ${CHALLAN_ISSUED_SQL})::int`,
      pending: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId}) FILTER (WHERE NOT (${CHALLAN_ISSUED_SQL}))::int`,
    })
    .from(feeStudentMappingModel)
    .innerJoin(
      feeStructureModel,
      eq(feeStudentMappingModel.feeStructureId, feeStructureModel.id),
    )
    .innerJoin(
      programCourseModel,
      eq(programCourseModel.id, feeStructureModel.programCourseId),
    )
    .where(whereClause)
    .groupBy(
      programCourseModel.id,
      programCourseModel.shortName,
      programCourseModel.name,
    )
    .orderBy(programCourseModel.name)
    .limit(12);

  return rows.map((r) => {
    const program = r.program?.trim() || r.programName?.trim() || "Program";
    const full = r.programName?.trim() || program;
    return {
      program,
      programCourse: full,
      generated: Number(r.generated ?? 0),
      pending: Number(r.pending ?? 0),
    };
  });
}

async function loadEnrollmentMatrix(
  whereClause: SQL,
): Promise<EnrollmentMatrixRow[]> {
  const rows = await db
    .select({
      programShort: programCourseModel.shortName,
      programName: programCourseModel.name,
      semester: classModel.name,
      paid: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId}) FILTER (WHERE ${PAID_MAPPING_SQL})::int`,
      notPaid: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId}) FILTER (WHERE ${UNPAID_MAPPING_SQL})::int`,
      eligible: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId})::int`,
    })
    .from(feeStudentMappingModel)
    .innerJoin(
      feeStructureModel,
      eq(feeStudentMappingModel.feeStructureId, feeStructureModel.id),
    )
    .innerJoin(
      programCourseModel,
      eq(programCourseModel.id, feeStructureModel.programCourseId),
    )
    .innerJoin(classModel, eq(classModel.id, feeStructureModel.classId))
    .where(whereClause)
    .groupBy(
      programCourseModel.id,
      programCourseModel.shortName,
      programCourseModel.name,
      classModel.id,
      classModel.name,
    )
    .orderBy(programCourseModel.name, classModel.id);

  const byProgram = new Map<string, EnrollmentMatrixRow>();
  for (const row of rows) {
    const program =
      row.programShort?.trim() || row.programName?.trim() || "Program course";
    const semester = String(row.semester ?? "Semester");
    if (!byProgram.has(program)) {
      byProgram.set(program, { program, bySemester: {} });
    }
    byProgram.get(program)!.bySemester[semester] = {
      paid: Number(row.paid ?? 0),
      notPaid: Number(row.notPaid ?? 0),
      eligible: Number(row.eligible ?? 0),
    };
  }

  return [...byProgram.values()];
}

async function loadSlabBreakdown(
  whereClause: SQL,
): Promise<SlabBreakdownRow[]> {
  const rows = await db
    .select({
      slabName: feeSlabModel.name,
      semester: classModel.name,
      eligible: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId})::int`,
      fullyPaid: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId}) FILTER (WHERE ${PAID_MAPPING_SQL})::int`,
      partialUnpaid: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId}) FILTER (WHERE ${UNPAID_MAPPING_SQL})::int`,
      challanGenerated: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId}) FILTER (WHERE ${CHALLAN_ISSUED_SQL})::int`,
    })
    .from(feeStudentMappingModel)
    .innerJoin(
      feeStructureModel,
      eq(feeStudentMappingModel.feeStructureId, feeStructureModel.id),
    )
    .innerJoin(
      feeGroupPromotionMappingModel,
      eq(
        feeGroupPromotionMappingModel.id,
        feeStudentMappingModel.feeGroupPromotionMappingId,
      ),
    )
    .innerJoin(
      feeGroupModel,
      eq(feeGroupModel.id, feeGroupPromotionMappingModel.feeGroupId),
    )
    .innerJoin(feeSlabModel, eq(feeSlabModel.id, feeGroupModel.feeSlabId))
    .innerJoin(classModel, eq(classModel.id, feeStructureModel.classId))
    .where(whereClause)
    .groupBy(feeSlabModel.id, feeSlabModel.name, classModel.id, classModel.name)
    .orderBy(feeSlabModel.name, classModel.id);

  return rows.map((r) => ({
    slabName: String(r.slabName ?? "Slab"),
    semester: String(r.semester ?? "Semester"),
    eligible: Number(r.eligible ?? 0),
    fullyPaid: Number(r.fullyPaid ?? 0),
    partialUnpaid: Number(r.partialUnpaid ?? 0),
    challanGenerated: Number(r.challanGenerated ?? 0),
  }));
}

async function loadCollectionTrend(
  canonicalMappingIds: number[],
  totalReceivable = 0,
): Promise<CollectionTrendRow[]> {
  if (!canonicalMappingIds.length) return [];

  const scoped = paymentScopeWhere(canonicalMappingIds);

  const rows = await db
    .select({
      monthLabel: sql<string>`TRIM(TO_CHAR(DATE_TRUNC('month', ${paymentModel.createdAt}), 'FMMonth YYYY'))`,
      collected: sql<number>`COALESCE(SUM(CASE WHEN ${paymentModel.status} = 'SUCCESS' AND ${paymentModel.isLinked} = true THEN ${paymentModel.amount} ELSE 0 END), 0)::float`,
    })
    .from(paymentModel)
    .where(
      and(
        scoped,
        gte(paymentModel.createdAt, sql`CURRENT_DATE - INTERVAL '12 months'`),
      ),
    )
    .groupBy(sql`DATE_TRUNC('month', ${paymentModel.createdAt})`)
    .orderBy(sql`DATE_TRUNC('month', ${paymentModel.createdAt})`);

  const totalRecLakh = totalReceivable / 100_000;
  let cumulativeLakh = 0;

  return rows.map((r) => {
    const collectedLakh =
      Math.round((Number(r.collected ?? 0) / 100_000) * 10) / 10;
    cumulativeLakh += collectedLakh;
    return {
      monthLabel: String(r.monthLabel ?? ""),
      collected: collectedLakh,
      pending: Math.max(
        0,
        Math.round((totalRecLakh - cumulativeLakh) * 10) / 10,
      ),
    };
  });
}

async function loadPromotionBreakdown(
  whereClause: SQL,
): Promise<PromotionBreakdownRow[]> {
  const rows = await db
    .select({
      programShort: programCourseModel.shortName,
      programName: programCourseModel.name,
      semester: classModel.name,
      session: academicYearModel.year,
      eligible: sql<number>`COUNT(DISTINCT ${feeStudentMappingModel.studentId})::int`,
      receivable: sql<number>`COALESCE(SUM(${feeStudentMappingModel.totalPayable}), 0)::float`,
      collected: sql<number>`COALESCE(SUM(COALESCE(${feeStudentMappingModel.amountPaid}, 0)), 0)::float`,
    })
    .from(feeStudentMappingModel)
    .innerJoin(
      feeStructureModel,
      eq(feeStudentMappingModel.feeStructureId, feeStructureModel.id),
    )
    .innerJoin(
      programCourseModel,
      eq(programCourseModel.id, feeStructureModel.programCourseId),
    )
    .innerJoin(
      academicYearModel,
      eq(academicYearModel.id, feeStructureModel.academicYearId),
    )
    .innerJoin(classModel, eq(classModel.id, feeStructureModel.classId))
    .where(whereClause)
    .groupBy(
      programCourseModel.id,
      programCourseModel.shortName,
      programCourseModel.name,
      classModel.id,
      classModel.name,
      academicYearModel.id,
      academicYearModel.year,
    )
    .orderBy(programCourseModel.name, classModel.id)
    .limit(40);

  return rows.map((r) => {
    const short = r.programShort?.trim();
    const full = r.programName?.trim() ?? "Program";
    const programCourse = short ? `${short} · ${full}` : full;
    return {
      programCourse,
      semester: String(r.semester ?? "—"),
      session: String(r.session ?? "—"),
      eligible: Number(r.eligible ?? 0),
      receivable: Math.round(Number(r.receivable ?? 0)),
      collected: Math.round(Number(r.collected ?? 0)),
    };
  });
}

function channelAmounts(channels: PaymentChannelRow[]) {
  const map = new Map(channels.map((c) => [c.channel.toUpperCase(), c]));
  const online = map.get("ONLINE");
  const cash = map.get("CASH");
  const cheque = map.get("CHEQUE");
  return {
    onlineAmount: online?.amount ?? 0,
    cashAmount: (cash?.amount ?? 0) + (cheque?.amount ?? 0),
    onlineStudents: online?.studentCount ?? 0,
    cashStudents: cash?.studentCount ?? 0,
    chequeStudents: cheque?.studentCount ?? 0,
  };
}

export type FeesDashboardSection = "core" | "reports" | "all";

async function loadReportsBundle(mappingWhere: SQL) {
  const [
    challansByProgram,
    enrollmentMatrix,
    slabBreakdown,
    promotionBreakdown,
  ] = await Promise.all([
    loadChallansByProgram(mappingWhere),
    loadEnrollmentMatrix(mappingWhere),
    loadSlabBreakdown(mappingWhere),
    loadPromotionBreakdown(mappingWhere),
  ]);
  return {
    challansByProgram,
    enrollmentMatrix,
    slabBreakdown,
    promotionBreakdown,
  };
}

export async function getFeesDashboardData(
  rawFilters: FeesDashboardFilters = {},
  section: FeesDashboardSection = "all",
): Promise<FeesDashboardPayload> {
  const filters = resolveDashboardFilters(rawFilters);
  if (!hasDashboardScope(filters)) {
    return buildEmptyDashboardPayload();
  }

  if (section === "reports") {
    const scope = await resolveDashboardScope(filters);
    if (!scope.canonicalMappingIds.length) {
      return buildEmptyDashboardPayload();
    }
    const reports = await loadReportsBundle(
      mappingIdsWhere(scope.canonicalMappingIds),
    );
    return {
      ...buildEmptyDashboardPayload(),
      ...reports,
      updatedAt: new Date().toISOString(),
    };
  }

  const scope = await resolveDashboardScope(filters);
  const hasDateWindow = Boolean(filters.dateFrom || filters.dateTo);
  const todayScope = hasDateWindow
    ? await resolveDashboardScope(filters, { forTodayLive: true })
    : scope;

  if (!scope.canonicalMappingIds.length) {
    return buildEmptyDashboardPayload();
  }

  const mappingWhere = mappingIdsWhere(scope.canonicalMappingIds);
  const { canonicalMappingIds } = scope;
  const todayMappingIds = todayScope.canonicalMappingIds;

  const includeReports = section === "all";

  const [
    coreStats,
    masterCounts,
    paymentAgg,
    semesterBreakdown,
    hourlyActivity,
    todayLive,
    challansByProgram,
    enrollmentMatrix,
    slabBreakdown,
    promotionBreakdown,
  ] = await Promise.all([
    loadCoreMappingStats(mappingWhere, canonicalMappingIds),
    loadMasterCounts(filters),
    loadPaymentAggregates(canonicalMappingIds),
    loadSemesterBreakdown(mappingWhere, canonicalMappingIds),
    loadHourlyActivityToday(),
    loadTodayLiveMetrics(todayMappingIds),
    includeReports
      ? loadChallansByProgram(mappingWhere)
      : Promise.resolve([] as ChallansByProgramRow[]),
    includeReports
      ? loadEnrollmentMatrix(mappingWhere)
      : Promise.resolve([] as EnrollmentMatrixRow[]),
    includeReports
      ? loadSlabBreakdown(mappingWhere)
      : Promise.resolve([] as SlabBreakdownRow[]),
    includeReports
      ? loadPromotionBreakdown(mappingWhere)
      : Promise.resolve([] as PromotionBreakdownRow[]),
  ]);

  const {
    mappingAgg,
    totalStudents,
    paymentStatus: mappingPaymentStatus,
  } = coreStats;

  const [collectionTrendFromPayments, legacyCashChannel] = await Promise.all([
    loadCollectionTrend(canonicalMappingIds, mappingAgg.fee_receivable),
    loadLegacyDeskCashChannelRow(mappingWhere),
  ]);

  const collectionTrendFromMappings =
    collectionTrendFromPayments.length > 0
      ? []
      : await loadMappingCollectionTrend(
          mappingWhere,
          mappingAgg.fee_receivable,
        );
  const collectionTrend = mergeCollectionTrends(
    collectionTrendFromPayments,
    collectionTrendFromMappings,
  );
  const paymentChannels = mergePaymentChannelRows(
    paymentAgg.paymentChannels,
    ...(legacyCashChannel ? [legacyCashChannel] : []),
  );
  const channelTotals = channelAmounts(paymentChannels);
  const transactionMix =
    paymentAgg.transactionMix.length > 0
      ? paymentAgg.transactionMix
      : buildMappingTransactionMix(mappingAgg);

  const onlineCollected = channelTotals.onlineAmount;
  const cashCollected =
    channelTotals.cashAmount > 0
      ? channelTotals.cashAmount
      : Math.max(0, mappingAgg.fee_collected - onlineCollected);

  const metrics: FeesDashboardMetrics = {
    ...masterCounts,
    ...mappingAgg,
    total_students: totalStudents,
    today_collected: todayLive.today_collected,
    today_failed_payments: todayLive.today_failed_payments,
    today_challans: todayLive.today_challans,
    today_receipts: todayLive.today_receipts,
    online_receipts: channelTotals.onlineStudents,
    cash_receipts: channelTotals.cashStudents,
    cheque_receipts: channelTotals.chequeStudents,
    cash_collected: cashCollected,
    online_collected: onlineCollected,
    failed_payments: paymentAgg.failed_payments,
    late_fee_due: 0,
    semester_fee_scopes_open: 0,
  };

  return {
    metrics,
    paymentStatus: mappingPaymentStatus,
    semesterBreakdown,
    hourlyActivity,
    transactionMix,
    paymentChannels,
    gatewayMix: paymentAgg.gatewayMix,
    challansByProgram,
    enrollmentMatrix,
    slabBreakdown,
    collectionTrend,
    promotionBreakdown,
    updatedAt: new Date().toISOString(),
  };
}
