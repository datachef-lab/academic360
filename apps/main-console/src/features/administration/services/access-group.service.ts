import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";
import type {
  AccessGroupDto,
  AccessGroupCreateInput,
  AccessGroupUpdateInput,
} from "@repo/db/dtos/administration";

const BASE_URL = "/api/administration/access-groups";

export async function getAllAccessGroups() {
  const { data } = await axiosInstance.get<ApiResponse<AccessGroupDto[]>>(BASE_URL);
  return data;
}

export async function getAccessGroupById(id: number) {
  const { data } = await axiosInstance.get<ApiResponse<AccessGroupDto>>(`${BASE_URL}/${id}`);
  return data;
}

export async function createAccessGroup(payload: AccessGroupCreateInput) {
  const { data } = await axiosInstance.post<ApiResponse<AccessGroupDto>>(BASE_URL, payload);
  return data;
}

export async function updateAccessGroup(id: number, payload: AccessGroupUpdateInput) {
  const { data } = await axiosInstance.put<ApiResponse<AccessGroupDto>>(
    `${BASE_URL}/${id}`,
    payload,
  );
  return data;
}

export async function deleteAccessGroup(id: number) {
  const { data } = await axiosInstance.delete<ApiResponse<null>>(`${BASE_URL}/${id}`);
  return data;
}
