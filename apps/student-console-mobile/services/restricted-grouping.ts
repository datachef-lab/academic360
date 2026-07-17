import type { RestrictedGroupingMainDto } from "@repo/db/dtos/subject-selection";
import axiosInstance from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

const BASE = "/api/subject-selection/restricted-grouping-mains";

export async function fetchRestrictedGroupings(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  subjectType?: string;
  programCourseId?: number;
  /** Scopes the result to the student's academic year and active groupings only.
   * Without it the API returns every grouping across all years. */
  studentId?: number;
}): Promise<RestrictedGroupingMainDto[]> {
  const res = await axiosInstance.get<
    ApiResponse<RestrictedGroupingMainDto[] | { content: RestrictedGroupingMainDto[] }>
  >(BASE, { params });

  const p = res.data.payload as any;
  return (Array.isArray(p) ? p : (p?.content ?? [])) as RestrictedGroupingMainDto[];
}
