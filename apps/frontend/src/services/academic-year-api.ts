import axiosInstance from "@/utils/api";
import { AcademicYear } from "@/types/academics/academic-year";
import { ApiResonse } from "@/types/api-response";

// Get all academic years
export async function getAllAcademicYears(): Promise<ApiResonse<AcademicYear[]>> {
  const response = await axiosInstance.get(`/api/v1/academics/all`);
  return response.data;
}

// Get academic year by ID
export async function getAcademicYearById(id: number): Promise<ApiResonse<AcademicYear>> {
  const response = await axiosInstance.get(`/api/v1/academics/${id}`);
  return response.data;
}

// Create new academic year
export async function createAcademicYear(academicYear: Omit<AcademicYear, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResonse<AcademicYear>> {
  const response = await axiosInstance.post(`/api/v1/academics`, {academicYear});
  return response.data;
}

// Update academic year
export async function updateAcademicYearById(id: number, academicYear: Partial<AcademicYear>): Promise<ApiResonse<AcademicYear>> {
  const response = await axiosInstance.put(`/api/v1/academics/academic-years/${id}`, academicYear);
  return response.data;
}

// Delete academic year
export async function deleteAcademicYearById(id: number): Promise<ApiResonse<null>> {
  const response = await axiosInstance.delete(`/api/v1/academics/academic-years/${id}`);
  return response.data;
} 