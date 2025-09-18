import { SubjectMetadata } from "@/types/academics/subject-metadata";
import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

interface FiltersProps {
  streamId: number;
  course: "HONOURS" | "GENERAL";
  semester: number;
  framework: "CCF" | "CBCS";
}

// Get all subjects
export async function getAllSubjects(): Promise<ApiResponse<SubjectMetadata[]>> {
  const response = await axiosInstance.get(`/api/subject-metadatas`);
  return response.data;
}

// Get subjects by filters
export async function getSubjectMetadataByFilters(filters: FiltersProps): Promise<ApiResponse<SubjectMetadata[]>> {
  const response = await axiosInstance.post(`/api/subject-metadatas/filters`, filters);
  console.log(response.data);
  return response.data;
}

// Add a new subject
export async function addSubject(newSubject: SubjectMetadata): Promise<ApiResponse<SubjectMetadata>> {
  const response = await axiosInstance.post(`/api/subject-metadatas`, newSubject);
  return response.data;
}

// Delete a subject
export async function deleteSubject(subjectId: number): Promise<ApiResponse<void>> {
  const response = await axiosInstance.delete(`/api/subject-metadatas/${subjectId}`);
  return response.data;
}

// Update a subject
export async function updateSubject(
  subjectId: number,
  subject: Partial<SubjectMetadata>,
): Promise<ApiResponse<SubjectMetadata>> {
  const response = await axiosInstance.put(`/api/subject-metadatas/${subjectId}`, subject);
  return response.data;
}
