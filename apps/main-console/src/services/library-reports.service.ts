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

// ─── Usage / analytics reports ───

export type Paginated<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

export type FootfallPayload = {
  daily: Array<{
    date: string;
    entries: number;
    uniqueVisitors: number;
    avgDurationMinutes: number;
  }>;
  byHour: Array<{ hour: number; entries: number }>;
  byZone: Array<{ zoneId: number | null; zoneName: string; entries: number }>;
};

export type HoldingsGroupBy = "category" | "status" | "language" | "publisher";

export type HoldingsRow = {
  groupId: number | null;
  groupName: string;
  bookCount: number;
  copyCount: number;
  totalPriceINR: number;
};

export type AccessionGrowthRow = { year: string; copiesAdded: number; cumulative: number };

export type CopiesDistributionRow = { bucket: string; bookCount: number };

export type PopularBookRow = {
  bookId: number;
  title: string;
  isbn: string | null;
  categoryName: string;
  issueCount: number;
  uniqueReaders: number;
};

export type PublicationDimension = "publisher" | "journal" | "series";

export type PublicationUsageRow = {
  id: number;
  name: string;
  titleCount: number;
  issueCount: number;
  uniqueReaders: number;
  issnNumber: string | null;
  activeSubscriptions: number | null;
};

export type BatchUsageMetric = "circulation" | "footfall";

export type BatchUsageRow = {
  programCourseName: string;
  className: string;
  sessionName: string;
  shiftName: string;
  studentCount: number;
  eventCount: number;
  eventsPerStudent: number;
};

export type BookDemandForecastRow = {
  bookId: number;
  title: string;
  recentMonthlyAvg: number;
  seasonalIndex: number;
  predictedDemand: number;
  trend: "up" | "flat" | "down";
  confidence: "high" | "medium" | "low";
};

export type BookDemandForecastPayload = { horizonDays: number; rows: BookDemandForecastRow[] };

export type FootfallForecastRow = {
  date: string;
  dayOfWeek: string;
  baseline: number;
  seasonalIndex: number;
  examUplift: number;
  predicted: number;
  isPeak: boolean;
  drivers: string[];
};

export type FootfallForecastPayload = {
  examUpliftFactor: number;
  upcomingExams: Array<{ name: string; commencementDate: string }>;
  rows: FootfallForecastRow[];
};

export async function getFootfallReport(filters: ReportFilters = {}) {
  const res = await axiosInstance.get<ApiResponse<FootfallPayload>>(`${BASE}/footfall`, {
    params: clean(filters),
  });
  return res.data;
}

export async function getHoldingsReport(
  filters: ReportFilters = {},
  groupBy: HoldingsGroupBy = "category",
  page = 1,
  pageSize = 10,
) {
  const res = await axiosInstance.get<ApiResponse<Paginated<HoldingsRow>>>(`${BASE}/holdings`, {
    params: { ...clean(filters), groupBy, page, pageSize },
  });
  return res.data;
}

export async function getAccessionGrowthReport(filters: ReportFilters = {}) {
  const res = await axiosInstance.get<ApiResponse<AccessionGrowthRow[]>>(
    `${BASE}/accession-growth`,
    { params: clean(filters) },
  );
  return res.data;
}

export async function getCopiesDistributionReport(filters: ReportFilters = {}) {
  const res = await axiosInstance.get<ApiResponse<CopiesDistributionRow[]>>(
    `${BASE}/copies-distribution`,
    { params: clean(filters) },
  );
  return res.data;
}

export async function getPopularBooksReport(
  filters: ReportFilters = {},
  opts: { itemCategoryId?: number | null; page?: number; pageSize?: number } = {},
) {
  const params: Record<string, string | number> = {
    ...clean(filters),
    page: opts.page ?? 1,
    pageSize: opts.pageSize ?? 10,
  };
  if (opts.itemCategoryId != null) params.itemCategoryId = opts.itemCategoryId;
  const res = await axiosInstance.get<ApiResponse<Paginated<PopularBookRow>>>(
    `${BASE}/popular-books`,
    { params },
  );
  return res.data;
}

export async function getPublicationUsageReport(
  filters: ReportFilters = {},
  dimension: PublicationDimension = "publisher",
  page = 1,
  pageSize = 10,
) {
  const res = await axiosInstance.get<ApiResponse<Paginated<PublicationUsageRow>>>(
    `${BASE}/publication-usage`,
    { params: { ...clean(filters), dimension, page, pageSize } },
  );
  return res.data;
}

export async function getBatchUsageReport(
  filters: ReportFilters = {},
  metric: BatchUsageMetric = "circulation",
  page = 1,
  pageSize = 10,
) {
  const res = await axiosInstance.get<ApiResponse<Paginated<BatchUsageRow>>>(
    `${BASE}/batch-usage`,
    { params: { ...clean(filters), metric, page, pageSize } },
  );
  return res.data;
}

export async function getBookDemandForecast(
  filters: ReportFilters = {},
  opts: { horizonDays?: 30 | 60; itemCategoryId?: number | null; limit?: number } = {},
) {
  const params: Record<string, string | number> = {
    ...clean(filters),
    horizonDays: opts.horizonDays ?? 30,
    limit: opts.limit ?? 25,
  };
  if (opts.itemCategoryId != null) params.itemCategoryId = opts.itemCategoryId;
  const res = await axiosInstance.get<ApiResponse<BookDemandForecastPayload>>(
    `${BASE}/predict/book-demand`,
    { params },
  );
  return res.data;
}

export async function getFootfallForecast(filters: ReportFilters = {}) {
  const res = await axiosInstance.get<ApiResponse<FootfallForecastPayload>>(
    `${BASE}/predict/footfall`,
    { params: clean(filters) },
  );
  return res.data;
}
