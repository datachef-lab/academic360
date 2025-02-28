import { ApiResonse } from "@/types/api-response";
import { Religion } from "@/types/resources/religion";
import axiosInstance from "@/utils/api";

export async function religion(): Promise<ApiResonse<Religion>> {
  const response = await axiosInstance.get("/api/religions", { withCredentials: true });
  return response.data;
}
