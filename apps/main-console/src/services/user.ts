import { ApiResponse } from "@/types/api-response";
import { PaginatedResponse } from "@/types/pagination";
import { User } from "@/types/user/user";
import axiosInstance from "@/utils/api";

export async function getSearchedUsers(
  page: number,
  pageSize: number,
  searchText: string,
): Promise<ApiResponse<PaginatedResponse<User>>> {
  const response = await axiosInstance.get(
    `/api/users/search?page=${page}&pageSize=${pageSize}&searchText=${searchText}`,
  );
  console.log(response.data);
  return response.data;
}

export async function findAllUsers(
  page: number,
  pageSize: number,
  type?: "ADMIN" | "STUDENT" | "TEACHER",
): Promise<ApiResponse<PaginatedResponse<User>>> {
  let url = `/api/users?page=${page}&pageSize=${pageSize}`;
  if (type) {
    url += `&type=${type}`;
  }
  const response = await axiosInstance.get(url);
  console.log(response.data);
  return response.data;
}

// services/user.ts
export async function addUser(
  user: Omit<User, "id" | "createdAt" | "updatedAt" | "disabled">,
): Promise<ApiResponse<User>> {
  const response = await axiosInstance.post("/auth", user);
  return response.data;
}
