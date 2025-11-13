import type { Department } from "@repo/db";

import axiosInstance from "@/utils/api";
import type { ApiResponse } from "@/types/api-response";

const BASE_URL = "/api/administration/departments";

export type DepartmentPayload = Pick<Department, "name" | "code" | "description" | "isActive">;

export async function getAllDepartments() {
  const { data } = await axiosInstance.get<ApiResponse<Department[]>>(BASE_URL);
  return data;
}

export async function createDepartment(payload: DepartmentPayload) {
  const { data } = await axiosInstance.post<ApiResponse<Department>>(BASE_URL, payload);
  return data;
}

export async function updateDepartment(id: number, payload: DepartmentPayload) {
  const { data } = await axiosInstance.put<ApiResponse<Department>>(`${BASE_URL}/${id}`, payload);
  return data;
}

export async function deleteDepartment(id: number) {
  const { data } = await axiosInstance.delete<ApiResponse<Department | null>>(`${BASE_URL}/${id}`);
  return data;
}
