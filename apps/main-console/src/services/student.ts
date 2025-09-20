import { ApiResonse } from "@/types/api-response";
import { PaginatedResponse } from "@/types/pagination";
import { Student } from "@/types/user/student";
import axiosInstance from "@/utils/api";

type studentFilters = {
  page?: number;
  pageSize?: number;
  stream?: string;
  year?: string;
  semester?: number;
  framework?: string;
  export?: boolean;
};

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

export async function getSearchedStudents(
  page: number,
  pageSize: number,
  searchText: string,
): Promise<ApiResonse<PaginatedResponse<Student>>> {
  const response = await axiosInstance.get(
    `/api/students/search?page=${page}&pageSize=${pageSize}&searchText=${searchText}`,
  );
  console.log(response.data);
  return response.data;
}

export async function getSearchedStudentsByRollNumber(
  page: number,
  pageSize: number,
  searchText: string,
): Promise<ApiResonse<PaginatedResponse<Student>>> {
  const response = await axiosInstance.get(
    `/api/students/search-rollno?page=${page}&pageSize=${pageSize}&searchText=${searchText}`,
  );

  return response.data;
}

export const getFilteredStudents = async (filters: studentFilters = {}) => {
  const { export: isExport, ...rest } = filters;

  let query = Object.entries(rest)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join("&");

  if (isExport) {
    query += (query ? "&" : "") + "export=true";
  }

  const url = `/api/students/filtered${query ? "?" + query : ""}`;
  console.log("url", url);
  console.log("filters", filters);

  const response = await axiosInstance.get(url);

  // Ensure a valid return value

  console.log("response", response.data.data);
  return response.data.data;
};
