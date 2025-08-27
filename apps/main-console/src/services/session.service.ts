import { Session } from "@/types/academics/session";
import { ApiResonse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

export async function findAllSessions(): Promise<ApiResonse<Session[]>> {
    const response = await axiosInstance.get<ApiResonse<Session[]>>('/api/sessions');
    return response.data;
}