import { ApiResonse } from "@/types/api-response";
import type { PaginatedResponse } from "@/types/commons/paginated-response";
import api from "@/utils/api";
import { RestrictedGroupingMainDto } from "@repo/db/dtos/subject-selection";

export type CreateRestrictedGroupingMainInput = {
  subjectType: { id: number };
  subject: { id: number };
  isActive?: boolean;
  forClasses?: { class: { id: number } }[];
  cannotCombineWithSubjects?: { cannotCombineWithSubject: { id: number } }[];
  applicableProgramCourses?: { programCourse: { id: number } }[];
};

export type UpdateRestrictedGroupingMainInput = Partial<CreateRestrictedGroupingMainInput>;

const BASE_URL = "/api/subject-selection/restricted-grouping-mains";

export const restrictedGroupingApi = {
  async listRestrictedGroupingMains() {
    const res = await api.get<ApiResonse<RestrictedGroupingMainDto[] | { content: RestrictedGroupingMainDto[] }>>(
      `${BASE_URL}`,
    );
    const p = res.data.payload as any;
    return Array.isArray(p) ? p : (p?.content ?? []);
  },
  async listRestrictedGroupingMainsPaginated(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    subjectType?: string;
  }) {
    const res = await api.get<ApiResonse<PaginatedResponse<RestrictedGroupingMainDto>>>(`${BASE_URL}`, { params });
    return res.data.payload;
  },
  async getRestrictedGroupingMain(id: number) {
    const res = await api.get<ApiResonse<RestrictedGroupingMainDto>>(`${BASE_URL}/${id}`);
    return res.data.payload;
  },
  async createRestrictedGroupingMain(payload: CreateRestrictedGroupingMainInput) {
    const res = await api.post<ApiResonse<RestrictedGroupingMainDto>>(`${BASE_URL}`, payload);
    return res.data.payload;
  },
  async updateRestrictedGroupingMain(id: number, payload: UpdateRestrictedGroupingMainInput) {
    const res = await api.put<ApiResonse<RestrictedGroupingMainDto>>(`${BASE_URL}/${id}`, payload);
    return res.data.payload;
  },
  async deleteRestrictedGroupingMain(id: number) {
    const res = await api.delete<ApiResonse<unknown>>(`${BASE_URL}/${id}`);
    return res.data.payload;
  },
};
