import { ApiResonse } from "@/types/api-response";
import { PaginatedResponse } from "@/types/pagination";
import { Nationality } from "@/types/resources/nationality";
import axiosInstance from "@/utils/api";

export async function updateNationality(data: { id: number; name: string, code: number }): Promise<ApiResonse<Nationality[]>> {
    console.log("Nationality is coming....", data);
    const response = await axiosInstance.put(`/api/nationality/${data.id}`, data);
    return response.data;
}

export async function findAllNationalities(): Promise<ApiResonse<PaginatedResponse<Nationality>>> {
    const response = await axiosInstance.get(`/api/nationality`);
    console.log("Nationality is coming....", response.data);
    return response.data;
}