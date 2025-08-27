import axiosInstance from "@/utils/api";
import { ApiResonse } from "@/types/api-response";
import { Course } from "@/types/course-design";
import { Shift } from "@/types/academics/shift";
import { Section } from "@/types/academics/section";

export async function getAllCourses(): Promise<ApiResonse<Course[]>> {
    const response = await axiosInstance.get(`/api/v1/academics/streams`);
    return response.data;
}

export async function getAllShifts(): Promise<Shift[]> {
    const response = await axiosInstance.get(`/api/v1/shifts`);
    return response.data;
}

// Get all sections
export async function getAllSections(): Promise<Section[]> {
    const response = await axiosInstance.get(`/api/v1/sections`);
    // If the backend returns { payload: Section[] }, extract it
    if (response.data && response.data.payload) return response.data.payload;
    return response.data;
}