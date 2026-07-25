import { ApiResponse } from "@/types/api-response";
import { PaginatedResponse } from "@/types/pagination";
import api from "@/utils/api";
import type {
  RelatedSubjectMainDto,
  RelatedSubjectSubDto,
  SubjectSelectionMetaDto,
} from "@repo/db/dtos/subject-selection";

export type CreateRelatedSubjectMainInput = {
  academicYear?: { id: number };
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

// Update input for a subject-selection meta. Mirrors the backend update
// service input (flat { id } arrays). academicYear/sequence are intentionally
// omitted so they cannot be changed on update.
/** Where a meta's student options come from (mirrors the backend enum). */
export type SubjectSelectionOptionSource = "ELECTIVE_SUBJECTS" | "PRIOR_SELECTION";

export type UpdateSubjectSelectionMetaInput = {
  label?: string;
  subjectType?: { id: number };
  isActive?: boolean;
  forClasses?: { id: number }[];
  streams?: { id: number }[];
  optionSource?: SubjectSelectionOptionSource;
  /** Metas to draw options from; only applied for PRIOR_SELECTION. */
  sourceMetas?: { id: number }[];
};

// Create input for a subject-selection meta. Mirrors the backend create
// service input (CreateSubjectSelectionMetaInput in
// subject-selection-meta.service.ts) — label/sequence/subjectType/academicYear
// are required there.
export type CreateSubjectSelectionMetaInput = {
  label: string;
  sequence: number;
  subjectType: { id: number };
  academicYear: { id: number };
  isActive?: boolean;
  forClasses?: { id: number }[];
  streams?: { id: number }[];
  optionSource?: SubjectSelectionOptionSource;
  /** Metas to draw options from; only applied for PRIOR_SELECTION. */
  sourceMetas?: { id: number }[];
};

const BASE_MAIN = "/api/subject-selection/related-subject-mains";
const BASE_SUB = "/api/subject-selection/related-subject-subs";
const BASE_META = "/api/subject-selection/metas";

export const subjectSelectionApi = {
  // Related Subject Main
  async listRelatedSubjectMains() {
    const res = await api.get<
      ApiResponse<RelatedSubjectMainDto[] | { content: RelatedSubjectMainDto[] }>
    >(`${BASE_MAIN}`);
    const p = res.data.payload;
    return Array.isArray(p) ? p : (p?.content ?? []);
  },
  async listRelatedSubjectMainsPaginated(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    programCourse?: string;
    subjectType?: string;
    academicYearId?: number;
  }) {
    const res = await api.get<ApiResponse<PaginatedResponse<RelatedSubjectMainDto>>>(
      `${BASE_MAIN}`,
      { params },
    );
    return res.data.payload;
  },
  async getRelatedSubjectMain(id: number) {
    const res = await api.get<ApiResponse<RelatedSubjectMainDto>>(`${BASE_MAIN}/${id}`);
    return res.data.payload;
  },
  async createRelatedSubjectMain(payload: CreateRelatedSubjectMainInput) {
    const res = await api.post<ApiResponse<RelatedSubjectMainDto>>(`${BASE_MAIN}`, payload);
    return res.data.payload;
  },
  async updateRelatedSubjectMain(id: number, payload: UpdateRelatedSubjectMainInput) {
    const res = await api.put<ApiResponse<RelatedSubjectMainDto>>(`${BASE_MAIN}/${id}`, payload);
    return res.data.payload;
  },
  async deleteRelatedSubjectMain(id: number) {
    const res = await api.delete<ApiResponse<unknown>>(`${BASE_MAIN}/${id}`);
    return res.data.payload;
  },

  // Related Subject Sub
  async listRelatedSubjectSubsByMain(mainId: number) {
    const res = await api.get<ApiResponse<RelatedSubjectSubDto[]>>(`${BASE_SUB}/main/${mainId}`);
    return res.data.payload;
  },
  async createRelatedSubjectSub(payload: CreateRelatedSubjectSubInput) {
    const res = await api.post<ApiResponse<RelatedSubjectSubDto>>(`${BASE_SUB}`, payload);
    return res.data.payload;
  },
  async deleteRelatedSubjectSub(id: number) {
    const res = await api.delete<ApiResponse<unknown>>(`${BASE_SUB}/${id}`);
    return res.data.payload;
  },

  // Subject Selection Meta
  async createSubjectSelectionMeta(payload: CreateSubjectSelectionMetaInput) {
    const res = await api.post<ApiResponse<SubjectSelectionMetaDto>>(`${BASE_META}`, payload);
    return res.data.payload;
  },
  async updateSubjectSelectionMeta(id: number, payload: UpdateSubjectSelectionMetaInput) {
    const res = await api.put<ApiResponse<SubjectSelectionMetaDto>>(`${BASE_META}/${id}`, payload);
    return res.data.payload;
  },
};
