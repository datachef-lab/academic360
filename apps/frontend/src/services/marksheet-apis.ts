import { Marksheet, MarksheetLog } from "@/types/academics/marksheet";

import { ApiResonse } from "@/types/api-response";
// import { PaginatedResponse } from "@/types/pagination";
import axiosInstance from "@/utils/api";



export async function fetchMarksheetLogs(page: number = 1, pageSize: number = 10, searchText: string): Promise<ApiResonse<MarksheetLog[]>> {
    const response = await axiosInstance.get(`/api/marksheets/logs?page=${page}&pageSize=${pageSize}&searchText=${searchText}`);
    console.log(response.data);
    return response.data;
}

export async function uploadFile(body: FormData): Promise<ApiResonse<boolean>> {
    const response = await axiosInstance.post(`/api/marksheets/upload`, body);
    console.log(response.data);
    return response.data;
}

export async function findMarksheetsByStudentId(studentId: number,semester:number): Promise<ApiResonse<Marksheet>> {
    console.log(semester);
    const response = await axiosInstance.get(`/api/marksheets/query?studentId=${studentId}&semester=${semester}`);
    console.log("response",response.data);
    return response.data;
}