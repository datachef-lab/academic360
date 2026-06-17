import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

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
};

const BASE = "/api/library/dashboard";

export async function getLibraryDashboardStats() {
  const res = await axiosInstance.get<ApiResponse<LibraryDashboardStats>>(`${BASE}/stats`);
  return res.data;
}
