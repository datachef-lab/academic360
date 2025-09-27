// Import DTOs from shared package
import {
  SubjectSelectionMetaDto,
  StudentSubjectSelectionDto as DbStudentSubjectSelectionDto,
} from "@repo/db/dtos/subject-selection";

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
  selectedMinorSubjects: PaperDto[]; // earlier selected Minor papers
  subjectSelectionMetas: SubjectSelectionMetaDto[]; // meta data for dynamic labels
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
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const res = await fetch(`${baseUrl}/api/subject-selection/students/${studentId}/selections`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch subject selections (${res.status})`);
  }
  const json = await res.json();
  // Backward compatibility: if old payload shape (array), map into new structure
  const payload = json?.payload;
  if (Array.isArray(payload)) {
    return {
      studentSubjectsSelection: payload,
      selectedMinorSubjects: [],
      subjectSelectionMetas: [],
    };
  }
  return payload as StudentSubjectSelectionApiResponse;
}

// Note: Subject selection meta data is now included in the main fetchStudentSubjectSelections API response

// Save student subject selections
export async function saveStudentSubjectSelections(
  selections: StudentSubjectSelectionForSave[],
): Promise<SaveSelectionsResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const res = await fetch(`${baseUrl}/api/subject-selection/student-subject-selection/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(selections),
  });

  const json = await res.json();

  if (!res.ok) {
    // Handle validation errors
    if (res.status === 400 && json.payload?.errors) {
      return {
        success: false,
        errors: json.payload.errors,
      };
    }
    throw new Error(`Failed to save subject selections (${res.status}): ${json.message || "Unknown error"}`);
  }

  return {
    success: true,
    data: json.payload,
  };
}
