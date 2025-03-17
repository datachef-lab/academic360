import { ApiResonse } from "@/types/api-response";
import { Health } from "@/types/user/health";
import axiosInstance from "@/utils/api";

export async function healthDetails(): Promise<ApiResonse<Health>> {
  const response = await axiosInstance.get("/api/health-details", { withCredentials: true });
  return response.data;
}

export async function fetchHealthlDetailsByStudentId(studentId: number): Promise<ApiResonse<Health>> {
  const response = await axiosInstance.get(`/api/health-details/student/${studentId}`, { withCredentials: true });
  return response.data;
}