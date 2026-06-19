import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type StudentLibraryAnalyticsRow = {
  id: number;
  userId: number;
  academicYear: string;
  totalIssues: number;
  totalReturns: number;
  totalOverdue: number;
  totalFinesPaid: number;
  libraryVisits: number;
  averageGrade: number | null;
  computedAt: string;
};

export type StudentLibraryAnalyticsPayload = {
  rows: StudentLibraryAnalyticsRow[];
  total: number;
  page: number;
  limit: number;
};

const BASE = "/api/library/student-analytics";

export async function getStudentLibraryAnalytics(params: {
  page: number;
  limit: number;
  userId?: number;
  academicYear?: string;
}) {
  const res = await axiosInstance.get<ApiResponse<StudentLibraryAnalyticsPayload>>(BASE, {
    params,
  });
  return res.data;
}

export async function recomputeStudentLibraryAnalytics(userId: number, academicYear: string) {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(`${BASE}/recompute`, {
    userId,
    academicYear,
  });
  return res.data;
}
