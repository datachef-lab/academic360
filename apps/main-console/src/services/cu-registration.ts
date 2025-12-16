import axiosInstance from "@/utils/api";
import type { CuRegistrationCorrectionRequestDto } from "@repo/db/dtos/admissions";

const BASE = "/api/admissions/cu-registration-correction-requests";

export async function getStudentCuCorrectionRequests(studentId: number) {
  console.info(`[CU-REG MAIN-CONSOLE] Fetching correction requests for student: ${studentId}`);
  try {
    const res = await axiosInstance.get<{
      success: boolean;
      payload: CuRegistrationCorrectionRequestDto[] | { content: CuRegistrationCorrectionRequestDto[] };
    }>(BASE, {
      params: { studentId },
    });
    console.info(`[CU-REG MAIN-CONSOLE] Correction requests response:`, res.data);
    const p = res.data.payload;
    const result = (Array.isArray(p) ? p : p?.content) as CuRegistrationCorrectionRequestDto[];
    console.info(`[CU-REG MAIN-CONSOLE] Parsed correction requests:`, result);
    return result;
  } catch (error) {
    console.error(`[CU-REG MAIN-CONSOLE] Error fetching correction requests:`, error);
    throw error;
  }
}

export async function getCuCorrectionRequestById(id: number) {
  console.info(`[CU-REG MAIN-CONSOLE] Fetching correction request by ID: ${id}`);
  try {
    const res = await axiosInstance.get<{
      success: boolean;
      payload: CuRegistrationCorrectionRequestDto;
    }>(`${BASE}/${id}`);
    console.info(`[CU-REG MAIN-CONSOLE] Correction request response:`, res.data);
    return res.data.payload;
  } catch (error) {
    console.error(`[CU-REG MAIN-CONSOLE] Error fetching correction request:`, error);
    throw error;
  }
}
