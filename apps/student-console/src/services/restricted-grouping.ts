import { axiosInstance as api } from "@/lib/utils";
import type { ApiResponse } from "@/types/api-response";
import type { RestrictedGroupingMainDto } from "@repo/db/dtos/subject-selection";

const BASE = "/api/subject-selection/restricted-grouping-mains";

export async function fetchRestrictedGroupings(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  subjectType?: string;
  programCourseId?: number;
  /** When set, the backend scopes groupings to this student's academic year
   * (promotion→session→AY) and returns only active ones. */
  studentId?: number;
}) {
  const res = await api.get<
    ApiResponse<RestrictedGroupingMainDto[] | { content: RestrictedGroupingMainDto[] }>
  >(BASE, {
    params,
  });
  const p = res.data.payload as any;
  return (Array.isArray(p) ? p : p?.content) as RestrictedGroupingMainDto[];
}
