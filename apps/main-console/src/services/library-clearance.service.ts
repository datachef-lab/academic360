import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryClearancePayload = {
  userId: number;
  outstandingCopies: Array<{
    circulationId: number;
    bookTitle: string | null;
    accessNumber: string | null;
    issueTimestamp: string;
    returnTimestamp: string;
  }>;
  fineBalance: number;
  isClear: boolean;
};

const BASE = "/api/library/clearance";

export async function getLibraryClearanceForUser(userId: number) {
  const res = await axiosInstance.get<ApiResponse<LibraryClearancePayload>>(`${BASE}/${userId}`);
  return res.data;
}
