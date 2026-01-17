import axiosInstance from "@/utils/api";
import type { ApiResponse } from "@/types/api-response";
import type { ExamDto } from "@repo/db/index";

export interface CountStudentsParams {
  classId: number;
  programCourseIds: number[];
  paperIds: number[];
  academicYearIds: number[];
  shiftIds?: number[];
  gender: "MALE" | "FEMALE" | "OTHER" | null;
}

export interface CountStudentsResponse {
  count: number;
}

export interface CountStudentsBreakdownParams {
  classId: number;
  paperIds: number[];
  academicYearIds: number[];
  combinations: Array<{ programCourseId: number; shiftId: number }>;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
}

export interface StudentCountBreakdownItem {
  programCourseId: number;
  shiftId: number;
  count: number;
}

export interface CountStudentsBreakdownResponse {
  breakdown: StudentCountBreakdownItem[];
  total: number;
}

// export async function countStudentsForExam(params: CountStudentsParams, file: File | null): Promise<ApiResponse<CountStudentsResponse>> {
//   try {
//     const response = await axiosInstance.post<ApiResponse<CountStudentsResponse>>(
//       "/api/exams/schedule/count-students",
//       params,
//     );
//     return response.data;
//   } catch (error) {
//     console.error("Error counting students for exam:", error);
//     throw error;
//   }
// }

export async function countStudentsForExam(
  params: CountStudentsParams,
  file: File | null,
): Promise<ApiResponse<CountStudentsResponse>> {
  const formData = new FormData();
  console.log("in ui, countStudentsForExam(), service api call:", params);

  formData.append("classId", String(params.classId));
  formData.append("gender", params.gender ?? "");

  params.programCourseIds.forEach((id) => formData.append("programCourseIds[]", String(id)));
  params.paperIds.forEach((id) => formData.append("paperIds[]", String(id)));
  params.academicYearIds.forEach((id) => formData.append("academicYearIds[]", String(id)));
  params.shiftIds?.forEach((id) => formData.append("shiftIds[]", String(id)));

  if (file) {
    formData.append("file", file); // 🔑 MUST be "file"
  }

  const response = await axiosInstance.post("/api/exams/schedule/count-students", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export async function countStudentsBreakdownForExam(
  params: CountStudentsBreakdownParams,
  file: File | null,
): Promise<ApiResponse<CountStudentsBreakdownResponse>> {
  console.log("in ui, countStudentsBreakdownForExam(), service api call:", params);

  // If no file, send as JSON for better parsing
  if (!file) {
    const response = await axiosInstance.post("/api/exams/schedule/count-students-breakdown", params, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  }

  // If file exists, use FormData
  const formData = new FormData();
  formData.append("classId", String(params.classId));
  formData.append("gender", params.gender ?? "");

  params.paperIds.forEach((id) => formData.append("paperIds[]", String(id)));
  params.academicYearIds.forEach((id) => formData.append("academicYearIds[]", String(id)));

  // Send combinations as JSON array string (FormData doesn't handle nested objects well)
  formData.append("combinations", JSON.stringify(params.combinations));
  formData.append("file", file);

  const response = await axiosInstance.post("/api/exams/schedule/count-students-breakdown", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export interface GetStudentsParams extends CountStudentsParams {
  assignBy: "UID" | "CU_ROLL_NUMBER";
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
  programCourseId: number | null;
  shiftId: number | null;
  registrationNumber: string | null;
  rollNumber: string | null;
}

export interface GetStudentsResponse {
  students: StudentWithSeat[];
}

// export async function getStudentsForExam(params: GetStudentsParams, file: File | null): Promise<ApiResponse<GetStudentsResponse>> {
//   try {
//     const response = await axiosInstance.post<ApiResponse<GetStudentsResponse>>(
//       "/api/exams/schedule/get-students",
//       params,
//     );
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching students for exam:", error);
//     throw error;
//   }
// }

export async function getStudentsForExam(
  params: GetStudentsParams,
  file: File | null,
): Promise<ApiResponse<GetStudentsResponse>> {
  const formData = new FormData();

  formData.append("classId", String(params.classId));
  formData.append("assignBy", params.assignBy);
  formData.append("gender", params.gender ?? "");

  params.programCourseIds.forEach((id) => formData.append("programCourseIds[]", String(id)));
  params.paperIds.forEach((id) => formData.append("paperIds[]", String(id)));
  params.academicYearIds.forEach((id) => formData.append("academicYearIds[]", String(id)));

  params.shiftIds?.forEach((id) => formData.append("shiftIds[]", String(id)));

  params.roomAssignments.forEach((room, i) => {
    Object.entries(room).forEach(([key, value]) => {
      formData.append(`roomAssignments[${i}][${key}]`, String(value ?? ""));
    });
  });

  if (file) {
    formData.append("file", file);
  }

  const response = await axiosInstance.post("/api/exams/schedule/get-students", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export interface CheckDuplicateExamResponse {
  isDuplicate: boolean;
  duplicateExamId?: number;
  message?: string;
}

export async function checkDuplicateExam(dto: ExamDto): Promise<ApiResponse<CheckDuplicateExamResponse>> {
  try {
    const response = await axiosInstance.post<ApiResponse<CheckDuplicateExamResponse>>(
      "/api/exams/schedule/check-duplicate",
      dto,
    );
    return response.data;
  } catch (error) {
    console.error("Error checking duplicate exam:", error);
    throw error;
  }
}

export interface GetEligibleRoomsParams {
  examSubjects: Array<{
    subjectId: number;
    startTime: string | Date;
    endTime: string | Date;
  }>;
}

export interface GetEligibleRoomsResponse {
  rooms: Array<{
    id?: number;
    name: string;
    shortName?: string | null;
    floorId?: number | null;
    numberOfBenches?: number | null;
    maxStudentsPerBench?: number | null;
    isActive?: boolean | null;
    floor?: {
      id?: number;
      name: string;
    } | null;
  }>;
}

export async function getEligibleRooms(params: GetEligibleRoomsParams): Promise<ApiResponse<GetEligibleRoomsResponse>> {
  try {
    const response = await axiosInstance.post<ApiResponse<GetEligibleRoomsResponse>>(
      "/api/exams/schedule/eligible-rooms",
      params,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching eligible rooms:", error);
    throw error;
  }
}
