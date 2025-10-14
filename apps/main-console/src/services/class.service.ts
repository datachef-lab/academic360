import { Class } from "@/types/academics/class";
import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

export async function findAllClasses(): Promise<ApiResponse<Class[]>> {
  const response = await axiosInstance.get<ApiResponse<Class[]>>("/api/classes");
  return response.data;
}

export async function addClass(classData: Class): Promise<ApiResponse<Class>> {
  const response = await axiosInstance.post<ApiResponse<Class>>("/api/classes", classData);
  return response.data;
}

export async function updateClass(id: number, classData: Class): Promise<ApiResponse<Class>> {
  const response = await axiosInstance.put<ApiResponse<Class>>(`/api/classes/${id}`, classData);
  return response.data;
}

export async function deleteClass(id: number): Promise<ApiResponse<void>> {
  const response = await axiosInstance.delete<ApiResponse<void>>(`/api/classes/${id}`);
  return response.data;
}

export const classService = {
  findAllClasses,
  addClass,
  updateClass,
  deleteClass,
};
