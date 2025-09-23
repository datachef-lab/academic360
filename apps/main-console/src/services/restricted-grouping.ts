import type { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";
import type { RestrictedGroupingMainDto } from "@repo/db/dtos/subject-selection";

const BASE = "/api/subject-selection/restricted-grouping-mains";

export async function fetchRestrictedGroupings(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  subjectType?: string;
  programCourseId?: number;
}) {
  const res = await axiosInstance.get<
    ApiResponse<RestrictedGroupingMainDto[] | { content: RestrictedGroupingMainDto[] }>
  >(BASE, {
    params,
  });
  const p = res.data.payload as RestrictedGroupingMainDto[] | { content: RestrictedGroupingMainDto[] };
  return (Array.isArray(p) ? p : p?.content) as RestrictedGroupingMainDto[];
}
