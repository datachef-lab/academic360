import type { FeesDashboardFilters } from "@/features/fees-dashboard/types/dashboard-api";

/** Multi-select filters shared by both realtime tracker tabs. */
export type RealtimeTrackerFilters = FeesDashboardFilters & {
  sessionIds?: number[];
};

export type AffiliationRegistrationRow = {
  programCourseName: string;
  admitted: number;
  /** Distinct students holding an ID card (multiple issues/renewals count once). */
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
  semesterDisplayLabels: string[];
  courseRows: FeeMisCourseRow[];
  semesterRows: FeeMisSemesterRow[];
  paidStatus: { paid: number; unpaid: number; paidPct: number };
};

export type RealtimeTrackerTab = "affiliation" | "fee_mis";
