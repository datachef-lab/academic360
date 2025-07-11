import { ApiResonse } from "@/types/api-response";
import { AcademicHistory } from "@/types/user/academic-history";
import axiosInstance from "@/utils/api";

const BASE_URL = "/api/academic-history";

export async function getAllAcademicHistories(): Promise<ApiResonse<AcademicHistory[]>> {
  try {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  } catch {
    throw new Error("Failed to fetch all academic histories");
  }
}

export async function getAcademicHistoryById(id: number): Promise<ApiResonse<AcademicHistory | null>> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to fetch academic history with id ${id}`);
  }
}

export async function getAcademicHistoryByStudentId(studentId: number): Promise<ApiResonse<AcademicHistory | null>> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/student/${studentId}`);
    return response.data;
  } catch {
    throw new Error(`Failed to fetch academic history for studentId ${studentId}`);
  }
}

export async function createAcademicHistory(payload: Partial<AcademicHistory>): Promise<ApiResonse<AcademicHistory>> {
  try {
    const response = await axiosInstance.post(BASE_URL, payload);
    return response.data;
  } catch {
    throw new Error("Failed to create academic history");
  }
}

export async function updateAcademicHistory(id: number, payload: Partial<AcademicHistory>): Promise<ApiResonse<AcademicHistory>> {
  try {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
    return response.data;
  } catch {
    throw new Error(`Failed to update academic history with id ${id}`);
  }
}

export async function deleteAcademicHistory(id: number): Promise<ApiResonse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to delete academic history with id ${id}`);
  }
}

export async function deleteAcademicHistoryByStudentId(studentId: number): Promise<ApiResonse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/student/${studentId}`);
    return response.data;
  } catch {
    throw new Error(`Failed to delete academic history for studentId ${studentId}`);
  }
}
