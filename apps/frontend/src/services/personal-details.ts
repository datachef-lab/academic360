import { ApiResonse } from "@/types/api-response";
import { PersonalDetails } from "@/types/user/personal-details";
import axiosInstance from "@/utils/api";

export async function personalDetails(): Promise<ApiResonse<PersonalDetails>> {
  const response = await axiosInstance.get("/api/personal-details", { withCredentials: true });
  return response.data;
}

export async function fetchPersonalDetailsByStudentId(studentId: number): Promise<ApiResonse<PersonalDetails>> {
  const response = await axiosInstance.get(`/api/personal-details/student/${studentId}`, { withCredentials: true });
  return response.data;
}
