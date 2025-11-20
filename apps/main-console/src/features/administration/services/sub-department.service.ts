import { SubDepartmentT } from "@/schemas";
import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

const BASE_URL = "/api/administration/sub-departments";

export type SubDepartmentPayload = {
  departmentId: number;
  name: string;
  shortName: string;
  description: string;
  isActive?: boolean;
};

export async function getAllSubDepartments() {
  const { data } = await axiosInstance.get<ApiResponse<SubDepartmentT[]>>(BASE_URL);
  return data;
}

export async function createSubDepartment(payload: SubDepartmentPayload) {
  const { data } = await axiosInstance.post<ApiResponse<SubDepartmentT>>(BASE_URL, payload);
  return data;
}

export async function updateSubDepartment(id: number, payload: SubDepartmentPayload) {
  const { data } = await axiosInstance.put<ApiResponse<SubDepartmentT>>(`${BASE_URL}/${id}`, payload);
  return data;
}
