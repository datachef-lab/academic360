import axiosInstance from "@/utils/api";

const BASE = "/api/admissions/cu-registration-document-uploads";

export async function getCuRegistrationDocuments(correctionRequestId: number) {
  console.info(`[CU-REG MAIN-CONSOLE] Fetching documents for correction request: ${correctionRequestId}`);
  try {
    const res = await axiosInstance.get<{
      success: boolean;
      payload: { documents: any[]; total: number; totalPages: number };
    }>(BASE, {
      params: { requestId: correctionRequestId, limit: 100 },
    });
    console.info(`[CU-REG MAIN-CONSOLE] Documents response:`, res.data);
    return res.data.payload?.documents || [];
  } catch (error) {
    console.error(`[CU-REG MAIN-CONSOLE] Error fetching documents:`, error);
    return [];
  }
}

export async function getCuRegistrationDocumentSignedUrl(documentId: number): Promise<string> {
  console.info(`[CU-REG MAIN-CONSOLE] Fetching signed URL for document: ${documentId}`);
  try {
    const res = await axiosInstance.get<{
      success: boolean;
      payload: { url: string } | string;
    }>(`${BASE}/${documentId}/signed-url`);
    const payload = res.data.payload;
    const url = typeof payload === "string" ? payload : payload?.url;
    console.info(`[CU-REG MAIN-CONSOLE] Signed URL:`, url);
    return url;
  } catch (error) {
    console.error(`[CU-REG MAIN-CONSOLE] Error fetching signed URL:`, error);
    throw error;
  }
}
