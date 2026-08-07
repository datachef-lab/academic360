import axiosInstance from "@/utils/api";

const BASE_URL = "/api/documents/dashboard";

type Payload<T> = { payload: T };

export type LedgerStatus =
  | "UPLOADED"
  | "PENDING"
  | "ON_HOLD"
  | "COLLECTED"
  | "WAIVED"
  | "EXPECTED"
  | "NO_CHANGE";

export type DashboardSummary = {
  totals: {
    totalLedgerRows: number;
    collectedToday: number;
    collected7d: number;
    uploaded7d: number;
    onHold: number;
    pendingTotal: number;
    pendingBatchCount: number;
    topUpBacklogRows: number;
    topUpBacklogBatches: number;
  };
  statusCounts: { status: LedgerStatus; count: number }[];
  dailyActivity: { date: string; collected: number; uploaded: number }[];
  attention: {
    batchesNotOpened: { count: number; sample: { id: number; name: string }[] };
    staleRows: { count: number };
    missingUploads: { count: number };
  };
  documentTypeCounts: {
    documentTypeId: number;
    total: number;
    pending: number;
    collected: number;
    onHold: number;
  }[];
};

export type RecentHandoverRow = {
  ledgerId: number;
  status: "COLLECTED" | "UPLOADED";
  studentUid: string;
  studentName: string;
  documentTypeName: string;
  className: string | null;
  providedByName: string | null;
  at: string;
};

export type TopProviderRow = {
  userId: number;
  name: string;
  count: number;
};

export type DashboardHandovers = {
  kpis: {
    collectedToday: number;
    collected7d: number;
    uploaded7d: number;
    selfSourcedUploadPct: number;
    peakDay: { date: string; count: number } | null;
  };
  recent: RecentHandoverRow[];
  topProviders: TopProviderRow[];
};

export type BlockedStudentRow = {
  studentId: number;
  studentName: string;
  uid: string;
  rollNumber: string | null;
  programmeName: string | null;
  className: string | null;
  blockedCount: number;
  blockedDocTypes: string[];
  outstanding: number;
};

export type DashboardFeeClearance = {
  kpis: {
    onHoldRows: number;
    studentsBlocked: number;
    totalOutstanding: number;
  };
  blockedStudents: BlockedStudentRow[];
  blocksByDocType: { documentTypeId: number; name: string; count: number }[];
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await axiosInstance.get<Payload<DashboardSummary>>(`${BASE_URL}/summary`);
  return res.data.payload;
}

export async function getDashboardHandovers(limit?: number): Promise<DashboardHandovers> {
  const res = await axiosInstance.get<Payload<DashboardHandovers>>(`${BASE_URL}/handovers`, {
    params: limit ? { limit } : undefined,
  });
  return res.data.payload;
}

export async function getDashboardFeeClearance(limit?: number): Promise<DashboardFeeClearance> {
  const res = await axiosInstance.get<Payload<DashboardFeeClearance>>(`${BASE_URL}/fee-clearance`, {
    params: limit ? { limit } : undefined,
  });
  return res.data.payload;
}
