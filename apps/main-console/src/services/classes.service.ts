import { Class } from "@/types/academics/class";
import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

export async function getAllClasses(): Promise<Class[]> {
  const res = await axiosInstance.get<ApiResponse<Class[]>>("/api/classes");
  return res.data.payload;
}
