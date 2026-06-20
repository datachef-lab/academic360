import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type CdlSessionPayload = {
  sessionId: number;
  bookId: number;
  title: string;
  signedUrl: string;
  expiresAt: string;
  expiresInSeconds: number;
  watermark: {
    userName: string;
    uid: string | null;
    timestamp: string;
  };
};

const BASE = "/api/library/cdl";

export async function startCdlSession(bookId: number) {
  const res = await axiosInstance.post<ApiResponse<CdlSessionPayload>>(
    `${BASE}/${bookId}/sessions`,
  );
  return res.data;
}

export async function closeCdlSession(sessionId: number) {
  const res = await axiosInstance.post<ApiResponse<null>>(`${BASE}/sessions/${sessionId}/close`);
  return res.data;
}

// Legacy alias preserved for any caller still using it.
export type CdlAccessResult = CdlSessionPayload;
export async function requestCdlAccess(bookId: number) {
  return startCdlSession(bookId);
}
