import { Marksheet, MarksheetLog } from "@/types/academics/marksheet";

import { ApiResonse } from "@/types/api-response";
// import { PaginatedResponse } from "@/types/pagination";
import axiosInstance from "@/utils/api";



export async function fetchMarksheetLogs(page: number = 1, pageSize: number = 10, searchText: string): Promise<ApiResonse<MarksheetLog[]>> {
    const response = await axiosInstance.get(`/api/marksheets/logs?page=${page}&pageSize=${pageSize}&searchText=${searchText}`);
    console.log(response.data);
    return response.data;
}

export async function uploadFile(body: FormData): Promise<ApiResonse<boolean> | void> {
    try {
        const response = await axiosInstance.post(`/api/marksheets/upload`, body, {
            responseType: "blob", // 👈 allow file or JSON response
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        const contentType = response.headers["content-type"];
        const disposition = response.headers["content-disposition"];

        if (
            contentType ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
            disposition?.includes("attachment")
        ) {
            const blob = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "exceptions.xlsx"; // optionally parse from disposition
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            return; // Don't return JSON, since file was downloaded
        }

        // If it's JSON, parse it
        const text = await response.data.text();
        return JSON.parse(text);
    } catch (err) {
        console.error("Upload error:", err);
        throw err;
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