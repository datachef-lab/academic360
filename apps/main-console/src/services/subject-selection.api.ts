import api from "@/utils/api";

// DTOs (match backend shapes loosely)
export type RelatedSubjectSubDto = {
  id: number;
  boardSubjectName: { id: number; name: string; code: string };
};

export type RelatedSubjectMainDto = {
  id: number;
  isActive: boolean;
  programCourse: { id: number; name: string; shortName: string; isActive: boolean };
  subjectType: { id: number; name: string; code: string; isActive: boolean };
  boardSubjectName: { id: number; name: string; code: string };
  relatedSubjectSubs: RelatedSubjectSubDto[];
};

export type CreateRelatedSubjectMainInput = {
  programCourseId: number;
  subjectTypeId: number;
  boardSubjectNameId: number;
  isActive?: boolean;
};

export type UpdateRelatedSubjectMainInput = Partial<CreateRelatedSubjectMainInput>;

export type CreateRelatedSubjectSubInput = {
  relatedSubjectMainId: number;
  boardSubjectNameId: number;
};

const BASE_MAIN = "/api/subject-selection/related-subject-mains";
const BASE_SUB = "/api/subject-selection/related-subject-subs";

export const subjectSelectionApi = {
  // Related Subject Main
  async listRelatedSubjectMains() {
    const res = await api.get<{ data: RelatedSubjectMainDto[] }>(`${BASE_MAIN}`);
    return res.data.data;
  },
  async getRelatedSubjectMain(id: number) {
    const res = await api.get<{ data: RelatedSubjectMainDto }>(`${BASE_MAIN}/${id}`);
    return res.data.data;
  },
  async createRelatedSubjectMain(payload: CreateRelatedSubjectMainInput) {
    const res = await api.post<{ data: RelatedSubjectMainDto }>(`${BASE_MAIN}`, payload);
    return res.data.data;
  },
  async updateRelatedSubjectMain(id: number, payload: UpdateRelatedSubjectMainInput) {
    const res = await api.put<{ data: RelatedSubjectMainDto }>(`${BASE_MAIN}/${id}`, payload);
    return res.data.data;
  },
  async deleteRelatedSubjectMain(id: number) {
    const res = await api.delete<{ data: unknown }>(`${BASE_MAIN}/${id}`);
    return res.data;
  },

  // Related Subject Sub
  async listRelatedSubjectSubsByMain(mainId: number) {
    const res = await api.get<{ data: RelatedSubjectSubDto[] }>(`${BASE_SUB}/main/${mainId}`);
    return res.data.data;
  },
  async createRelatedSubjectSub(payload: CreateRelatedSubjectSubInput) {
    const res = await api.post<{ data: RelatedSubjectSubDto }>(`${BASE_SUB}`, payload);
    return res.data.data;
  },
  async deleteRelatedSubjectSub(id: number) {
    const res = await api.delete<{ data: unknown }>(`${BASE_SUB}/${id}`);
    return res.data;
  },
};
