import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type NaacReport = {
  framework: "NAAC";
  criterion: string;
  academicYear: string;
  metrics: Record<string, string | number>;
};

export type NirfReport = {
  framework: "NIRF";
  academicYear: string;
  libraryResources: {
    books: number;
    copies: number;
    eJournals: number;
    annualLibrarySpend: number;
    annualCirculation: number;
  };
};

export type AisheReport = {
  framework: "AISHE";
  academicYear: string;
  library: {
    booksAvailable: number;
    volumesAvailable: number;
    journalsSubscribed: number;
    annualSubscriptionSpend: number;
  };
};

const BASE = "/api/library/reports";

export async function getNaacReport(year: string) {
  const res = await axiosInstance.get<ApiResponse<NaacReport>>(`${BASE}/naac`, {
    params: { year },
  });
  return res.data;
}

export async function getNirfReport(year: string) {
  const res = await axiosInstance.get<ApiResponse<NirfReport>>(`${BASE}/nirf`, {
    params: { year },
  });
  return res.data;
}

export async function getAisheReport(year: string) {
  const res = await axiosInstance.get<ApiResponse<AisheReport>>(`${BASE}/aishe`, {
    params: { year },
  });
  return res.data;
}

// ─── Operational / Finance / Inventory reports (Round 2 Phase 3) ───

export type ReportFilters = {
  branchId?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

export type OverdueRow = {
  circulationId: number;
  userId: number;
  userName: string | null;
  bookId: number | null;
  bookTitle: string;
  accessNumber: string | null;
  issuedAt: string;
  dueAt: string;
  daysLate: number;
  branchId: number | null;
  branchName: string | null;
};

export type FinesOutstandingBucket = {
  bucket: "0-7" | "8-30" | "31-90" | "90+";
  circulationCount: number;
  totalOutstanding: number;
};

export type FinesOutstandingDebtor = {
  userId: number;
  userName: string | null;
  outstanding: number;
  oldestFineDate: string | null;
  circulationCount: number;
};

export type FinesOutstandingPayload = {
  buckets: FinesOutstandingBucket[];
  topDebtors: FinesOutstandingDebtor[];
};

export type FinesCollectedRow = {
  paymentId: number;
  userId: number | null;
  amount: number;
  paidAt: string | null;
};

export type FinesCollectedPayload = {
  total: number;
  count: number;
  rows: FinesCollectedRow[];
};

export type StockSummaryRow = {
  branchId: number | null;
  branchName: string;
  statusId: number | null;
  statusName: string;
  copyCount: number;
};

export type HighDemandRow = {
  bookId: number;
  title: string;
  isbn: string | null;
  issueCount: number;
  copiesOwned: number;
};

function clean(filters: ReportFilters): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (filters.branchId != null) params.branchId = filters.branchId;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  return params;
}

export async function getOverdueReport(filters: ReportFilters = {}) {
  const res = await axiosInstance.get<ApiResponse<OverdueRow[]>>(`${BASE}/overdue`, {
    params: clean(filters),
  });
  return res.data;
}

export async function getFinesOutstandingReport(filters: ReportFilters = {}) {
  const res = await axiosInstance.get<ApiResponse<FinesOutstandingPayload>>(
    `${BASE}/fines-outstanding`,
    { params: clean(filters) },
  );
  return res.data;
}

export async function getFinesCollectedReport(filters: ReportFilters = {}) {
  const res = await axiosInstance.get<ApiResponse<FinesCollectedPayload>>(
    `${BASE}/fines-collected`,
    { params: clean(filters) },
  );
  return res.data;
}

export async function getStockSummaryReport(filters: ReportFilters = {}) {
  const res = await axiosInstance.get<ApiResponse<StockSummaryRow[]>>(`${BASE}/stock-summary`, {
    params: clean(filters),
  });
  return res.data;
}

export async function getHighDemandReport(filters: ReportFilters = {}, limit = 25) {
  const res = await axiosInstance.get<ApiResponse<HighDemandRow[]>>(`${BASE}/high-demand-titles`, {
    params: { ...clean(filters), limit },
  });
  return res.data;
}
