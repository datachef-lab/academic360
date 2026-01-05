import { ExamCandidateDto, ExamDto } from "@/dtos";
import { axiosInstance, PaginatedResponse } from "@/lib/utils";
import { ApiResponse } from "@/types/api-response";

export async function fetchExamsByStudentId(studentId: number): Promise<ApiResponse<PaginatedResponse<ExamDto>>> {
  const response = await axiosInstance.get(`/api/exams/schedule/student/${studentId}/exams`);
  return response.data;
}

export async function fetchExamCandidates(examId: number, studentId: number): Promise<ApiResponse<ExamCandidateDto[]>> {
  const response = await axiosInstance.get(`/api/exams/schedule/candidates?examId=${examId}&studentId=${studentId}`);
  return response.data;
}

export async function downloadAdmitCard(examId: number, studentId: number): Promise<Blob> {
  const response = await axiosInstance.get(
    `/api/exams/schedule/admit-card/download/single?examId=${examId}&studentId=${studentId}`,
    {
      responseType: "blob",
    },
  );
  return response.data;
}
