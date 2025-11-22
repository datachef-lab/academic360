import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";
import { AcademicYear } from "@repo/db";

// Get all academic years
export async function getAllAcademicYears(): Promise<ApiResponse<AcademicYear[]>> {
  const response = await axiosInstance.get(`/api/v1/academics/all`);
  return response.data;
}

// Get academic year by ID
export async function getAcademicYearById(id: number): Promise<ApiResponse<AcademicYear>> {
  const response = await axiosInstance.get(`/api/v1/academics/${id}`);
  return response.data;
}

// Fetch academic setup stats for a given academic year
// export const fetchAcademicSetupStats = async (academicYearId: number,): Promise<ApiResponse<unknown>> => {
//   const response = await axiosInstance.get(`/api/v1/course-design/academic-setup/stats`, {
//     params: { academicYearId },
//   });
//   return response.data;
// };
export const getAcademicStats = async (academicYearId: number): Promise<ApiResponse<unknown>> => {
  const res = await axiosInstance.get(`/api/v1/course-design/academic-setup/stats?academicYearId=${academicYearId}`);
  console.log("stats data", res.data);
  return res.data;
};

// Create new academic year
export async function createAcademicYear(
  academicYear: Omit<AcademicYear, "id" | "createdAt" | "updatedAt">,
): Promise<ApiResponse<AcademicYear>> {
  const response = await axiosInstance.post(`/api/v1/academics`, { academicYear });
  return response.data;
}

// Update academic year
export async function updateAcademicYearById(
  id: number,
  academicYear: Partial<AcademicYear>,
): Promise<ApiResponse<AcademicYear>> {
  const response = await axiosInstance.put(`/api/v1/academics/${id}`, academicYear);
  return response.data;
}

// Delete academic year
export async function deleteAcademicYearById(id: number): Promise<ApiResponse<null>> {
  const response = await axiosInstance.delete(`/api/v1/academics/academic-years/${id}`);
  return response.data;
}
