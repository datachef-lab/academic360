import { ApiResonse } from "@/types/api-response";
import { LanguageMedium } from "@/types/resources/language-medium";
import axiosInstance from "@/utils/api";

export async function languages(): Promise<ApiResonse<LanguageMedium>> {
  const response = await axiosInstance.get("/api/languages", { withCredentials: true });
  return response.data;
}
