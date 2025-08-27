import axiosInstance from '@/utils/api';
import { ApiResonse } from '@/types/api-response';

export interface CourseLevel {
  readonly id?: number;
  name: string;
  shortName?: string | null;
  sequence?: number | null;
  disabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CourseLevelData = Omit<CourseLevel, "id" | "createdAt" | "updatedAt">;

export interface BulkUploadResult {
  success: CourseLevel[];
  errors: Array<{
    row: number;
    data: unknown;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

const BASE = '/api/v1/course-design/course-levels';

export const getAllCourseLevels = async (): Promise<CourseLevel[]> => {
  const res = await axiosInstance.get<ApiResonse<CourseLevel[]>>(BASE);
  return res.data.payload;
};

export const getCourseLevelById = async (id: number): Promise<CourseLevel> => {
  const res = await axiosInstance.get<CourseLevel>(`${BASE}/${id}`);
  return res.data;
};

export const createCourseLevel = async (data: CourseLevelData): Promise<CourseLevel> => {
  const res = await axiosInstance.post<CourseLevel>(BASE, data);
  return res.data;
};

export const updateCourseLevel = async (id: number, data: Partial<CourseLevelData>): Promise<CourseLevel> => {
  const res = await axiosInstance.put<CourseLevel>(`${BASE}/${id}`, data);
  return res.data;
};

export const deleteCourseLevel = async (id: number): Promise<{ success: boolean }> => {
  const res = await axiosInstance.delete<{ success: boolean }>(`${BASE}/${id}`);
  return res.data;
};

export const bulkUploadCourseLevels = async (file: File, onUploadProgress: (progress: number) => void): Promise<BulkUploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await axiosInstance.post<ApiResonse<BulkUploadResult>>(`${BASE}/bulk-upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      }
    },
  });
  return res.data.payload;
};
