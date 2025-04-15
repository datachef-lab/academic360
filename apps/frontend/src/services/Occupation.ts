import { ApiResonse } from "@/types/api-response";
import { Occupation } from "@/types/resources/occupation";
import axiosInstance from "@/utils/api";

export async function updateOccupation(data: { id: number; name: string }): Promise<ApiResonse<Occupation[]>> {
  console.log("Occupation is coming....", data);
  const response = await axiosInstance.put(`/api/occupations/${data.id}`, data);
  return response.data;
}