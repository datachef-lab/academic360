import { ApiResponse } from "@/types/api-response";
import { Family } from "@/types/user/family";
import axiosInstance from "@/utils/api";

const BASE_URL = "/api/family";

export async function getAllFamilyDetails(): Promise<ApiResponse<Family[]>> {
  try {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  } catch {
    throw new Error("Failed to fetch all family details");
  }
}

export async function getFamilyDetailById(id: number): Promise<ApiResponse<Family | null>> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to fetch family detail with id ${id}`);
  }
}

export async function getFamilyDetailByStudentId(studentId: number): Promise<ApiResponse<Family | null>> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/student/${studentId}`);
    return response.data;
  } catch {
    throw new Error(`Failed to fetch family detail for studentId ${studentId}`);
  }
}

export async function createFamilyDetail(payload: unknown): Promise<ApiResponse<Family>> {
  try {
    const response = await axiosInstance.post(BASE_URL, payload);
    return response.data;
  } catch {
    throw new Error("Failed to create family detail");
  }
}

export async function updateFamilyDetail(id: number, payload: unknown): Promise<ApiResponse<Family>> {
  try {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
    return response.data;
  } catch {
    throw new Error(`Failed to update family detail with id ${id}`);
  }
}

export async function deleteFamilyDetail(id: number): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to delete family detail with id ${id}`);
  }
}

export async function deleteFamilyDetailByStudentId(studentId: number): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/student/${studentId}`);
    return response.data;
  } catch {
    throw new Error(`Failed to delete family detail for studentId ${studentId}`);
  }
}
