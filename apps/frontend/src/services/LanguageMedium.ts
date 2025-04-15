import { ApiResonse } from "@/types/api-response";
import { LanguageMedium } from "@/types/resources/language-medium";
import axiosInstance from "@/utils/api";

export async function updateLanguageMedium(data: { id: number; name: string }): Promise<ApiResonse<LanguageMedium[]>> {
  console.log("language medium is coming....", data);
  const response = await axiosInstance.put(`/api/languages/${data.id}`, data);
  return response.data;
}
