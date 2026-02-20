import type { SubjectSelectionMetaDto } from "@repo/db/dtos/subject-selection";
import axiosInstance from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

export interface SubjectTypeDto {
  id: number;
  name: string;
  code?: string | null;
}

export interface PaperDto {
  id: number;
  name?: string | null;
  code?: string | null;
  subject?: { id: number; name?: string | null } | null;
  class?: { id: number; name?: string | null } | null;
}

export interface StudentSubjectSelectionGroupDto {
  subjectType: SubjectTypeDto;
  paperOptions: PaperDto[];
}

export interface StudentSubjectSelectionApiResponse {
  studentSubjectsSelection: StudentSubjectSelectionGroupDto[];
  selectedMinorSubjects: PaperDto[];
  subjectSelectionMetas: SubjectSelectionMetaDto[];
  hasFormSubmissions: boolean;
  actualStudentSelections: any[];
  session: { id: number; name?: string; [key: string]: any };
}

export interface StudentSubjectSelectionForSave {
  studentId: number;
  session: { id: number };
  subjectSelectionMeta: { id: number };
  subject: { id: number; name: string };
}

export interface SaveSelectionsResponse {
  success: boolean;
  data?: StudentSubjectSelectionForSave[];
  errors?: Array<{ field: string; message: string }>;
}

export async function fetchStudentSubjectSelections(studentId: number): Promise<StudentSubjectSelectionApiResponse> {
  const res = await axiosInstance.get<ApiResponse<StudentSubjectSelectionApiResponse>>(
    `/api/subject-selection/students/${studentId}/selections`,
  );

  const payload = res.data.payload;
  if (Array.isArray(payload)) {
    return {
      studentSubjectsSelection: payload,
      selectedMinorSubjects: [],
      subjectSelectionMetas: [],
      hasFormSubmissions: false,
      actualStudentSelections: [],
      session: { id: 1 },
    };
  }
  return payload as StudentSubjectSelectionApiResponse;
}

export async function fetchMandatorySubjects(studentId: number): Promise<unknown[]> {
  try {
    const res = await axiosInstance.get<ApiResponse<unknown[]>>(
      `/api/subject-selection/students/${studentId}/mandatory-papers`,
    );
    return (res.data.payload as unknown[]) || [];
  } catch {
    return [];
  }
}

export async function saveStudentSubjectSelections(
  selections: StudentSubjectSelectionForSave[],
): Promise<SaveSelectionsResponse> {
  try {
    const res = await axiosInstance.post<ApiResponse<StudentSubjectSelectionForSave[]>>(
      "/api/subject-selection/student-subject-selection/",
      selections,
    );

    return {
      success: true,
      data: res.data.payload,
    };
  } catch (error: any) {
    if (error.response?.status === 400 && error.response?.data?.payload?.errors) {
      return {
        success: false,
        errors: error.response.data.payload.errors,
      };
    }
    throw new Error(
      `Failed to save subject selections (${error.response?.status || 500}): ${error.response?.data?.message || error.message || "Unknown error"}`,
    );
  }
}
