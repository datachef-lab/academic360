import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

const PAYMENTS_BASE = "/api/payments";

export interface PaymentConfigResponse {
  mid: string;
  host: string;
}

export async function getPaymentConfig(): Promise<ApiResponse<PaymentConfigResponse>> {
  const response = await axiosInstance.get(`${PAYMENTS_BASE}/config`);
  return response.data;
}

export interface InitiateFeePaymentRequest {
  feeStudentMappingId: number;
  amount: string | number;
  studentId: number;
  email?: string;
  mobile?: string;
  firstName?: string;
  lastName?: string;
}

export interface InitiateFeePaymentResponse {
  orderId: string;
  txnToken: string;
  paymentId?: number;
}

export async function initiateFeePayment(
  data: InitiateFeePaymentRequest,
): Promise<ApiResponse<InitiateFeePaymentResponse>> {
  const response = await axiosInstance.post(`${PAYMENTS_BASE}/initiate-fee`, data);
  return response.data;
}

export interface PaymentStatusResponse {
  orderId: string;
  txnId?: string;
  status: "TXN_SUCCESS" | "TXN_FAILURE" | "PENDING";
  amount?: string;
}

export async function getPaymentStatus(
  orderId: string,
): Promise<ApiResponse<PaymentStatusResponse>> {
  const response = await axiosInstance.get(`${PAYMENTS_BASE}/status/${orderId}`);
  return response.data;
}

/** Confirm payment from client-side transaction data (e.g. from Paytm transactionStatus callback) */
export async function confirmPaymentFromClient(
  transactionData: Record<string, string | undefined>,
): Promise<ApiResponse<{ orderId: string; status: string }>> {
  const response = await axiosInstance.post(`${PAYMENTS_BASE}/confirm`, transactionData);
  return response.data;
}

export type FeePaymentMarkingLoadedRecord = {
  mapping: any;
  student: { id: number; uid: string; userId: number | null };
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    fatherName: string | null;
  };
  paymentEntry: {
    id: number;
    status: string;
    amount: number;
    paymentMode: string | null;
    paymentGatewayVendor: string | null;
    isManualEntry: boolean;
    remarks: string | null;
    txnId: string | null;
    txnDate: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    recordedBy: { id: number; name: string; image: string | null } | null;
  } | null;
};

export async function loadFeePaymentMarkingCash(
  receiptNumber: string,
): Promise<ApiResponse<FeePaymentMarkingLoadedRecord>> {
  const response = await axiosInstance.get(`${PAYMENTS_BASE}/marking/cash`, {
    params: { receiptNumber },
  });
  return response.data;
}

export async function receiveFeePaymentCash(data: {
  receiptNumber: string;
  receiptDateIso: string;
  remarks?: string;
}): Promise<ApiResponse<FeePaymentMarkingLoadedRecord>> {
  const response = await axiosInstance.post(`${PAYMENTS_BASE}/marking/cash/receive`, data);
  return response.data;
}

export async function loadFeePaymentMarkingOnline(
  orderId: string,
): Promise<ApiResponse<FeePaymentMarkingLoadedRecord>> {
  const response = await axiosInstance.get(`${PAYMENTS_BASE}/marking/online`, {
    params: { orderId },
  });
  return response.data;
}

export async function markFeePaymentOnlineSuccess(data: {
  orderId: string;
  remarks?: string;
  /** Calendar date only `yyyy-mm-dd` (date input) — stored as payment txnDate, no time */
  paymentDateIso?: string;
  transactionId?: string;
  paymentGatewayVendor?: string;
}): Promise<ApiResponse<FeePaymentMarkingLoadedRecord>> {
  const response = await axiosInstance.post(`${PAYMENTS_BASE}/marking/online/mark-success`, data);
  return response.data;
}
