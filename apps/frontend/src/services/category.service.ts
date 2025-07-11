import { ApiResonse } from "@/types/api-response";
import { PaginatedResponse } from "@/types/pagination";
import { Category } from "@/types/resources/category";
import axiosInstance from "@/utils/api";

export async function findAllCategories() {
    const response = await axiosInstance.get<ApiResonse<PaginatedResponse<Category>>>("/api/categories");
    return response.data;
}