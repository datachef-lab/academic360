import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";
import type { DesignationT } from "@repo/db/schemas";

const BASE_URL = "/api/administration/designations";

export type DesignationPayload = Pick<DesignationT, "name" | "description" | "isActive">;

export async function getAllDesignations() {
  const { data } = await axiosInstance.get<ApiResponse<DesignationT[]>>(BASE_URL);
  return data;
}

export async function createDesignation(payload: DesignationPayload) {
  const { data } = await axiosInstance.post<ApiResponse<DesignationT>>(BASE_URL, payload);
  return data;
}

export async function updateDesignation(id: number, payload: DesignationPayload) {
  const { data } = await axiosInstance.put<ApiResponse<DesignationT>>(`${BASE_URL}/${id}`, payload);
  return data;
}

export async function deleteDesignation(id: number) {
  const { data } = await axiosInstance.delete<ApiResponse<DesignationT | null>>(`${BASE_URL}/${id}`);
  return data;
}
