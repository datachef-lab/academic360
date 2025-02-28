import { ApiResonse } from "@/types/api-response";
import { Qualification } from "@/types/resources/qualification";
import axiosInstance from "@/utils/api";

export async function qualification(): Promise<ApiResonse<Qualification[]>> {
  const response = await axiosInstance.get("/api/qualifications", { withCredentials: true });
  return response.data;
}
