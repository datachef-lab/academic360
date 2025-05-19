import axiosInstance from '@/utils/api';

export interface StudentStats {
  totalStudents: number;
  courseStats: {
    "BA": { count: number, years: Record<number, number> };
    "B.COM": { count: number, years: Record<number, number> };
    "B.SC": { count: number, years: Record<number, number> };
    "BBA": { count: number, years: Record<number, number> };
    "M.A": { count: number, years: Record<number, number> };
    "M.COM": { count: number, years: Record<number, number> };
  };
}

export interface SemesterStats {
  degrees: Array<{
    id: number;
    name: string;
    totalStudents: number;
    maxSemesters: number;
    semesters: Record<number, { count: number, year?: number }>;
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  payload: T;
}

export const getStudentStats = async (): Promise<StudentStats> => {
  try {
    const response = await axiosInstance.get<ApiResponse<StudentStats>>('/api/stats');
    return response.data.payload;
  } catch (error) {
    console.error('Error fetching student statistics:', error);
    throw error;
  }
}; 

export const getSemesterStats = async (): Promise<SemesterStats> => {
  try {
    const response = await axiosInstance.get<ApiResponse<SemesterStats>>('/api/stats/semesters');
    return response.data.payload;
  } catch (error) {
    console.error('Error fetching semester statistics:', error);
    throw error;
  }
}; 