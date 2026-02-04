import axiosInstance from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

const BASE = "/api/admissions/cu-registration-document-uploads";

export interface DocumentUploadResult {
  id: number;
  documentId: number;
  [key: string]: unknown;
}

export async function getCuRegistrationDocuments(cuRegistrationCorrectionRequestId: number): Promise<unknown[]> {
  const res = await axiosInstance.get<ApiResponse<unknown[]>>(`${BASE}/request/${cuRegistrationCorrectionRequestId}`);
  return (res.data.payload as unknown[]) || [];
}

/** File for React Native: { uri: string; type?: string; name?: string } */
export async function uploadCuRegistrationDocument(args: {
  file: { uri: string; type?: string; name?: string };
  cuRegistrationCorrectionRequestId: number;
  documentId: number;
  remarks?: string;
}): Promise<DocumentUploadResult> {
  const formData = new FormData();
  formData.append("file", args.file as unknown);
  formData.append("cuRegistrationCorrectionRequestId", String(args.cuRegistrationCorrectionRequestId));
  formData.append("documentId", String(args.documentId));
  if (args.remarks) formData.append("remarks", args.remarks);

  const res = await axiosInstance.post<ApiResponse<DocumentUploadResult>>(BASE, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.payload as DocumentUploadResult;
}

export async function getCuRegistrationDocumentSignedUrl(id: number, opts?: { expiresIn?: number }): Promise<string> {
  const url = `${BASE}/${id}/signed-url${opts?.expiresIn ? `?expiresIn=${opts.expiresIn}` : ""}`;
  const res = await axiosInstance.get<ApiResponse<{ signedUrl?: string; documentUrl?: string }>>(url);
  const payload = res.data.payload as { signedUrl?: string; documentUrl?: string };
  return payload?.signedUrl || payload?.documentUrl || "";
}
