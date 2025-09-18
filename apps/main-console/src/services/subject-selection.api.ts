import { ApiResonse } from "@/types/api-response";
import { PaginatedResponse } from "@/types/pagination";
import api from "@/utils/api";
import { RelatedSubjectMainDto, RelatedSubjectSubDto } from "@repo/db/dtos/subject-selection";

export type CreateRelatedSubjectMainInput = {
  programCourse: { id: number };
  subjectType: { id: number };
  boardSubjectName: { id: number };
  isActive?: boolean;
  relatedSubjectSubs?: { boardSubjectName: { id: number } }[];
};

// Allow sending full DTO-like payloads (including relatedSubjectSubs) for update
export type UpdateRelatedSubjectMainInput = Partial<CreateRelatedSubjectMainInput> & {
  relatedSubjectSubs?: { boardSubjectName: { id: number } }[];
};

export type CreateRelatedSubjectSubInput = {
  relatedSubjectMainId: number;
  boardSubjectNameId: number;
};

const BASE_MAIN = "/api/subject-selection/related-subject-mains";
const BASE_SUB = "/api/subject-selection/related-subject-subs";

export const subjectSelectionApi = {
  // Related Subject Main
  async listRelatedSubjectMains() {
    const res = await api.get<ApiResonse<RelatedSubjectMainDto[] | { content: RelatedSubjectMainDto[] }>>(
      `${BASE_MAIN}`,
    );
    const p = res.data.payload;
    return Array.isArray(p) ? p : (p?.content ?? []);
  },
  async listRelatedSubjectMainsPaginated(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    programCourse?: string;
    subjectType?: string;
  }) {
    const res = await api.get<ApiResonse<PaginatedResponse<RelatedSubjectMainDto>>>(`${BASE_MAIN}`, { params });
    return res.data.payload;
  },
  async getRelatedSubjectMain(id: number) {
    const res = await api.get<ApiResonse<RelatedSubjectMainDto>>(`${BASE_MAIN}/${id}`);
    return res.data.payload;
  },
  async createRelatedSubjectMain(payload: CreateRelatedSubjectMainInput) {
    const res = await api.post<ApiResonse<RelatedSubjectMainDto>>(`${BASE_MAIN}`, payload);
    return res.data.payload;
  },
  async updateRelatedSubjectMain(id: number, payload: UpdateRelatedSubjectMainInput) {
    const res = await api.put<ApiResonse<RelatedSubjectMainDto>>(`${BASE_MAIN}/${id}`, payload);
    return res.data.payload;
  },
  async deleteRelatedSubjectMain(id: number) {
    const res = await api.delete<ApiResonse<unknown>>(`${BASE_MAIN}/${id}`);
    return res.data.payload;
  },

  // Related Subject Sub
  async listRelatedSubjectSubsByMain(mainId: number) {
    const res = await api.get<ApiResonse<RelatedSubjectSubDto[]>>(`${BASE_SUB}/main/${mainId}`);
    return res.data.payload;
  },
  async createRelatedSubjectSub(payload: CreateRelatedSubjectSubInput) {
    const res = await api.post<ApiResonse<RelatedSubjectSubDto>>(`${BASE_SUB}`, payload);
    return res.data.payload;
  },
  async deleteRelatedSubjectSub(id: number) {
    const res = await api.delete<ApiResonse<unknown>>(`${BASE_SUB}/${id}`);
    return res.data.payload;
  },
};
