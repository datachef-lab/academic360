import { ApiResponse } from "@/types/api-response";
import type { HealthDto } from "@repo/db/dtos/user";
import axiosInstance from "@/utils/api";

const BASE_URL = "/api/health";

export async function getAllHealthDetails(): Promise<ApiResponse<HealthDto[]>> {
  try {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  } catch {
    throw new Error("Failed to fetch all health details");
  }
}

export async function getHealthDetailById(id: number): Promise<ApiResponse<HealthDto | null>> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to fetch health detail with id ${id}`);
  }
}

export async function getHealthDetailByStudentId(studentId: number): Promise<ApiResponse<HealthDto | null>> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/student/${studentId}`);
    return response.data;
  } catch (err) {
    if ((err as { response: { status: number } })?.response?.status === 404) {
      return { payload: null } as ApiResponse<HealthDto | null>;
    }
    throw new Error(`Failed to fetch health detail for studentId ${studentId}`);
  }
}

export async function createHealthDetail(payload: Partial<HealthDto>): Promise<ApiResponse<HealthDto>> {
  try {
    const response = await axiosInstance.post(BASE_URL, payload);
    return response.data;
  } catch {
    throw new Error("Failed to create health detail");
  }
}

export async function updateHealthDetail(id: number, payload: Partial<HealthDto>): Promise<ApiResponse<HealthDto>> {
  try {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
    return response.data;
  } catch {
    throw new Error(`Failed to update health detail with id ${id}`);
  }
}

export async function deleteHealthDetail(id: number): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to delete health detail with id ${id}`);
  }
}

export async function deleteHealthDetailByStudentId(studentId: number): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/student/${studentId}`);
    return response.data;
  } catch {
    throw new Error(`Failed to delete health detail for studentId ${studentId}`);
  }
}
