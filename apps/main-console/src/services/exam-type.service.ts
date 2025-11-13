import { ApiResponse } from "@/types/api-response";
import { ExamTypeT } from "@repo/db/schemas/models/exams";
import axiosInstance from "@/utils/api";

export type { ExamTypeT };

const BASE_URL = "/api/exams/exam-types";

// Get all exam types
export async function getAllExamTypes(): Promise<ApiResponse<ExamTypeT[]>> {
  try {
    const response = await axiosInstance.get<ApiResponse<ExamTypeT[]>>(BASE_URL);
    return response.data;
  } catch {
    throw new Error("Failed to fetch all exam types");
  }
}

// Get a single exam type by id
export async function getExamTypeById(id: number): Promise<ApiResponse<ExamTypeT>> {
  try {
    const response = await axiosInstance.get<ApiResponse<ExamTypeT>>(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to fetch exam type with id ${id}`);
  }
}

// Create a new exam type
export async function createExamType(payload: Partial<ExamTypeT>): Promise<ApiResponse<ExamTypeT>> {
  try {
    const response = await axiosInstance.post<ApiResponse<ExamTypeT>>(BASE_URL, payload);
    return response.data;
  } catch {
    throw new Error("Failed to create exam type");
  }
}

// Update an exam type
export async function updateExamType(id: number, payload: Partial<ExamTypeT>): Promise<ApiResponse<ExamTypeT>> {
  try {
    const response = await axiosInstance.put<ApiResponse<ExamTypeT>>(`${BASE_URL}/${id}`, payload);
    return response.data;
  } catch {
    throw new Error(`Failed to update exam type with id ${id}`);
  }
}

// Delete an exam type
export async function deleteExamType(id: number): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete<ApiResponse<null>>(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to delete exam type with id ${id}`);
  }
}
