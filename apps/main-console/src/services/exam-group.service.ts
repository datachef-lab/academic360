import { ExamGroupDto, ExamPapersWithStats } from "@/dtos";
import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

export async function fetchExamGroupById(id: number): Promise<ExamGroupDto> {
  const response = await axiosInstance.get<ApiResponse<ExamGroupDto>>(`/api/exam-groups/${id}`);
  return response.data.payload;
}

export async function deleteExamGroupById(examGroupId: number): Promise<{ examGroupId: number }> {
  const response = await axiosInstance.delete<ApiResponse<{ examGroupId: number }>>(`/api/exam-groups/${examGroupId}`);
  return response.data.payload;
}

export async function fetchExamGroupPapersStatsByExamId(id: number): Promise<
  {
    examId: number;
    examPapers: ExamPapersWithStats[];
  }[]
> {
  const response = await axiosInstance.get<
    ApiResponse<
      {
        examId: number;
        examPapers: ExamPapersWithStats[];
      }[]
    >
  >(`/api/exam-groups/paper-stats/${id}`);

  return response.data.payload;
}
