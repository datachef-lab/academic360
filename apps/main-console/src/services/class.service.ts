import { Class } from "@/types/academics/class";
import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

// Get all Classs
export async function getAllClasss(): Promise<ApiResponse<Class[]>> {
  const response = await axiosInstance.get(`/api/v1/classes`);
  return response.data;
}

// Get a single Class
export async function getClass(ClassId: number): Promise<ApiResponse<Class>> {
  const response = await axiosInstance.get(`/api/v1/classes/${ClassId}`);
  return response.data;
}

// Add a new Class
export async function addClass(newClass: Class): Promise<ApiResponse<Class>> {
  const response = await axiosInstance.post(`/api/v1/classes`, newClass);
  return response.data;
}

// Delete a Class
export async function deleteClass(ClassId: number): Promise<ApiResponse<void>> {
  const response = await axiosInstance.delete(`/api/v1/classes/${ClassId}`);
  console.log(response.data);
  return response.data;
}

// Update a Class
export async function updateClass(ClassId: number, Class: Partial<Class>): Promise<ApiResponse<Class>> {
  console.log("in fe, Class:", Class);

  const response = await axiosInstance.put(`/api/classes/${ClassId}`, Class);
  console.log(response.data);
  return response.data;
}
