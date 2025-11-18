import axiosInstance from "@/utils/api";
import type { ApiResponse } from "@/types/api-response";

export interface CountStudentsParams {
  classId: number;
  programCourseIds: number[];
  paperIds: number[];
  academicYearIds: number[];
  shiftIds?: number[];
}

export interface CountStudentsResponse {
  count: number;
}

export async function countStudentsForExam(params: CountStudentsParams): Promise<ApiResponse<CountStudentsResponse>> {
  try {
    const response = await axiosInstance.post<ApiResponse<CountStudentsResponse>>(
      "/api/exams/schedule/count-students",
      params,
    );
    return response.data;
  } catch (error) {
    console.error("Error counting students for exam:", error);
    throw error;
  }
}

export interface GetStudentsParams extends CountStudentsParams {
  assignBy: "UID" | "CU Reg. No.";
  roomAssignments: Array<{
    roomId: number;
    floorId: number | null;
    floorName: string | null;
    roomName: string;
    maxStudentsPerBench: number;
    numberOfBenches: number;
  }>;
}

export interface StudentWithSeat {
  studentId: number;
  uid: string;
  name: string;
  email: string;
  whatsappPhone: string;
  cuRegistrationApplicationNumber: string | null;
  floorName: string | null;
  roomName: string;
  seatNumber: string;
}

export interface GetStudentsResponse {
  students: StudentWithSeat[];
}

export async function getStudentsForExam(params: GetStudentsParams): Promise<ApiResponse<GetStudentsResponse>> {
  try {
    const response = await axiosInstance.post<ApiResponse<GetStudentsResponse>>(
      "/api/exams/schedule/get-students",
      params,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching students for exam:", error);
    throw error;
  }
}
