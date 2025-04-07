import { ApiResonse } from "@/types/api-response";
import { Nationality } from "@/types/resources/nationality";
import axiosInstance from "@/utils/api";

export async function updateNationality(data: { id: number; name: string, code:number}): Promise<ApiResonse<Nationality[]>> {
  console.log("Nationality is coming....", data);
  const response = await axiosInstance.put(`/api/nationality/${data.id}`, data);
  return response.data;
}