import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";
import { PersonalDetails } from "@/types/user/personal-details";

// Type for API payloads without auto-generated fields
type PersonalDetailsPayload = Omit<PersonalDetails, "id" | "createdAt" | "updatedAt">;

const BASE_URL = "/api/personal-details";

export async function getAllPersonalDetails(): Promise<ApiResponse<PersonalDetails[]>> {
  try {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  } catch {
    throw new Error("Failed to fetch all personal details");
  }
}

export async function getPersonalDetailById(id: string): Promise<ApiResponse<PersonalDetails | null>> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to fetch personal detail with id ${id}`);
  }
}

export async function getPersonalDetailByStudentId(studentId: string): Promise<ApiResponse<PersonalDetails | null>> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/student/${studentId}`);
    return response.data;
  } catch {
    throw new Error(`Failed to fetch personal detail for studentId ${studentId}`);
  }
}

export async function createPersonalDetail(payload: PersonalDetailsPayload): Promise<ApiResponse<PersonalDetails>> {
  try {
    const response = await axiosInstance.post(BASE_URL, payload);
    return response.data;
  } catch {
    throw new Error("Failed to create personal detail");
  }
}

export async function updatePersonalDetail(
  id: string,
  payload: PersonalDetailsPayload,
): Promise<ApiResponse<PersonalDetails>> {
  try {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
    return response.data;
  } catch {
    throw new Error(`Failed to update personal detail with id ${id}`);
  }
}

export async function updatePersonalDetailByStudentId(
  studentId: string,
  payload: PersonalDetailsPayload,
): Promise<ApiResponse<PersonalDetails>> {
  try {
    const response = await axiosInstance.put(`${BASE_URL}/student/${studentId}`, payload);
    return response.data;
  } catch {
    throw new Error(`Failed to update personal detail for studentId ${studentId}`);
  }
}

export async function deletePersonalDetail(id: string): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to delete personal detail with id ${id}`);
  }
}

export async function deletePersonalDetailByStudentId(studentId: string): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/student/${studentId}`);
    return response.data;
  } catch {
    throw new Error(`Failed to delete personal detail for studentId ${studentId}`);
  }
}
