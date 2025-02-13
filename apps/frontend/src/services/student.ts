import { ApiResonse } from "@/types/api-response";
import { PaginatedResponse } from "@/types/pagination";
import { Student } from "@/types/user/student";
import axiosInstance from "@/utils/api";

export async function getAllStudents(page: number, pageSize: number): Promise<ApiResonse<PaginatedResponse<Student>>> {
    const response = await axiosInstance.get(`/api/students/query?page=${page}&pageSize=${pageSize}`);
    return response.data;
}

export async function getStudentById(id: number): Promise<ApiResonse<Student>> {
    const response = await axiosInstance.get(`/api/students/query?id=${id}`);
    return response.data;
}

export async function getSearchedStudents(page: number, pageSize: number, searchText: string): Promise<ApiResonse<PaginatedResponse<Student>>> {
    const response = await axiosInstance.get(`/api/students/search?page=${page}&pageSize=${pageSize}&searchText=${searchText}`);
    return response.data;
}