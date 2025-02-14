import { ApiResonse } from "@/types/api-response";
import { PaginatedResponse } from "@/types/pagination";
import { User } from "@/types/user/user";
import axiosInstance from "@/utils/api";

export async function getSearchedUsers(page: number, pageSize: number, searchText: string): Promise<ApiResonse<PaginatedResponse<User>>> {
    const response = await axiosInstance.get(`/api/users/search?page=${page}&pageSize=${pageSize}&searchText=${searchText}`);
    console.log(response.data);
    return response.data;
}