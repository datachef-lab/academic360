import { ApiResonse } from "@/types/api-response";
import { Health } from "@/types/user/health";
import { Person } from "@/types/user/person";
import axiosInstance from "@/utils/api";

export async function healthDetails(): Promise<ApiResonse<Health>> {
  const response = await axiosInstance.get("/api/health-details", { withCredentials: true });
  return response.data;
}

export async function fetchHealthDetailsByStudentId(studentId: number): Promise<ApiResonse<Health>> {
  const response = await axiosInstance.get(`/api/health-details/${studentId}`, { withCredentials: true });
  return response.data;
}

export async function fetchAllPersonByStudentId(studentId: number): Promise<ApiResonse<Person>> {
  const response = await axiosInstance.get(`/api/person/${studentId}`, { withCredentials: true });
  return response.data;
}