import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";
import type { UserStatusMasterT } from "@repo/db/schemas/models/administration";

const BASE_URL = "/api/administration/user-status-masters";

export type UserStatusPayload = Pick<
  UserStatusMasterT,
  "name" | "code" | "description" | "isActive" | "parentUserStatusMasterId" | "color" | "bgColor"
>;

export interface UserStatusMasterDto extends Omit<UserStatusMasterT, "parentUserStatusMasterId"> {
  parentUserStatusMaster: UserStatusMasterT | null;
}

export async function getAllUserStatusMasters() {
  const { data } = await axiosInstance.get<ApiResponse<UserStatusMasterDto[]>>(BASE_URL);
  return data;
}

export async function createUserStatusMaster(payload: UserStatusPayload) {
  const { data } = await axiosInstance.post<ApiResponse<UserStatusMasterDto>>(BASE_URL, payload);
  return data;
}

export async function updateUserStatusMaster(id: number, payload: UserStatusPayload) {
  const { data } = await axiosInstance.put<ApiResponse<UserStatusMasterDto>>(
    `${BASE_URL}/${id}`,
    payload,
  );
  return data;
}

export async function deleteUserStatusMaster(id: number) {
  const { data } = await axiosInstance.delete<ApiResponse<null>>(`${BASE_URL}/${id}`);
  return data;
}
