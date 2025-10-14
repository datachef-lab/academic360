import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

export interface UserStats {
  adminCount: number;
  staffCount: number;
  studentCount: number;
  totalUsers: number;
}

export async function getUserStats(): Promise<ApiResponse<UserStats>> {
  const response = await axiosInstance.get<ApiResponse<UserStats>>("/api/users/stats");
  return response.data;
}
