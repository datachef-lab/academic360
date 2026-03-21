import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";
import type { UserTypeT } from "@repo/db/schemas/models/administration";

const BASE_URL = "/api/administration/user-types";

export type UserTypePayload = Pick<
  UserTypeT,
  "name" | "code" | "description" | "isActive" | "parentUserTypeId"
>;

export async function getAllUserTypes() {
  const { data } = await axiosInstance.get<ApiResponse<UserTypeT[]>>(BASE_URL);
  return data;
}

export async function createUserType(payload: UserTypePayload) {
  const { data } = await axiosInstance.post<ApiResponse<UserTypeT>>(BASE_URL, payload);
  return data;
}

export async function updateUserType(id: number, payload: UserTypePayload) {
  const { data } = await axiosInstance.put<ApiResponse<UserTypeT>>(`${BASE_URL}/${id}`, payload);
  return data;
}

export async function deleteUserType(id: number) {
  const { data } = await axiosInstance.delete<ApiResponse<UserTypeT | null>>(`${BASE_URL}/${id}`);
  return data;
}
