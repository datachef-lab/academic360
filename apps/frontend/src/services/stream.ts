import { Stream } from "@/types/academics/stream";
// import { ApiResonse } from "@/types/api-response";
import { academicIdentifier } from "@/types/user/academic-identifier";
import { Accommodation } from "@/types/user/accommodation";
import axiosInstance from "@/utils/api";

export async function getAllStreams(): Promise<Stream[]> {
    const response = await axiosInstance.get(`/api/streams`);
    return response.data.payload;
}
export const saveAcademicIdentifier = async (formData:academicIdentifier) => {
    const response = await axiosInstance.post(`/api/academicIdentifiers`,formData);
    return response.data;
};

export const saveAccommodation = async (formData:Accommodation) => {
    const response = await axiosInstance.post(`/api/Accommodation/`,formData);
    return response.data;
};
