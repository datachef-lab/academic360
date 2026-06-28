import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";
import type { AcademicYear } from "@repo/db/schemas";

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

// ---- New academic year: copy-forward preview + create-with-copy ----

export type AcademicYearCopyPreview = {
  sourceYear: { id: number; year: string } | null;
  nextYear: string;
  counts: { metas: number; relatedSubjects: number; restrictedGroupings: number; papers: number };
  metas: Array<{
    id: number;
    label: string;
    subjectType: string | null;
    sequence: number | null;
    classes: string[];
    streams: string[];
  }>;
  relatedSubjects: Array<{
    id: number;
    programCourse: string | null;
    subjectType: string | null;
    boardSubjectName: string | null;
    related: string[];
  }>;
  restrictedGroupings: Array<{
    id: number;
    subjectType: string | null;
    subject: string | null;
    classes: string[];
    programCourses: string[];
    cannotCombineWith: string[];
  }>;
  papers: {
    total: number;
    rows: Array<{
      id: number;
      name: string;
      code: string;
      programCourse: string | null;
      className: string | null;
      subjectType: string | null;
      subject: string | null;
      isOptional: boolean | null;
    }>;
  };
};

export type AcademicYearCopyResult = {
  academicYear: AcademicYear;
  sourceYearId: number | null;
  copied: { metas: number; relatedSubjects: number; restrictedGroupings: number; papers: number };
};

// Preview what a new academic year will clone from the current active year
export async function getAcademicYearCopyPreview(): Promise<ApiResponse<AcademicYearCopyPreview>> {
  const response = await axiosInstance.get(`/api/v1/academics/copy-preview`);
  return response.data;
}

// Create a new academic year and clone the four year-scoped masters forward
export async function createAcademicYearWithCopy(payload: {
  year: string;
  makeActive: boolean;
  sessionFrom?: string | null;
  sessionTo?: string | null;
}): Promise<ApiResponse<AcademicYearCopyResult>> {
  const response = await axiosInstance.post(`/api/v1/academics/with-copy`, payload);
  return response.data;
}
