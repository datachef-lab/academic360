import { ingaxiosInstance as api } from "@/lib/utils";
import type { ApiResponse } from "@/types/api-response";
import type { CuRegistrationCorrectionRequestDto, CuRegistrationDocumentUploadDto } from "@repo/db/dtos/admissions";

export interface CreateCuCorrectionPayload {
  studentId: number;
  flags?: Record<string, boolean>;
  payload?: Record<string, any>;
  cuRegistrationApplicationNumber?: string;
  documents?: Array<{
    documentId: number;
    file: File;
    remarks?: string;
  }>;
}

const BASE = "/api/admissions/cu-registration-correction-requests";

export async function createCuCorrectionRequest(data: CreateCuCorrectionPayload) {
  console.info(`[CU-REG FRONTEND] Creating correction request:`, data);
  try {
    const res = await api.post<ApiResponse<CuRegistrationCorrectionRequestDto>>(BASE, data);
    console.info(`[CU-REG FRONTEND] Correction request created:`, res.data);
    return res.data.payload as CuRegistrationCorrectionRequestDto;
  } catch (error) {
    console.error(`[CU-REG FRONTEND] Error creating correction request:`, error);
    throw error;
  }
}

export async function getStudentCuCorrectionRequests(studentId: number) {
  console.info(`[CU-REG FRONTEND] Fetching correction requests for student: ${studentId}`);
  try {
    const res = await api.get<
      ApiResponse<CuRegistrationCorrectionRequestDto[] | { content: CuRegistrationCorrectionRequestDto[] }>
    >(BASE, {
      params: { studentId },
    });
    console.info(`[CU-REG FRONTEND] Correction requests response:`, res.data);
    const p = res.data.payload as any;
    const result = (Array.isArray(p) ? p : p?.content || p?.requests) as CuRegistrationCorrectionRequestDto[];
    console.info(`[CU-REG FRONTEND] Parsed correction requests:`, result);
    return result;
  } catch (error) {
    console.error(`[CU-REG FRONTEND] Error fetching correction requests:`, error);
    throw error;
  }
}

export async function getCuCorrectionRequestById(id: number) {
  console.info(`[CU-REG FRONTEND] Fetching correction request by ID: ${id}`);
  try {
    const res = await api.get<ApiResponse<CuRegistrationCorrectionRequestDto>>(`${BASE}/${id}`);
    console.info(`[CU-REG FRONTEND] Correction request response:`, res.data);
    return res.data.payload as CuRegistrationCorrectionRequestDto;
  } catch (error) {
    console.error(`[CU-REG FRONTEND] Error fetching correction request:`, error);
    throw error;
  }
}

export async function updateCuCorrectionRequest(id: number, data: Partial<CreateCuCorrectionPayload>) {
  const res = await api.put<ApiResponse<CuRegistrationCorrectionRequestDto>>(`${BASE}/${id}` as string, data);
  return res.data.payload as CuRegistrationCorrectionRequestDto;
}

// Get next CU registration application number from backend helper
export async function getNextCuRegistrationApplicationNumber() {
  const res = await api.get<ApiResponse<{ number: string } | string>>(`${BASE}/next-application-number` as string);
  const p: any = res.data.payload;
  return typeof p === "string" ? p : p?.number;
}

// Batch submit correction request with documents
export async function submitCuRegistrationCorrectionRequestWithDocuments(data: {
  correctionRequestId: number;
  flags: Record<string, boolean>;
  payload: Record<string, any>;
  documents: Array<{
    documentName: string;
    file: File;
    remarks?: string;
  }>;
}) {
  console.info(`[CU-REG FRONTEND] Starting batch submission:`, {
    correctionRequestId: data.correctionRequestId,
    flags: data.flags,
    documentCount: data.documents.length,
  });

  const formData = new FormData();
  formData.append("correctionRequestId", String(data.correctionRequestId));
  formData.append("flags", JSON.stringify(data.flags));
  formData.append("payload", JSON.stringify(data.payload));
  formData.append("documentNames", JSON.stringify(data.documents.map((d) => d.documentName)));

  // Add files to form data
  data.documents.forEach((doc, index) => {
    formData.append("documents", doc.file);
  });

  try {
    const res = await api.post<ApiResponse<CuRegistrationCorrectionRequestDto>>(
      "/api/admissions/cu-registration-correction-requests/submit-with-documents",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    console.info(`[CU-REG FRONTEND] Batch submission successful:`, res.data);
    return res.data.payload as CuRegistrationCorrectionRequestDto;
  } catch (error: any) {
    console.error(`[CU-REG FRONTEND] Batch submission failed:`, error.response?.data || error.message);
    throw error;
  }
}
