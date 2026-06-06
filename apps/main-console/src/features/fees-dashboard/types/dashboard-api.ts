import type { MetricValues } from "../data/dashboard-metrics";

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

export type FeesDashboardSection = "core" | "reports" | "all";

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
  fullyPaidStudents?: number;
  unpaidStudents?: number;
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
  /** Students with a fee mapping in scope for this program course × semester. */
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
  metrics: MetricValues;
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

export type FeesDashboardSocketUpdate = {
  id: string;
  type: "fees_dashboard_update";
  updatedAt: string;
  reason: string;
};
