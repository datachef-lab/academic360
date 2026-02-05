import axiosInstance from "@/lib/api";
import type { ApiResponse } from "@/lib/types";
import type { ExamDto, ExamCandidateDto } from "@repo/db/dtos/exams";

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
}

export async function fetchExamsByStudentId(studentId: number): Promise<ApiResponse<PaginatedResponse<ExamDto>>> {
  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<ExamDto>>>(
    `/api/exams/schedule/student/${studentId}/exams`,
  );
  return response.data;
}

export async function fetchExamById(id: number): Promise<ApiResponse<ExamDto>> {
  const response = await axiosInstance.get<ApiResponse<ExamDto>>(`/api/exams/schedule/${id}`);
  return response.data;
}

export async function fetchExamCandidates(examId: number, studentId: number): Promise<ApiResponse<ExamCandidateDto[]>> {
  const response = await axiosInstance.get<ApiResponse<ExamCandidateDto[]>>(
    `/api/exams/schedule/candidates?examId=${examId}&studentId=${studentId}`,
  );
  return response.data;
}

export async function downloadAdmitCard(examId: number, studentId: number): Promise<Blob> {
  const response = await axiosInstance.get(
    `/api/exams/schedule/admit-card/download/single?examId=${examId}&studentId=${studentId}`,
    { responseType: "blob" },
  );
  return response.data;
}
