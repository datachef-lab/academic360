// Import DTOs from shared package
import {
  SubjectSelectionMetaDto,
  StudentSubjectSelectionDto as DbStudentSubjectSelectionDto,
} from "@repo/db/dtos/subject-selection";
import axiosInstance from "@/utils/api";
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

// For admin console - includes parent linking for audit trail
export interface AdminStudentSubjectSelectionForSave extends StudentSubjectSelectionForSave {
  parentId?: number; // Link to previous selection for audit trail
  createdBy: number; // Admin user ID who made the change
  reason?: string; // Reason for the change
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

// Save student subject selections (admin version with audit trail)
export async function saveStudentSubjectSelectionsAdmin(
  selections: AdminStudentSubjectSelectionForSave[],
): Promise<SaveSelectionsResponse> {
  try {
    const res = await axiosInstance.post<ApiResponse<StudentSubjectSelectionForSave[]>>(
      "/api/subject-selection/student-subject-selection/admin",
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
