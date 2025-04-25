import { ApiResonse } from "@/types/api-response";
import { PersonalDetails } from "@/types/user/personal-details";
import axiosInstance from "@/utils/api";

export async function findPersonalDetailsByStudentId(studentId: number): Promise<ApiResonse<PersonalDetails | null>> {
    const response = await axiosInstance.get(`/api/personal-details/query?studentId=${studentId}`);
    return response.data;
}

export async function addPersonalDetails(personalDetails: PersonalDetails): Promise<ApiResonse<PersonalDetails | null>> {
    const response = await axiosInstance.post(`/api/personal-details/`, personalDetails);
    return response.data;
}