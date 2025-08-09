
import { ApiResonse } from "@/types/api-response";
import { ExamComponent } from "@/types/course-design";
import axiosInstance from "@/utils/api";


// Get all ExamComponent
export async function getAllExamComponent(): Promise<ApiResonse<ExamComponent[]>> {
    const response = await axiosInstance.get<ApiResonse<ExamComponent[]>>(`/api/course-design/exam-components`);
    return response.data;
}

// Get a single ExamComponent
export async function getExamComponent(ExamComponentId: number): Promise<ApiResonse<ExamComponent>> {
    const response = await axiosInstance.get(`/api/course-design/exam-components/${ExamComponentId}`);
    return response.data;
}

// Add a new ExamComponent
export async function addExamComponent(newExamComponent: ExamComponent): Promise<ApiResonse<ExamComponent>> {
    const response = await axiosInstance.post(`/api/course-design/exam-components`, newExamComponent);
    return response.data;
}

// Delete a ExamComponent
export async function deleteExamComponent(ExamComponentId: number): Promise<ApiResonse<void>> {
    const response = await axiosInstance.delete(`/api/course-design/exam-components/${ExamComponentId}`);
    return response.data;
}

// Update a ExamComponent
export async function updateExamComponent(ExamComponentId: number, ExamComponent: Partial<ExamComponent>): Promise<ApiResonse<ExamComponent>> {
    console.log("in fe, ExamComponent:", ExamComponent);
    const response = await axiosInstance.put(`/api/course-design/exam-components/${ExamComponentId}`, ExamComponent);
    return response.data;
} 