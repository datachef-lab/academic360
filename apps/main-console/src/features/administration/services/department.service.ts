import { DepartmentT } from "@repo/db/schemas";
import { ApiResponse } from "@/types/api-response";

import axiosInstance from "@/utils/api";

const BASE_URL = "/api/administration/departments";

export type DepartmentPayload = Pick<DepartmentT, "name" | "code" | "description" | "isActive">;

export async function getAllDepartments() {
  const { data } = await axiosInstance.get<ApiResponse<DepartmentT[]>>(BASE_URL);
  return data;
}

export async function createDepartment(payload: DepartmentPayload) {
  const { data } = await axiosInstance.post<ApiResponse<DepartmentT>>(BASE_URL, payload);
  return data;
}

export async function updateDepartment(id: number, payload: DepartmentPayload) {
  const { data } = await axiosInstance.put<ApiResponse<DepartmentT>>(`${BASE_URL}/${id}`, payload);
  return data;
}

export async function deleteDepartment(id: number) {
  const { data } = await axiosInstance.delete<ApiResponse<DepartmentT | null>>(`${BASE_URL}/${id}`);
  return data;
}
