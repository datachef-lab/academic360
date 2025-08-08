import { Session } from "@/types/academics/session";
import { ApiResonse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

export async function findAllSessions(): Promise<ApiResonse<Session[]>> {
    const response = await axiosInstance.get<ApiResonse<Session[]>>('/api/sessions');
    return response.data;
}

export async function createSession(sessionData: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResonse<Session>> {
    const response = await axiosInstance.post<ApiResonse<Session>>('/api/sessions', sessionData);
    return response.data;
}

export async function updateSession(id: number, sessionData: Partial<Session>): Promise<ApiResonse<Session>> {
    const response = await axiosInstance.put<ApiResonse<Session>>(`/api/sessions/${id}`, sessionData);
    return response.data;
}

export async function deleteSession(id: number): Promise<ApiResonse<void>> {
    const response = await axiosInstance.delete<ApiResonse<void>>(`/api/sessions/${id}`);
    return response.data;
}