import { Class } from "@/types/academics/class";
import { ApiResonse } from "@/types/api-response";
import axiosInstance from "@/utils/api";


// Get all Classs
export async function getAllClasss(): Promise<ApiResonse<Class[]>> {
    const response = await axiosInstance.get(`/api/v1/classes`);
    return response.data;
}

// Get a single Class
export async function getClass(ClassId: number): Promise<ApiResonse<Class>> {
    const response = await axiosInstance.get(`/api/v1/classes/${ClassId}`);
    return response.data;
}

// Add a new Class
export async function addClass(newClass: Class): Promise<ApiResonse<Class>> {
    const response = await axiosInstance.post(`/api/v1/classes`, newClass);
    return response.data;
}

// Delete a Class
export async function deleteClass(ClassId: number): Promise<ApiResonse<void>> {
    const response = await axiosInstance.delete(`/api/v1/classes/${ClassId}`);
    return response.data;
}

// Update a Class
export async function updateClass(ClassId: number, Class: Partial<Class>): Promise<ApiResonse<Class>> {
    console.log("in fe, Class:", Class);
    const response = await axiosInstance.put(`/api/v1/classes/${ClassId}`, Class);
    return response.data;
} 