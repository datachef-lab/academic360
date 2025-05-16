import { ApiResonse } from "@/types/api-response";
import { PersonalDetails } from "@/types/user/personal-details";
import axiosInstance from "@/utils/api";

export async function findPersonalDetailsByStudentId(student: number): Promise<ApiResonse<PersonalDetails | null>> {
    const response = await axiosInstance.get(`/api/personal-details/student/${student}`);
    return response.data;
}

export async function addPersonalDetails(personalDetails: PersonalDetails): Promise<ApiResonse<PersonalDetails | null>> {
    const response = await axiosInstance.post(`/api/personal-details/`, personalDetails);
    return response.data;
}

export async function updatePersonalDetails(id: number, personalDetails: Partial<PersonalDetails>): Promise<ApiResonse<PersonalDetails | null>> {
    const response = await axiosInstance.put(`/api/personal-details/${id}`, personalDetails);
    return response.data;
}

export async function deletePersonalDetails(id: number): Promise<ApiResonse<null>> {
    const response = await axiosInstance.delete(`/api/personal-details/${id}`);
    return response.data;
}

export async function deletePersonalDetailsByStudentId(studentId: number): Promise<ApiResonse<null>> {
    const response = await axiosInstance.delete(`/api/personal-details/student/${studentId}`);
    return response.data;
}