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

export async function fetchStudentSubjectSelections(
  studentId: number,
): Promise<StudentSubjectSelectionApiResponse> {
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

/** One mandatory-paper row from GET /students/:id/mandatory-papers.
 * `class` is the semester the paper belongs to. */
export interface MandatoryPaperRow {
  paper: { id: number; name?: string | null; code?: string | null };
  subject?: { id: number; name?: string | null; code?: string | null } | null;
  subjectType?: { id: number; name?: string | null; code?: string | null } | null;
  class?: { id: number; name?: string | null } | null;
}

/** Typed variant of fetchMandatorySubjects: the student's promotion papers,
 * each carrying its semester (`class.name`). */
export async function fetchMandatoryPaperRows(studentId: number): Promise<MandatoryPaperRow[]> {
  const rows = await fetchMandatorySubjects(studentId);
  return (rows as MandatoryPaperRow[]) ?? [];
}

/** One row from the authoritative university-subjects endpoint (same source as
 * the bulk subjects report): a paper for the student in a given semester. */
export interface UniversitySubjectRow {
  student_id: number;
  uid: string | null;
  semester: string | null;
  subject: string | null;
  subject_type: string | null;
  paper_id: number | null;
  paper: string | null;
  paper_code: string | null;
  /** Backend returns "Yes"/"No" strings (or a boolean); treat "Yes"/true as elective. */
  is_optional: boolean | string | null;
}

/** The student's full per-semester paper list (mandatory + optional), matching
 * the "Student University Subjects" report. Empty array if unavailable (older
 * backend) so callers can fall back. */
export async function fetchStudentUniversitySubjects(
  studentId: number,
): Promise<UniversitySubjectRow[]> {
  try {
    const res = await axiosInstance.get<ApiResponse<UniversitySubjectRow[]>>(
      `/api/subject-selection/students/${studentId}/university-subjects`,
    );
    return (res.data.payload as UniversitySubjectRow[]) ?? [];
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
