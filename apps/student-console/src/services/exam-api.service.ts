import { ExamDto } from "@/dtos";
import { axiosInstance, PaginatedResponse } from "@/lib/utils";
import { ApiResponse } from "@/types/api-response";

export async function fetchExamsByStudentId(studentId: number): Promise<ApiResponse<PaginatedResponse<ExamDto>>> {
  const response = await axiosInstance.get(`/api/exams/schedule/student/${studentId}/exams`);
  return response.data;
}
