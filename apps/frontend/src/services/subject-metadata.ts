import { SubjectMetadata } from "@/types/academics/subject-metadata";
import { ApiResonse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

interface FiltersProps {
    streamId: number;
    course: "HONOURS" | "GENERAL";
    semester: number;
    framework: "CCF" | "CBCS";
}

export interface Subject {
    id: number;
    name: string;
    irpCode: string;
    marksheetCode: string;
    credit: number;
    fullMarks: number;
    semester: number;
    isOptional: boolean;
    subjectType?: {
        id: number;
        marksheetName: string;
    };
    stream?: {
        id: number;
        degreeProgramme: string;
        degree?: {
            id: number;
            name: string;
        };
    };
}

export interface NewSubject {
    name: string;
    irpCode: string;
    marksheetCode: string;
    subjectTypeId: number;
    credit: number;
    fullMarks: number;
    semester: number;
    streamId: number;
    isOptional: boolean;
}

// Get all subjects
export async function getAllSubjects(): Promise<ApiResonse<Subject[]>> {
    const response = await axiosInstance.get(`/api/subject-metadatas`);
    return response.data;
}

// Get subjects by filters
export async function getSubjectMetadataByFilters(filters: FiltersProps): Promise<ApiResonse<SubjectMetadata[]>> {
    const response = await axiosInstance.post(`/api/subject-metadatas/filters`, filters);
    console.log(response.data);
    return response.data;
}

// Add a new subject
export async function addSubject(newSubject: NewSubject): Promise<ApiResonse<Subject>> {
    const response = await axiosInstance.post(`/api/subject-metadatas`, newSubject);
    return response.data;
}

// Delete a subject
export async function deleteSubject(subjectId: number): Promise<ApiResonse<void>> {
    const response = await axiosInstance.delete(`/api/subject-metadatas/${subjectId}`);
    return response.data;
}

// Update a subject
export async function updateSubject(subjectId: number, subject: Partial<NewSubject>): Promise<ApiResonse<Subject>> {
    const response = await axiosInstance.put(`/api/subject-metadatas/${subjectId}`, subject);
    return response.data;
}