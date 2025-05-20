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

// New interfaces for enrollment data
export interface StreamEnrollment {
  streamId: number;
  degreeName: string;
  degreeProgramme: string;
  framework: string;
  studentCount: number;
}

export interface YearlyEnrollment {
  year: number;
  studentCount: number;
}

export interface StreamYearlyEnrollment {
  streamId: number;
  degreeName: string;
  yearlyData: {
    [year: string]: number;
  };
}

export interface EnrollmentStats {
  streamEnrollment: StreamEnrollment[];
  yearlyEnrollment: YearlyEnrollment[];
  streamYearlyEnrollment: StreamYearlyEnrollment[];
}

// Interfaces for passing percentage statistics
export interface YearlyPassingData {
  year: number;
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  passingPercentage: number;
}

export interface StreamPassingData {
  streamId: number;
  streamName: string;
  degreeName: string;
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  passingPercentage: number;
}

export interface PassingPercentageStats {
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  passingPercentage: number;
  yearWiseData: YearlyPassingData[];
  streamWiseData: StreamPassingData[];
  sgpaThreshold: number;
  sgpaStats: {
    minSgpa: string;
    maxSgpa: string;
    avgSgpa: string;
    nonNullCount: number;
  };
  metricUsed: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  payload: T;
}

// New response type for the enrollment endpoint
interface EnrollmentApiResponse {
  httpStatusCode: number;
  httpStatus: string;
  message: string;
  payload: EnrollmentStats;
}

// Response type for passing percentage endpoint
interface PassingPercentageApiResponse {
  httpStatusCode: number;
  httpStatus: string;
  message: string;
  payload: PassingPercentageStats;
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

// New function to get enrollment analytics data
export const getEnrollmentStats = async (): Promise<EnrollmentStats> => {
  try {
    const response = await axiosInstance.get<EnrollmentApiResponse>('/api/stats/enrollment');
    return response.data.payload;
  } catch (error) {
    console.error('Error fetching enrollment statistics:', error);
    throw error;
  }
}; 

// New function to get passing percentage statistics
export const getPassingPercentageStats = async (): Promise<PassingPercentageStats> => {
  try {
    const response = await axiosInstance.get<PassingPercentageApiResponse>('/api/stats/passing-percentage');
    return response.data.payload;
  } catch (error) {
    console.error('Error fetching passing percentage statistics:', error);
    throw error;
  }
}; 