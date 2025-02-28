import { ApiResonse } from "@/types/api-response";
import { Nationality } from "@/types/resources/nationality";
import axiosInstance from "@/utils/api";

export async function nationality(): Promise<ApiResonse<Nationality>> {
  const response = await axiosInstance.get("/api/nationality", { withCredentials: true });
  return response.data;
}
