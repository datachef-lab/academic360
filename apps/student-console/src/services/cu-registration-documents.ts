import { ingaxiosInstance as api } from "@/lib/utils";
import type { ApiResponse } from "@/types/api-response";
import type { CuRegistrationDocumentUploadDto } from "@repo/db/dtos/admissions";

const BASE = "/api/admissions/cu-registration-document-uploads";

export async function getCuRegistrationDocuments(cuRegistrationCorrectionRequestId: number) {
  console.info(`[CU-REG FRONTEND] Fetching documents for correction request: ${cuRegistrationCorrectionRequestId}`);
  try {
    const res = await api.get<ApiResponse<any[]>>(`${BASE}/request/${cuRegistrationCorrectionRequestId}`);
    console.info(`[CU-REG FRONTEND] Documents response:`, res.data);
    return res.data.payload as any[];
  } catch (error: any) {
    console.error(`[CU-REG FRONTEND] Error fetching documents:`, error);
    throw error;
  }
}

export async function uploadCuRegistrationDocument(args: {
  file: File;
  cuRegistrationCorrectionRequestId: number;
  documentId: number;
  remarks?: string;
}) {
  console.info(`[CU-REG FRONTEND] Starting upload:`, {
    fileName: args.file.name,
    fileSize: args.file.size,
    fileSizeMB: (args.file.size / 1024 / 1024).toFixed(2),
    fileType: args.file.type,
    cuRegistrationCorrectionRequestId: args.cuRegistrationCorrectionRequestId,
    documentId: args.documentId,
  });

  const form = new FormData();
  form.append("file", args.file);
  form.append("cuRegistrationCorrectionRequestId", String(args.cuRegistrationCorrectionRequestId));
  form.append("documentId", String(args.documentId));
  if (args.remarks) form.append("remarks", args.remarks);

  try {
    const res = await api.post<ApiResponse<CuRegistrationDocumentUploadDto>>(BASE, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.info(`[CU-REG FRONTEND] Upload successful:`, res.data);
    return res.data.payload as CuRegistrationDocumentUploadDto;
  } catch (error: any) {
    console.error(`[CU-REG FRONTEND] Upload failed:`, error.response?.data || error.message);
    throw error;
  }
}

export async function getCuRegistrationDocumentSignedUrl(id: number, opts?: { expiresIn?: number }) {
  try {
    const url = `${BASE}/${id}/signed-url${opts?.expiresIn ? `?expiresIn=${opts.expiresIn}` : ""}`;
    const res = await api.get<ApiResponse<{ signedUrl: string; documentUrl: string }>>(url);
    const payload: any = res.data.payload;
    return (payload?.signedUrl as string) || (payload?.documentUrl as string);
  } catch (error: any) {
    console.error(`[CU-REG FRONTEND] Error getting signed URL for document ${id}:`, error?.response?.data || error);
    throw error;
  }
}
