import { ApiResonse } from "@/types/api-response";
import axiosInstance from "@/utils/api";
import { Course } from '@/types/academics/course';

// Get all courses
export async function getAllCourses(): Promise<ApiResonse<Course[]>> {
    const response = await axiosInstance.get(`/api/v1/courses`);
    return response.data;
}

// Get a single course
export async function getCourse(courseId: number): Promise<ApiResonse<Course>> {
    const response = await axiosInstance.get(`/api/v1/courses/${courseId}`);
    return response.data;
}

// Add a new course
export async function addCourse(newCourse: Course): Promise<ApiResonse<Course>> {
    const response = await axiosInstance.post(`/api/v1/courses`, newCourse);
    return response.data;
}

// Delete a course
export async function deleteCourse(courseId: number): Promise<ApiResonse<void>> {
    const response = await axiosInstance.delete(`/api/v1/courses/${courseId}`);
    return response.data;
}

// Update a course
export async function updateCourse(courseId: number, course: Partial<Course>): Promise<ApiResonse<Course>> {
    console.log("in fe, course:", course);
    const response = await axiosInstance.put(`/api/v1/courses/${courseId}`, course);
    return response.data;
} 