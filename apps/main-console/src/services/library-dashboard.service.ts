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
