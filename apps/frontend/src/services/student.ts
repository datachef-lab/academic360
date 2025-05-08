import { ApiResonse } from "@/types/api-response";
import { PaginatedResponse } from "@/types/pagination";
import { Student } from "@/types/user/student";
import axiosInstance from "@/utils/api";

export async function getAllStudents(page: number, pageSize: number): Promise<ApiResonse<PaginatedResponse<Student>>> {
    const response = await axiosInstance.get(`/api/students/query?page=${page}&pageSize=${pageSize}`);
    console.log(response.data);
    return response.data;
}

export async function getStudentById(id: number): Promise<ApiResonse<Student>> {
    const response = await axiosInstance.get(`/api/students/query?id=${id}`);
    console.log(response.data);
    return response.data;
}

export async function getSearchedStudents(page: number, pageSize: number, searchText: string): Promise<ApiResonse<PaginatedResponse<Student>>> {
    const response = await axiosInstance.get(`/api/students/search?page=${page}&pageSize=${pageSize}&searchText=${searchText}`);
    console.log(response.data);
    return response.data;
}

export async function getSearchedStudentsByRollNumber(page: number, pageSize: number, searchText: string): Promise<ApiResonse<PaginatedResponse<Student>>> {
    const response = await axiosInstance.get(`/api/students/search-rollno?page=${page}&pageSize=${pageSize}&searchText=${searchText}`);
    console.log(response.data);
    return response.data;
}

export async function getFilteredStudents({
    page = 1,
    pageSize = 10,
    stream,
    year,
    semester,
    framework,
    isExporting = false
}: {
    page?: number;
    pageSize?: number;
    stream?: string;
    year?: number;
    semester?: number;
    framework?: "CCF" | "CBCS";
    isExporting?: boolean;
}): Promise<ApiResonse<PaginatedResponse<Student>>> {
    const params = new URLSearchParams();
    if (!isExporting) {
        if (page) params.append('page', page.toString());
        if (pageSize) params.append('pageSize', pageSize.toString());
    }
    if (stream) params.append('stream', stream);
    if (year) params.append('year', year.toString());
    if (semester) params.append('semester', semester.toString());
    if (framework) params.append('framework', framework);
    if (isExporting) params.append('isExporting', 'true');

    const response = await axiosInstance.get(`/api/students/filtered?${params.toString()}`);
    return response.data;
}