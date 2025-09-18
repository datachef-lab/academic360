import { ApiResponse } from "@/types/api-response";
import { AcademicIdentifier } from "@/types/user/academic-identifier";
import axiosInstance from "@/utils/api";

const BASE_URL = "/api/academic-identifiers";

export async function getAllAcademicIdentifiers(): Promise<ApiResponse<AcademicIdentifier[]>> {
  try {
    const response = await axiosInstance.get(BASE_URL);
    return response.data.payload;
  } catch {
    throw new Error("Failed to fetch all academic identifiers");
  }
}

export async function getAcademicIdentifierById(id: number): Promise<ApiResponse<AcademicIdentifier | null>> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data.payload;
  } catch {
    throw new Error(`Failed to fetch academic identifier with id ${id}`);
  }
}

export async function getAcademicIdentifierByStudentId(studentId: number): Promise<AcademicIdentifier | null> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/student/${studentId}`);
    return response.data.payload;
  } catch {
    throw new Error(`Failed to fetch academic identifier for studentId ${studentId}`);
  }
}

export async function createAcademicIdentifier(
  payload: Partial<AcademicIdentifier>,
): Promise<ApiResponse<AcademicIdentifier>> {
  try {
    const response = await axiosInstance.post(BASE_URL, payload);
    return response.data.payload;
  } catch {
    throw new Error("Failed to create academic identifier");
  }
}

export async function updateAcademicIdentifier(
  id: number,
  payload: Partial<AcademicIdentifier>,
): Promise<ApiResponse<AcademicIdentifier>> {
  try {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
    return response.data.payload;
  } catch {
    throw new Error(`Failed to update academic identifier with id ${id}`);
  }
}

export async function deleteAcademicIdentifier(id: number): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return response.data.payload;
  } catch {
    throw new Error(`Failed to delete academic identifier with id ${id}`);
  }
}

export async function deleteAcademicIdentifierByStudentId(studentId: number): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/student/${studentId}`);
    return response.data.payload;
  } catch {
    throw new Error(`Failed to delete academic identifier for studentId ${studentId}`);
  }
}
