import { ApiResonse } from "@/types/api-response";
import { PaginatedResponse } from "@/types/pagination";
import { Occupation } from "@/types/resources/occupation";
import axiosInstance from "@/utils/api";

export async function updateOccupation(data: { id: number; name: string }): Promise<ApiResonse<Occupation[]>> {
    console.log("Occupation is coming....", data);
    const response = await axiosInstance.put(`/api/occupations/${data.id}`, data);
    return response.data;
}

export async function findAllOccupations() {
    const response = await axiosInstance.get<ApiResonse<PaginatedResponse<Occupation>>>(`/api/occupations?pageSize=100`);
    return response.data;
}