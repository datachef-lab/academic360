import axiosInstance from "@/utils/api";

const BASE_URL = "/api/documents/batch-receipts";

export type BatchReceiptMode = "EXAM_LINKED" | "ADMINISTRATIVE";

export type BatchReceiptModeRow = {
  mode: BatchReceiptMode;
  isEnabled: boolean;
  notifyStudent: boolean;
};

export type BatchReceipt = {
  id: number;
  name: string;
  documentTypeId: number;
  documentTypeName: string;
  academicYearId: number;
  academicYear: string;
  classId: number;
  className: string;
  appearTypeId: number | null;
  programCourseIds: number[];
  programCourses: string[];
  expectedArrivalDate: string | null;
  availableFromDate: string | null;
  documentsReceivedAt: string | null;
  modes: BatchReceiptModeRow[];
  ledger: { total: number; pending: number; collected: number };
};

export type BatchReceiptUpsertBody = {
  documentTypeId: number;
  name: string;
  academicYearId: number;
  classId: number;
  programCourseIds: number[];
  appearTypeId?: number | null;
  expectedArrivalDate?: string | null;
  availableFromDate?: string | null;
};

type Payload<T> = { payload: T };

export async function getAllBatchReceipts(filters?: {
  academicYearId?: number;
  documentTypeId?: number;
}): Promise<BatchReceipt[]> {
  const res = await axiosInstance.get<Payload<BatchReceipt[]>>(BASE_URL, {
    params: filters,
  });
  return res.data.payload ?? [];
}

export async function createBatchReceipt(body: BatchReceiptUpsertBody) {
  const res = await axiosInstance.post<Payload<{ id: number }>>(BASE_URL, body);
  return res.data.payload;
}

export async function updateBatchReceipt(id: number, body: Partial<BatchReceiptUpsertBody>) {
  const res = await axiosInstance.put<Payload<{ id: number }>>(`${BASE_URL}/${id}`, body);
  return res.data.payload;
}

export async function deleteBatchReceipt(id: number) {
  const res = await axiosInstance.delete<Payload<{ deleted: boolean; removedLedgerRows: number }>>(
    `${BASE_URL}/${id}`,
  );
  return res.data.payload;
}

/** How many promotions the batch's scope resolves to — shown before enabling. */
export async function getBatchReceiptScope(id: number): Promise<number> {
  const res = await axiosInstance.get<Payload<{ eligible: number }>>(`${BASE_URL}/${id}/scope`);
  return res.data.payload?.eligible ?? 0;
}

export type LedgerGenerationResult = {
  batchReceiptId: number;
  eligible: number;
  created: number;
  alreadyPresent: number;
};

/**
 * Enabling ADMINISTRATIVE is what writes the ledger entries, so the response
 * carries the generation summary. EXAM_LINKED only records arrival.
 */
export async function setBatchReceiptMode(
  id: number,
  mode: BatchReceiptMode,
  isEnabled: boolean,
): Promise<{ generation?: LedgerGenerationResult }> {
  const res = await axiosInstance.put<Payload<{ generation?: LedgerGenerationResult }>>(
    `${BASE_URL}/${id}/mode`,
    { mode, isEnabled },
  );
  return res.data.payload;
}

/** Top-up for promotions created after the first generation. */
export async function generateBatchReceiptEntries(id: number): Promise<LedgerGenerationResult> {
  const res = await axiosInstance.post<Payload<LedgerGenerationResult>>(
    `${BASE_URL}/${id}/generate`,
  );
  return res.data.payload;
}
