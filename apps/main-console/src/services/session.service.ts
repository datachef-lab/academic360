import { Session } from "@/types/academics/session";
import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

export async function findAllSessions(): Promise<ApiResponse<Session[]>> {
  const response = await axiosInstance.get<ApiResponse<Session[]>>("/api/sessions");
  return response.data;
}
