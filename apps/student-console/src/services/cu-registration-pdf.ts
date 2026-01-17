import { axiosInstance as api } from "@/lib/utils";
import type { ApiResponse } from "@/types/api-response";

const BASE = "/api/admissions/cu-registration-pdf";

export interface CuRegistrationPdfResponse {
  pdfUrl: string;
  pdfPath: string;
  applicationNumber: string;
  studentUid: string;
  year: number;
  regulation: string;
}

/**
 * Get the CU Registration PDF URL for a student
 * @param studentId - Student ID
 * @param applicationNumber - CU Registration Application Number
 * @returns PDF URL and metadata
 */
export async function getCuRegistrationPdfUrl(
  studentId: number,
  applicationNumber: string,
): Promise<CuRegistrationPdfResponse> {
  console.info(`[CU-REG PDF] Fetching PDF URL for student: ${studentId}, application: ${applicationNumber}`);

  try {
    const res = await api.get<ApiResponse<CuRegistrationPdfResponse>>(`${BASE}/url/${studentId}/${applicationNumber}`);

    console.info(`[CU-REG PDF] PDF URL response:`, res.data);
    return res.data.payload as CuRegistrationPdfResponse;
  } catch (error: any) {
    console.error(`[CU-REG PDF] Error fetching PDF URL:`, error);
    throw error;
  }
}

/**
 * Get the CU Registration PDF URL for a correction request
 * @param correctionRequestId - Correction Request ID
 * @returns PDF URL and metadata
 */
export async function getCuRegistrationPdfUrlByRequestId(
  correctionRequestId: number,
): Promise<CuRegistrationPdfResponse> {
  console.info(`[CU-REG PDF] Fetching PDF URL for correction request: ${correctionRequestId}`);

  try {
    const res = await api.get<ApiResponse<CuRegistrationPdfResponse>>(`${BASE}/url/request/${correctionRequestId}`);

    console.info(`[CU-REG PDF] PDF URL response:`, res.data);
    return res.data.payload as CuRegistrationPdfResponse;
  } catch (error: any) {
    console.error(`[CU-REG PDF] Error fetching PDF URL:`, error);
    throw error;
  }
}
