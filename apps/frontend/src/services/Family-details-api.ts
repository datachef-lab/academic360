import { ApiResonse } from "@/types/api-response";
import { Parent } from "@/types/user/parent";
import axiosInstance from "@/utils/api";

export async function findFamilyDetailsByStudentId(studentId: number): Promise<ApiResonse<Parent | null>> {
    const response = await axiosInstance.get(`/api/family/student/${studentId}`);
    return response.data;
}

export async function findFamilyDetailsById(id: number): Promise<ApiResonse<Parent | null>> {
    const response = await axiosInstance.get(`/api/family/${id}`);
    return response.data;
}

export async function createFamilyDetails(familyData: Partial<Parent>): Promise<ApiResonse<Parent>> {
    const response = await axiosInstance.post('/api/family', familyData);
    return response.data;
}

export async function updateFamilyDetails(id: number, familyData: Partial<Parent>): Promise<ApiResonse<Parent>> {
    const response = await axiosInstance.put(`/api/family/${id}`, familyData);
    return response.data;
}

export async function deleteFamilyDetails(id: number): Promise<ApiResonse<null>> {
    const response = await axiosInstance.delete(`/api/family/${id}`);
    return response.data;
}

export async function deleteFamilyDetailsByStudentId(studentId: number): Promise<ApiResonse<null>> {
    const response = await axiosInstance.delete(`/api/family/student/${studentId}`);
    return response.data;
}
