import axiosInstance from "@/utils/api";

/** Same origin as axios (must match for authenticated GET in a new tab if using cookies). */
export function getFeeReceiptBackendBaseUrl(): string {
  const raw = import.meta.env.VITE_APP_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || "";
  return String(raw).replace(/\/$/, "");
}

/** POST ensures receipt/challan; returns relative URL for GET PDF. */
export async function ensureFeeReceiptDownloadUrl(
  feeStructureId: number,
  studentId: number,
): Promise<string> {
  const response = await axiosInstance.post<{
    payload: { url: string; challanNumber: string };
  }>("/api/v1/fees/receipts", { feeStructureId, studentId });
  const url = response.data?.payload?.url;
  if (!url) throw new Error("Receipt URL not returned");
  return url.startsWith("/") ? url : `/${url}`;
}

/**
 * POST to obtain the partial PDF path, then opens `backendHost + path` in a new tab.
 */
export async function openFeeReceiptPdfInNewTab(
  feeStructureId: number,
  studentId: number,
): Promise<void> {
  const pathWithQuery = await ensureFeeReceiptDownloadUrl(feeStructureId, studentId);
  const base = getFeeReceiptBackendBaseUrl();
  if (!base) {
    throw new Error(
      "Backend base URL is not configured (VITE_APP_BACKEND_URL / VITE_API_BASE_URL)",
    );
  }
  const fullUrl = `${base}${pathWithQuery}`;
  window.open(fullUrl, "_blank", "noopener,noreferrer");
}
