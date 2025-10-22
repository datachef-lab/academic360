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
  subjectSelectionMetas?: any[]; // meta data for dynamic labels
  hasFormSubmissions?: boolean; // indicates if student has submitted through the form
  actualStudentSelections?: any[]; // actual form submissions from student-subject-selection table
  session?: { id: number; name?: string; [key: string]: any }; // session information
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

// Fetch mandatory subjects for a student (non-optional papers for their academic year)
export async function fetchMandatorySubjects(studentId: number) {
  const res = await axiosInstance.get(`/api/subject-selection/students/${studentId}/mandatory-papers`);
  return res.data.payload;
}
