import { Marksheet, MarksheetLog } from "@/types/academics/marksheet";

import { ApiResonse } from "@/types/api-response";
// import { PaginatedResponse } from "@/types/pagination";
import axiosInstance from "@/utils/api";



export async function fetchMarksheetLogs(page: number = 1, pageSize: number = 10, searchText: string): Promise<ApiResonse<MarksheetLog[]>> {
    const response = await axiosInstance.get(`/api/marksheets/logs?page=${page}&pageSize=${pageSize}&searchText=${searchText}`);
    console.log(response.data);
    return response.data;
}

export async function uploadFile(body: FormData): Promise<void> {
    const response = await axiosInstance.post(`/api/marksheets/upload`, body, {
      responseType: 'blob', // critical for binary files
    });
  
    const contentDisposition = response.headers['content-disposition'];
    const contentType = response.headers['content-type'];
  
    if (
      contentDisposition?.includes('attachment') ||
      contentType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      // It's an Excel file — download it
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
  
      // Try to extract filename from Content-Disposition
      const match = contentDisposition?.match(/filename="?(.+)"?/);
      const filename = match?.[1] || "exceptions.xlsx";
  
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (contentType?.includes("application/json")) {
      // It's a normal JSON response
      const text = await response.data.text();
      const json = JSON.parse(text);
      console.log("Upload response:", json);
    } else {
      console.warn("Unhandled content type:", contentType);
    }
  }
  
  
  


export async function findMarksheetsByStudentId(studentId: number, semester?: number): Promise<ApiResonse<Marksheet>> {
    console.log(semester);
    const response = await axiosInstance.get(`/api/marksheets/query?studentId=${studentId}&semester=${semester}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
    console.log("response", response.data);
    return response.data;
}

export const updateMarksheetMarks = async (marksheetId: number, marksheetData: Marksheet) => {
    const response = await axiosInstance.put(`/api/marksheets/${marksheetId}`, marksheetData, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
    console.log("response", response.data);
    return response.data;
};