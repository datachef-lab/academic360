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

export async function getPaymentStatus(orderId: string): Promise<ApiResponse<PaymentStatusResponse>> {
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
