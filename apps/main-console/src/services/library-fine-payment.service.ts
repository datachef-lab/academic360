import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type FinePaymentInitResult = {
  paymentId: number;
  orderId: string;
  amount: number;
  context: "LIBRARY_FINE";
  txnToken: string | null;
  gatewayError: string | null;
};

const BASE = "/api/library/fines";

export async function initiateLibraryFinePayment(circulationId: number, userId: number) {
  const res = await axiosInstance.post<ApiResponse<FinePaymentInitResult>>(
    `${BASE}/${circulationId}/initiate`,
    { userId },
  );
  return res.data;
}

export async function recordLibraryFineCashPayment(circulationId: number, remarks?: string) {
  const res = await axiosInstance.post<ApiResponse<{ paymentId: number; amount: number }>>(
    `${BASE}/${circulationId}/cash`,
    { remarks },
  );
  return res.data;
}

export async function waiveLibraryFine(circulationId: number, amount: number, remarks?: string) {
  const res = await axiosInstance.post<ApiResponse<null>>(`${BASE}/${circulationId}/waive`, {
    amount,
    remarks,
  });
  return res.data;
}

/**
 * Opens the Paytm hosted checkout for an initiated fine payment in a new tab
 * (same hidden-form pattern as the student enrollment-fees page).
 * Returns false when the gateway config is unavailable.
 */
export async function openPaytmCheckoutForFine(orderId: string, txnToken: string) {
  const configRes =
    await axiosInstance.get<ApiResponse<{ mid: string; host: string }>>("/api/payments/config");
  const config = configRes.data?.payload;
  if (!config?.mid || !config?.host) return false;
  const paytmHost = config.host.replace(/^https?:\/\//, "");
  const url = `https://${paytmHost}/theia/api/v1/showPaymentPage?mid=${config.mid}&orderId=${orderId}`;
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.target = "_blank";
  form.style.display = "none";
  [
    { name: "mid", value: config.mid },
    { name: "orderId", value: orderId },
    { name: "txnToken", value: txnToken },
  ].forEach(({ name, value }) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
  form.remove();
  return true;
}

export async function settleLibraryFinePayment(paymentId: number, status: "SUCCESS" | "FAILED") {
  const res = await axiosInstance.post<ApiResponse<null>>(`${BASE}/payments/${paymentId}/settle`, {
    status,
  });
  return res.data;
}
