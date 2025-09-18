import { ApiResponse } from "@/types/api-response";
import { AcademicHistory } from "@/types/user/academic-history";
import axiosInstance from "@/utils/api";

const BASE_URL = "/api/academic-history";

export async function getAllAcademicHistories(): Promise<ApiResponse<AcademicHistory[]>> {
  try {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching all academic histories:", error);
    throw new Error("Failed to fetch all academic histories");
  }
}

export async function getAcademicHistoryById(id: number): Promise<ApiResponse<AcademicHistory | null>> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching academic history with id ${id}:`, error);
    throw new Error(`Failed to fetch academic history with id ${id}`);
  }
}

export async function getAcademicHistoryByStudentId(studentId: number): Promise<ApiResponse<AcademicHistory | null>> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/student/${studentId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching academic history:", error);
    throw new Error(`Failed to fetch academic history for studentId ${studentId}`);
  }
}

export async function createAcademicHistory(payload: Partial<AcademicHistory>): Promise<ApiResponse<AcademicHistory>> {
  try {
    const response = await axiosInstance.post(BASE_URL, payload);
    return response.data;
  } catch (error) {
    console.error("Error creating academic history:", error);
    throw new Error("Failed to create academic history");
  }
}

export async function updateAcademicHistory(
  id: number,
  payload: Partial<AcademicHistory>,
): Promise<ApiResponse<AcademicHistory>> {
  try {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error(`Error updating academic history with id ${id}:`, error);
    throw new Error(`Failed to update academic history with id ${id}`);
  }
}

export async function deleteAcademicHistory(id: number): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting academic history with id ${id}:`, error);
    throw new Error(`Failed to delete academic history with id ${id}`);
  }
}

export async function deleteAcademicHistoryByStudentId(studentId: number): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/student/${studentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting academic history for studentId ${studentId}:`, error);
    throw new Error(`Failed to delete academic history for studentId ${studentId}`);
  }
}
