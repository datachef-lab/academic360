import { ApiResponse } from "@/types/api-response";
import { DisabilityCode } from "@/types/user/disability-code";
import axiosInstance from "@/utils/api";

const BASE_URL = "/api/disability-codes";

export async function getAllDisabilityCodes(): Promise<ApiResponse<DisabilityCode[]>> {
  try {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  } catch {
    throw new Error("Failed to fetch all disability codes");
  }
}

export async function getDisabilityCodeById(id: number): Promise<ApiResponse<DisabilityCode | null>> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to fetch disability code with id ${id}`);
  }
}

export async function createDisabilityCode(payload: Partial<DisabilityCode>): Promise<ApiResponse<DisabilityCode>> {
  try {
    const response = await axiosInstance.post(BASE_URL, payload);
    return response.data;
  } catch {
    throw new Error("Failed to create disability code");
  }
}

export async function updateDisabilityCode(
  id: number,
  payload: Partial<DisabilityCode>,
): Promise<ApiResponse<DisabilityCode>> {
  try {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
    return response.data;
  } catch {
    throw new Error(`Failed to update disability code with id ${id}`);
  }
}

export async function deleteDisabilityCode(id: number): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to delete disability code with id ${id}`);
  }
}
