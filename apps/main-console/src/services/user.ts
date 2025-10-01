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
  type?: "ADMIN" | "STUDENT" | "STAFF",
): Promise<ApiResponse<PaginatedResponse<User>>> {
  let url = `/api/users?page=${page}&pageSize=${pageSize}`;
  if (type) {
    url += `&type=${type}`;
  }
  const response = await axiosInstance.get(url);
  console.log(response.data);
  return response.data;
}

export async function findAdminsAndStaff(page: number, pageSize: number): Promise<User[]> {
  const [adminsRes, staffRes] = await Promise.all([
    findAllUsers(page, pageSize, "ADMIN"),
    findAllUsers(page, pageSize, "STAFF"),
  ]);
  const admins = adminsRes.payload.content || [];
  const staff = staffRes.payload.content || [];
  // Merge and de-duplicate by id
  const map = new Map<number, User>();
  for (const u of [...admins, ...staff]) {
    map.set(u.id as number, u);
  }
  return Array.from(map.values());
}

// services/user.ts
export async function addUser(
  user: Omit<User, "id" | "createdAt" | "updatedAt" | "disabled">,
): Promise<ApiResponse<User>> {
  const response = await axiosInstance.post("/auth", user);
  return response.data;
}
