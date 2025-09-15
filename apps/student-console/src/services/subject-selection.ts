export interface SubjectTypeDto {
  id: number;
  name: string;
}

export interface PaperDto {
  id: number;
  name?: string | null;
  code?: string | null;
  subject?: { id: number; name?: string | null } | null;
}

export interface StudentSubjectSelectionDto {
  subjectType: SubjectTypeDto;
  paperOptions: PaperDto[];
}

export interface StudentSubjectSelectionApiResponse {
  studentSubjectsSelection: StudentSubjectSelectionDto[];
  selectedMinorSubjects: PaperDto[]; // earlier selected Minor papers
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
    };
  }
  return payload as StudentSubjectSelectionApiResponse;
}
