import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type FinePaymentInitResult = {
  paymentId: number;
  orderId: string;
  amount: number;
  context: "LIBRARY_FINE";
};

const BASE = "/api/library/fines";

export async function initiateLibraryFinePayment(circulationId: number, userId: number) {
  const res = await axiosInstance.post<ApiResponse<FinePaymentInitResult>>(
    `${BASE}/${circulationId}/pay`,
    { userId },
  );
  return res.data;
}

export async function settleLibraryFinePayment(paymentId: number, status: "SUCCESS" | "FAILED") {
  const res = await axiosInstance.post<ApiResponse<null>>(`${BASE}/payments/${paymentId}/settle`, {
    status,
  });
  return res.data;
}
