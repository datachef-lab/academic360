import axiosInstance, { API_BASE_URL } from "@/lib/api";
import type { ApiResponse } from "@/lib/types";
import type { FeeStudentMappingDto } from "@repo/db/dtos/fees";

export type StudentFeeMapping = FeeStudentMappingDto & {
  paymentStatus?: string;
  amountPaid?: number;
  totalPayable?: number;
};

export type FeeChallanPayload = {
  url: string;
  challanNumber: string;
};

export type PaytmConfig = {
  mid: string;
  host: string;
};

export type InitiateFeePaymentPayload = {
  orderId: string;
  txnToken: string;
  userInfo?: {
    paymentId: number;
    feeStudentMappingId: number | null;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
};

export async function fetchStudentFeeMappings(
  studentId: number,
): Promise<ApiResponse<StudentFeeMapping[]>> {
  const response = await axiosInstance.get<ApiResponse<StudentFeeMapping[]>>(
    `/api/v1/fees/student-mappings/student/${studentId}`,
  );
  return response.data;
}

export async function ensureFeeChallan(
  studentId: number,
  feeStructureId: number,
): Promise<ApiResponse<FeeChallanPayload>> {
  const response = await axiosInstance.post<ApiResponse<FeeChallanPayload>>(
    "/api/v1/fees/receipts",
    { studentId, feeStructureId },
  );
  return response.data;
}

export async function fetchPaytmConfig(): Promise<ApiResponse<PaytmConfig>> {
  const response = await axiosInstance.get<ApiResponse<PaytmConfig>>("/api/payments/config");
  return response.data;
}

export async function initiateFeePayment(body: {
  feeStudentMappingId: number;
  amount: string;
  studentId: number;
  email?: string;
  mobile?: string;
  firstName?: string;
  lastName?: string;
  returnUrl: string;
}): Promise<ApiResponse<InitiateFeePaymentPayload>> {
  const response = await axiosInstance.post<ApiResponse<InitiateFeePaymentPayload>>(
    "/api/payments/initiate-fee",
    body,
  );
  return response.data;
}

export function resolveBackendAssetUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
