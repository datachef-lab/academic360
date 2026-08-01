import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryDashboardFilters = {
  branchId?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

export type LibraryDashboardStats = {
  totalBooks: number;
  totalCopies: number;
  activeIssues: number;
  overdueCount: number;
  finesCollectedThisMonth: number;
  finesOutstanding: number;
  topBooks: Array<{ bookId: number; title: string; issueCount: number }>;
  topPatrons: Array<{
    userId: number;
    userName: string | null;
    issueCount: number;
  }>;
  dailyIssuesLast14: Array<{ day: string; count: number }>;
  copiesByStatus: Array<{ statusId: number | null; statusName: string; count: number }>;
  entryExitByDay: Array<{ day: string; count: number }>;

  currentlyInLibrary: number;
  reissueCount: number;
  forcedIssueCount: number;
  finesWaivedThisMonth: number;
  avgLoanDays: number;
  overdueAgeing: Array<{ bucket: "0-7" | "8-30" | ">30"; count: number }>;

  booksByLanguage: Array<{ language: string; count: number }>;
  booksByPublisher: Array<{ publisher: string; count: number }>;
  booksByDocumentType: Array<{ documentType: string; count: number }>;
  copiesByRack: Array<{ rack: string; count: number }>;
  booksAddedPerYear: Array<{ year: string; count: number }>;

  entriesByHourOfDay: Array<{ hour: number; count: number }>;
  exitsByHourOfDay: Array<{ hour: number; count: number }>;
  entriesByPatronCategory: Array<{ category: string; count: number }>;
  avgVisitMinutes: number;

  finesByDay: Array<{ day: string; collected: number; waived: number }>;
  outstandingByPatron: Array<{
    userId: number;
    userName: string | null;
    amount: number;
  }>;
};

const BASE = "/api/library/dashboard";

export async function getLibraryDashboardStats(filters: LibraryDashboardFilters = {}) {
  const params: Record<string, string | number> = {};
  if (filters.branchId != null) params.branchId = filters.branchId;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  const res = await axiosInstance.get<ApiResponse<LibraryDashboardStats>>(`${BASE}/stats`, {
    params,
  });
  return res.data;
}

// ── Seed status + master tables backing the new tabs ────────────────────────

export type LibrarySeedStatus = {
  seedRan: boolean;
  ranAt: string | null;
  defaultsPresent: {
    defaultBranch: boolean;
    seededPatronCategories: number;
    seededItemCategories: number;
    seededZones: number;
    seededPolicies: number;
  };
};

export async function getLibrarySeedStatus() {
  const res = await axiosInstance.get<ApiResponse<LibrarySeedStatus>>(`${BASE}/seed-status`);
  return res.data.payload;
}

// -- Live-load snapshot ------------------------------------------------------
// Server-side memory of the ONGOING legacy load. The dashboard fetches this on
// mount so that a page refresh in the middle of a load hydrates the banner
// straight away — the socket only carries events forward from when it joins,
// so a fast layer (~6s for 19 tables) would otherwise leave the banner blank.

export type LibraryLoadSnapshot = {
  snapshot: {
    table: string;
    label: string;
    loaded: number;
    failed: number;
    total: number;
    percent: number;
    layer?: number;
    layerTotal?: number;
    /** Human-readable labels for every table running in parallel now. */
    currentLayerLabels?: string[];
    /** Human-readable labels for the previous layer this one depends on. */
    dependsOnLabels?: string[];
    /**
     * ISO timestamp of when the current loader run started — anchors the
     * client-side ETA so it can project from the first emit onward.
     */
    startedAt?: string;
    /** How many tables have finished so far, across every layer. */
    tablesDone?: number;
    /** Total number of tables the loader will process end-to-end. */
    tablesTotal?: number;
    /** Cumulative rows processed across every table so far. Feeds the
     *  client-side recent-rate ETA. */
    rowsProcessed?: number;
    /** Planned total rows across every table (from the planning phase). */
    rowsTotal?: number;
    running: boolean;
    at: string;
  } | null;
};

export async function getLibraryLoadStatus() {
  const res = await axiosInstance.get<ApiResponse<LibraryLoadSnapshot>>(`${BASE}/load-status`);
  return res.data.payload;
}

export type LibraryActivePatron = {
  userId: number;
  userName: string | null;
  userType: string;
  activeIssues: number;
  overdue: number;
  outstandingFine: number;
};

export async function getActivePatrons(limit = 100) {
  const res = await axiosInstance.get<ApiResponse<LibraryActivePatron[]>>(`${BASE}/patrons`, {
    params: { limit },
  });
  return res.data.payload ?? [];
}

export type LibraryItemCategoryRow = {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
};

export async function getItemCategories() {
  const res = await axiosInstance.get<ApiResponse<LibraryItemCategoryRow[]>>(
    `${BASE}/item-categories`,
  );
  return res.data.payload ?? [];
}

export type LibraryBranchRow = {
  branchId: number;
  branchName: string;
  branchCode: string | null;
  isActive: boolean;
  copies: number;
  currentlyInside: number;
  zones: Array<{ id: number; name: string; capacity: number | null }>;
};

export async function getBranchesWithZones() {
  const res = await axiosInstance.get<ApiResponse<LibraryBranchRow[]>>(`${BASE}/branches`);
  return res.data.payload ?? [];
}

export type LibraryPolicyRow = {
  id: number;
  patronCategory: string;
  itemCategory: string;
  loanDays: number;
  graceDays: number;
  finePerDay: number;
  renewalLimit: number;
  maxCopiesAtOnce: number;
  isActive: boolean;
};

export async function getCirculationPolicies() {
  const res = await axiosInstance.get<ApiResponse<LibraryPolicyRow[]>>(`${BASE}/policies`);
  return res.data.payload ?? [];
}

// -- Catalogue counts --------------------------------------------------------
// One roll-up across every article-entry / catalogue / master / operational
// table so the Holdings tab can show the shape of the library in one glance.

export type LibraryCatalogueCountRow = {
  key: string;
  label: string;
  table: string;
  count: number;
};

export type LibraryCatalogueGroup = {
  key: string;
  label: string;
  items: LibraryCatalogueCountRow[];
};

export async function getCatalogueCounts() {
  const res = await axiosInstance.get<ApiResponse<{ groups: LibraryCatalogueGroup[] }>>(
    `${BASE}/catalogue-counts`,
  );
  return res.data.payload?.groups ?? [];
}

// -- Holidays report ---------------------------------------------------------

export type LibraryHolidayRow = {
  id: number;
  name: string;
  shortName: string | null;
  from: string;
  to: string;
  remarks: string | null;
  applicableClassCount: number;
};

export type LibraryHolidayBreakdownRow = {
  programCourseId: number;
  programCourseName: string;
  classId: number;
  className: string;
  classSequence: number | null;
  holidayCount: number;
};

export type LibraryHolidaysReport = {
  totals: {
    holidays: number;
    classHolidayRows: number;
    activeAssignments: number;
    programCourses: number;
    classes: number;
  };
  holidays: LibraryHolidayRow[];
  breakdown: LibraryHolidayBreakdownRow[];
};

export async function getLibraryHolidaysReport() {
  const res = await axiosInstance.get<ApiResponse<LibraryHolidaysReport>>(
    `${BASE}/holidays-report`,
  );
  return res.data.payload!;
}
