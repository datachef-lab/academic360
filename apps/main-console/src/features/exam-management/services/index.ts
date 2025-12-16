import { ExamDto } from "@/dtos";
import { ExamT } from "@repo/db/schemas";
import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

const BASE_URL = "/api/exams/schedule";

export async function doAssignExam(dto: ExamDto): Promise<ApiResponse<ExamT>> {
  try {
    const response = await axiosInstance.post(BASE_URL, dto);
    console.log("In doAssignExam(), response:", response);
    return response.data;
  } catch (error) {
    console.error("Error fetching all academic histories:", error);
    throw new Error("Failed to fetch all academic histories");
  }
}
