// Import DTOs from shared package
import type {
  SubjectSelectionMetaDto,
  StudentSubjectSelectionDto as DbStudentSubjectSelectionDto,
} from "@repo/db/dtos/subject-selection";
import { axiosInstance as api } from "@/lib/utils";
import type { ApiResponse } from "@/types/api-response";

// Re-export for convenience
export type { SubjectSelectionMetaDto };

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
  selectedMinorSubjects: PaperDto[]; // earlier selected Minor papers (admission data)
  subjectSelectionMetas: SubjectSelectionMetaDto[]; // meta data for dynamic labels
  hasFormSubmissions: boolean; // indicates if student has submitted through the form
  actualStudentSelections: any[]; // actual form submissions from student-subject-selection table
  session: { id: number; name?: string; [key: string]: any }; // session information for form submission
}

// Additional interfaces for API responses
export interface AvailableSubjects {
  admissionMinor1Subjects: string[];
  admissionMinor2Subjects: string[];
  availableIdcSem1Subjects: string[];
  availableIdcSem2Subjects: string[];
  availableIdcSem3Subjects: string[];
  availableAecSubjects: string[];
  availableCvacOptions: string[];
  autoMinor1?: string;
  autoMinor2?: string;
  autoIdc1?: string;
  autoIdc2?: string;
  autoIdc3?: string;
}

export interface SubjectSelectionMetaResponse {
  subjectSelectionMetas: SubjectSelectionMetaDto[];
  availableSubjects: AvailableSubjects;
}

// For saving - simplified version of StudentSubjectSelectionDto
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
  const res = await api.get<ApiResponse<StudentSubjectSelectionApiResponse>>(
    `/api/subject-selection/students/${studentId}/selections`,
  );

  // Backward compatibility: if old payload shape (array), map into new structure
  const payload = res.data.payload;
  if (Array.isArray(payload)) {
    return {
      studentSubjectsSelection: payload,
      selectedMinorSubjects: [],
      subjectSelectionMetas: [], // Added for backward compatibility
      hasFormSubmissions: false, // No form submissions in old format
      actualStudentSelections: [], // No actual selections in old format
      session: { id: 1 }, // Default session for backward compatibility
    };
  }
  return payload as StudentSubjectSelectionApiResponse;
}

// Fetch current active selections (flat DTO array)
export async function fetchCurrentActiveSelections(studentId: number) {
  const res = await api.get<ApiResponse<DbStudentSubjectSelectionDto[]>>(
    `/api/subject-selection/student-subject-selection/active/${studentId}`,
  );
  return res.data.payload;
}

// Note: Subject selection meta data is now included in the main fetchStudentSubjectSelections API response

// Fetch mandatory subjects for a student (non-optional papers for their academic year)
export async function fetchMandatorySubjects(studentId: number) {
  const res = await api.get<ApiResponse<any[]>>(`/api/subject-selection/students/${studentId}/mandatory-papers`);
  return res.data.payload;
}

// Save student subject selections
export async function saveStudentSubjectSelections(
  selections: StudentSubjectSelectionForSave[],
): Promise<SaveSelectionsResponse> {
  try {
    const res = await api.post<ApiResponse<StudentSubjectSelectionForSave[]>>(
      "/api/subject-selection/student-subject-selection/",
      selections,
    );

    return {
      success: true,
      data: res.data.payload,
    };
  } catch (error: any) {
    // Handle validation errors
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
