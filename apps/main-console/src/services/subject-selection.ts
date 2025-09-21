import axiosInstance from "@/utils/api";

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

export interface StudentSubjectSelectionDto {
  subjectType: SubjectTypeDto;
  paperOptions: PaperDto[];
}

export interface StudentSubjectSelectionApiResponse {
  studentSubjectsSelection: StudentSubjectSelectionDto[];
  selectedMinorSubjects: PaperDto[]; // earlier selected Minor papers
}

export async function fetchStudentSubjectSelections(studentId: number): Promise<StudentSubjectSelectionApiResponse> {
  const res = await axiosInstance.get(`/api/subject-selection/students/${studentId}/selections`);
  // Backward compatibility: if old payload shape (array), map into new structure
  const payload = res.data?.payload;
  if (Array.isArray(payload)) {
    return {
      studentSubjectsSelection: payload,
      selectedMinorSubjects: [],
    };
  }
  return payload as StudentSubjectSelectionApiResponse;
}
