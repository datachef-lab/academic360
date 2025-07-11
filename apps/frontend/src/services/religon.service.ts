import { ApiResonse } from "@/types/api-response";
import { PaginatedResponse } from "@/types/pagination";
import { Religion } from "@/types/resources/religion";
import axiosInstance from "@/utils/api";

export async function findAllReligions() {
    const res = await axiosInstance.get<ApiResonse<PaginatedResponse<Religion>>>("/api/religions");
    console.log("religions:", res.data);
    return res.data;
}