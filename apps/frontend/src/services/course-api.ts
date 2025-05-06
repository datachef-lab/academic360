import { ApiResonse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

export interface Course {
    id: number;
    name: string;
    streamId?: number;
    shortName?: string;
    codePrefix?: string;
    universityCode?: string;
    createdAt?: string;
    updatedAt?: string;
    stream?: {
        id: number;
        degreeProgramme: string;
        degree?: {
            id: number;
            name: string;
        };
    };
}

export interface NewCourse {
    name: string;
    streamId?: number;
    shortName?: string;
    codePrefix?: string;
    universityCode?: string;
}

// Get all courses
export async function getAllCourses(): Promise<ApiResonse<Course[]>> {
    const response = await axiosInstance.get(`/api/courses`);
    return response.data;
}

// Get a single course
export async function getCourse(courseId: number): Promise<ApiResonse<Course>> {
    const response = await axiosInstance.get(`/api/courses/${courseId}`);
    return response.data;
}

// Add a new course
export async function addCourse(newCourse: NewCourse): Promise<ApiResonse<Course>> {
    const response = await axiosInstance.post(`/api/courses`, newCourse);
    return response.data;
}

// Delete a course
export async function deleteCourse(courseId: number): Promise<ApiResonse<void>> {
    const response = await axiosInstance.delete(`/api/courses/${courseId}`);
    return response.data;
}

// Update a course
export async function updateCourse(courseId: number, course: Partial<NewCourse>): Promise<ApiResonse<Course>> {
    const response = await axiosInstance.put(`/api/courses/${courseId}`, course);
    return response.data;
} 