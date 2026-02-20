import axiosInstance from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

const BASE = "/api/admissions/cu-registration-correction-requests";

export interface CuRegistrationCorrectionRequestDto {
  id?: number;
  studentId?: number;
  cuRegistrationApplicationNumber?: string | null;
  personalInfoDeclaration?: boolean;
  addressInfoDeclaration?: boolean;
  subjectsDeclaration?: boolean;
  documentsDeclaration?: boolean;
  onlineRegistrationDone?: boolean;
  physicalRegistrationDone?: boolean;
  [key: string]: unknown;
}

export interface CreateCuCorrectionPayload {
  studentId: number;
  flags?: Record<string, boolean>;
  payload?: Record<string, unknown>;
  cuRegistrationApplicationNumber?: string;
  documents?: Array<{
    documentId: number;
    file: unknown;
    remarks?: string;
  }>;
  introductoryDeclaration?: boolean;
  personalInfoDeclaration?: boolean;
  addressInfoDeclaration?: boolean;
  subjectsDeclaration?: boolean;
  documentsDeclaration?: boolean;
  onlineRegistrationDone?: boolean;
}

export async function getStudentCuCorrectionRequests(studentId: number): Promise<CuRegistrationCorrectionRequestDto[]> {
  const res = await axiosInstance.get<ApiResponse<CuRegistrationCorrectionRequestDto[]>>(
    `${BASE}/student/${studentId}`,
  );
  const p = res.data.payload;
  return Array.isArray(p) ? p : [];
}

export async function getCuCorrectionRequestById(id: number): Promise<CuRegistrationCorrectionRequestDto> {
  const res = await axiosInstance.get<ApiResponse<CuRegistrationCorrectionRequestDto>>(`${BASE}/${id}`);
  return res.data.payload as CuRegistrationCorrectionRequestDto;
}

export async function createCuCorrectionRequest(
  data: CreateCuCorrectionPayload,
): Promise<CuRegistrationCorrectionRequestDto> {
  const res = await axiosInstance.post<ApiResponse<CuRegistrationCorrectionRequestDto>>(BASE, data);
  return res.data.payload as CuRegistrationCorrectionRequestDto;
}

export async function updateCuCorrectionRequest(
  id: number,
  data: Partial<CreateCuCorrectionPayload>,
): Promise<CuRegistrationCorrectionRequestDto> {
  const res = await axiosInstance.put<ApiResponse<CuRegistrationCorrectionRequestDto>>(`${BASE}/${id}`, data);
  return res.data.payload as CuRegistrationCorrectionRequestDto;
}

export async function submitPersonalInfoDeclaration(data: {
  correctionRequestId: number;
  flags: Record<string, boolean>;
  personalInfo: Record<string, unknown>;
}) {
  const res = await axiosInstance.post<ApiResponse<{ correctionRequest: CuRegistrationCorrectionRequestDto }>>(
    `${BASE}/personal-declaration`,
    data,
  );
  return res.data.payload;
}

export async function submitAddressInfoDeclaration(data: {
  correctionRequestId: number;
  addressData: Record<string, unknown>;
}) {
  const res = await axiosInstance.post<ApiResponse<{ correctionRequest: CuRegistrationCorrectionRequestDto }>>(
    `${BASE}/address-declaration`,
    data,
  );
  return res.data.payload;
}

export async function submitSubjectsDeclaration(data: { correctionRequestId: number; flags: Record<string, boolean> }) {
  const res = await axiosInstance.post<ApiResponse<{ correctionRequest: CuRegistrationCorrectionRequestDto }>>(
    `${BASE}/subjects-declaration`,
    data,
  );
  return res.data.payload;
}

export async function submitDocumentsDeclaration(data: { correctionRequestId: number }) {
  const res = await axiosInstance.post<ApiResponse<{ correctionRequest: CuRegistrationCorrectionRequestDto }>>(
    `${BASE}/documents-declaration`,
    data,
  );
  return res.data.payload;
}
