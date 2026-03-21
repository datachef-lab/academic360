import { ExamCandidateDto, ExamGroupDto } from "@/dtos";
import { axiosInstance, PaginatedResponse } from "@/lib/utils";
import { ApiResponse } from "@/types/api-response";

export async function fetchExamGroupsByStudentId(
  studentId: number,
): Promise<ApiResponse<PaginatedResponse<ExamGroupDto>>> {
  const response = await axiosInstance.get(`/api/exam-groups/student/${studentId}`);
  return response.data;
}

export async function fetchExamCandidatesbyExamGroupIdAndStudentId(
  examGroupId: number,
  studentId: number,
): Promise<ApiResponse<ExamCandidateDto[]>> {
  const response = await axiosInstance.get(
    `/api/exam-groups/candidates?examGroupId=${examGroupId}&studentId=${studentId}`,
  );
  return response.data;
}
