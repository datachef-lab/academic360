import { Degree } from "@/types/resources/degree";
import { ApiResonse } from "@/types/api-response";
import axiosInstance from "@/utils/api";
import { PaginatedResponse } from "@/types/pagination";

export async function findAllDegrees(): Promise<Degree[]> {
    const res = await axiosInstance.get<ApiResonse<PaginatedResponse<Degree>>>("/api/degree");
    return res.data.payload.content;
}