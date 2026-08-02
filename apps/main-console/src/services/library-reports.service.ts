/**
 * Client of the /api/library/reports/* endpoints. Every user-facing
 * downloader hits a backend `/download` route that returns a formatted .xlsx
 * blob (ExcelJS + applyStandardExcelReportTableStyling). Filter arrays are
 * comma-serialised — matches the shape used by the platform Reports page's
 * filterParams (apps/main-console/src/features/reports/page/index.tsx).
 */

import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

// ─────────────────────────────────────────────────────────────────────────────
// JSON compliance-report shapers — kept for the /naac /nirf /aishe endpoints
// that back the future in-app previews. The dashboard's Download button
// hits the /download variants below.
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Rich filter set — matches LibraryReportFilters on the backend
// (apps/backend/.../report-common/library-report-filters.ts).
// ─────────────────────────────────────────────────────────────────────────────

export type LibraryReportFilters = {
  branchId?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;

  academicYearIds?: number[];

  affiliationIds?: number[];
  regulationTypeIds?: number[];
  programCourseIds?: number[];
  classIds?: number[];
  shiftIds?: number[];
  sessionIds?: number[];
  sectionIds?: number[];

  userTypes?: string[];
  patronCategoryIds?: number[];
  communities?: string[];
  genders?: string[];

  itemCategoryIds?: number[];
  circulationTypes?: string[];
  returnStatus?: string | null;
  fineStatus?: string | null;

  zoneIds?: number[];

  /** Compliance-only. Not serialised as an ID list. */
  academicYear?: string | null;
};

function serialiseFilters(f: LibraryReportFilters): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (f.branchId != null) out.branchId = f.branchId;
  if (f.dateFrom) out.dateFrom = f.dateFrom;
  if (f.dateTo) out.dateTo = f.dateTo;
  if (f.academicYear) out.academicYear = f.academicYear;

  const putIds = (key: keyof LibraryReportFilters, param: string) => {
    const v = f[key] as number[] | undefined;
    if (v && v.length > 0) out[param] = v.join(",");
  };
  putIds("academicYearIds", "academicYearIds");
  putIds("affiliationIds", "affiliationIds");
  putIds("regulationTypeIds", "regulationTypeIds");
  putIds("programCourseIds", "programCourseIds");
  putIds("classIds", "classIds");
  putIds("shiftIds", "shiftIds");
  putIds("sessionIds", "sessionIds");
  putIds("sectionIds", "sectionIds");
  putIds("patronCategoryIds", "patronCategoryIds");
  putIds("itemCategoryIds", "itemCategoryIds");
  putIds("zoneIds", "zoneIds");

  const putStrs = (key: keyof LibraryReportFilters, param: string) => {
    const v = f[key] as string[] | undefined;
    if (v && v.length > 0) out[param] = v.join(",");
  };
  putStrs("userTypes", "userTypes");
  putStrs("communities", "communities");
  putStrs("genders", "genders");
  putStrs("circulationTypes", "circulationTypes");

  if (f.returnStatus) out.returnStatus = f.returnStatus;
  if (f.fineStatus) out.fineStatus = f.fineStatus;

  return out;
}

// Downloads run through the platform-wide background-job infra
// (apps/backend/src/features/reports/report-generators.ts + reports-jobs
// routes). LibraryReportsPage.tsx calls ExportService.startReportJob(jobKey,
// params) with `library-<id>` job keys — the file arrives via the socket
// progress dialog. This service now only exports the filter shape + serialise
// helper; the flat filter params are built inline by the page.
export { serialiseFilters as serialiseLibraryReportFilters };
