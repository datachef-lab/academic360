import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type CdlAccessResult = {
  bookId: number;
  title: string;
  signedUrl: string;
  expiresInSeconds: number;
  concurrentLimit: number;
};

const BASE = "/api/library/cdl";

export async function requestCdlAccess(bookId: number) {
  const res = await axiosInstance.get<ApiResponse<CdlAccessResult>>(`${BASE}/${bookId}/access`);
  return res.data;
}
