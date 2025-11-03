import axiosInstance from "@/utils/api";
import { AxiosError } from "axios";

const BASE = "/api/admissions/cu-registration-document-uploads";
const PDF_BASE = "/api/admissions/cu-registration-pdf";

export async function getCuRegistrationDocuments(correctionRequestId: number) {
  console.info(`[CU-REG MAIN-CONSOLE] Fetching documents for correction request: ${correctionRequestId}`);
  try {
    const res = await axiosInstance.get<{
      httpStatusCode: number;
      payload: Array<Record<string, unknown>>;
      httpStatus: string;
      message: string;
    }>(`${BASE}/request/${correctionRequestId}`, {
      params: { limit: 100 },
    });
    console.info(`[CU-REG MAIN-CONSOLE] Documents response:`, res.data);
    console.info(`[CU-REG MAIN-CONSOLE] Documents found: ${res.data.payload?.length || 0}`);
    return res.data.payload || [];
  } catch (error) {
    console.error(`[CU-REG MAIN-CONSOLE] Error fetching documents:`, error);
    return [];
  }
}

export async function getCuRegistrationDocumentsByStudentUid(studentUid: string) {
  console.info(`[CU-REG MAIN-CONSOLE] Fetching documents for student UID: ${studentUid}`);
  console.info(`[CU-REG MAIN-CONSOLE] API URL: ${BASE}/student/${studentUid}/files`);
  try {
    const res = await axiosInstance.get<{
      httpStatusCode: number;
      payload: {
        studentUid: string;
        documentType: string;
        files: Array<Record<string, unknown>>;
        count: number;
      };
      httpStatus: string;
      message: string;
    }>(`${BASE}/student/${studentUid}/files`, {
      params: { documentType: "all" },
    });
    console.info(`[CU-REG MAIN-CONSOLE] Student documents response:`, res.data);
    console.info(`[CU-REG MAIN-CONSOLE] Files from response:`, res.data.payload?.files);
    console.info(`[CU-REG MAIN-CONSOLE] Files count:`, res.data.payload?.files?.length || 0);
    return res.data.payload?.files || [];
  } catch (error) {
    console.error(`[CU-REG MAIN-CONSOLE] Error fetching student documents:`, error);
    console.error(`[CU-REG MAIN-CONSOLE] Error details:`, error);
    return [];
  }
}

// Test function to fetch all documents without filters
export async function getAllStudentDocuments(studentUid: string) {
  console.info(`[CU-REG MAIN-CONSOLE] Fetching ALL documents for student UID: ${studentUid}`);
  try {
    const res = await axiosInstance.get<{
      httpStatusCode: number;
      payload: {
        studentUid: string;
        documentType: string;
        files: Array<Record<string, unknown>>;
        count: number;
      };
      httpStatus: string;
      message: string;
    }>(`${BASE}/student/${studentUid}/files`);
    console.info(`[CU-REG MAIN-CONSOLE] All documents response:`, res.data);
    return res.data.payload?.files || [];
  } catch (error) {
    console.error(`[CU-REG MAIN-CONSOLE] Error fetching all documents:`, error);
    return [];
  }
}

export async function getCuRegistrationDocumentSignedUrl(documentId: number): Promise<string> {
  console.info(`[CU-REG MAIN-CONSOLE] Fetching signed URL for document: ${documentId}`);
  try {
    const res = await axiosInstance.get<{
      httpStatusCode: number;
      payload: Record<string, unknown>;
      httpStatus: string;
      message: string;
    }>(`${BASE}/${documentId}/signed-url`);

    console.info(`[CU-REG MAIN-CONSOLE] Full API response:`, res.data);

    const payload = res.data.payload;
    let url: string | undefined;

    // Handle different response structures
    if (typeof payload === "string") {
      url = payload;
    } else if (payload && typeof payload === "object") {
      // The backend returns { signedUrl, expiresIn, documentUrl, fileName }
      url =
        (payload.signedUrl as string) ||
        (payload.url as string) ||
        (payload.documentUrl as string) ||
        (payload.downloadUrl as string);

      // If no signedUrl, try to construct from documentUrl
      if (!url && payload.documentUrl) {
        url = payload.documentUrl as string;
      }
    }

    console.info(`[CU-REG MAIN-CONSOLE] Extracted URL:`, url);

    if (!url || url === "undefined" || url === "null") {
      console.error(`[CU-REG MAIN-CONSOLE] Invalid URL extracted from response:`, {
        documentId,
        payload,
        extractedUrl: url,
        response: res.data,
      });
      throw new Error(`No valid URL found in response for document ${documentId}. Payload: ${JSON.stringify(payload)}`);
    }

    return url;
  } catch (error) {
    console.error(`[CU-REG MAIN-CONSOLE] Error fetching signed URL:`, error);
    throw error;
  }
}

/**
 * Upload a document for CU registration (EXACT COPY of student console API)
 */
export async function uploadCuRegistrationDocument(args: {
  file: File;
  cuRegistrationCorrectionRequestId: number;
  documentId: number;
  remarks?: string;
}) {
  console.info(`[CU-REG MAIN-CONSOLE] Starting upload:`, {
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
    const res = await axiosInstance.post<{
      httpStatusCode: number;
      payload: Record<string, unknown>;
      httpStatus: string;
      message: string;
    }>(BASE, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.info(`[CU-REG MAIN-CONSOLE] Upload successful:`, res.data);
    return res.data.payload;
  } catch (error) {
    console.error(
      `[CU-REG MAIN-CONSOLE] Upload failed:`,
      (error as AxiosError<{ message: string }>)?.response?.data?.message || (error as Error).message,
    );
    throw error;
  }
}

/**
 * Get CU Registration PDF URL by correction request ID
 */
export async function getCuRegistrationPdfUrlByRequestId(correctionRequestId: number) {
  console.info(`[CU-REG MAIN-CONSOLE] Fetching PDF URL for correction request: ${correctionRequestId}`);
  try {
    const res = await axiosInstance.get<{
      httpStatusCode: number;
      payload: {
        pdfUrl: string;
        pdfPath: string;
        applicationNumber: string;
        studentUid: string;
        year: number;
        regulation: string;
      };
      httpStatus: string;
      message: string;
    }>(`${PDF_BASE}/url/request/${correctionRequestId}`);

    console.info(`[CU-REG MAIN-CONSOLE] PDF URL response:`, res.data);
    return res.data.payload.pdfUrl;
  } catch (error) {
    console.error(`[CU-REG MAIN-CONSOLE] Error fetching PDF URL:`, error);
    throw error;
  }
}
