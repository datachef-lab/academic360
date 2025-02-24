import { ApiResonse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

interface ScanMarksheetByProps {
    framework: "CCF" | "CBSE";
    stream: string;
    rollNumber: string;
    semester: number;
}

export async function getScanMarksheets(props: ScanMarksheetByProps): Promise<ApiResonse<{ year: number; filePath: string }[]>> {
    const response = await axiosInstance.post(`/api/documents/scan-marksheet`, props);
    return response.data;
}

export async function getFile(filePath: string): Promise<Buffer | null> {
    const response = await axiosInstance.post(`/api/documents/get`, { filePath }, {
        responseType: "arraybuffer",
        headers: {
            "Accept": "application/pdf",
        }
    });
    console.log("pfile", response.data);
    return response.data;
}