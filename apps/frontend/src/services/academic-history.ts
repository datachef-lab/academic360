import { ApiResonse } from "@/types/api-response";
import { AcademicHistory } from "@/types/user/academic-history";
import axiosInstance from "@/utils/api";

export async function academicHistory(): Promise<ApiResonse<AcademicHistory>> {
  const response = await axiosInstance.get("/api/academic-history", { withCredentials: true });
  return response.data;
}
