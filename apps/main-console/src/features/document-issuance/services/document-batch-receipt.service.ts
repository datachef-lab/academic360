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
  isArchived: boolean;
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
  isArchived?: boolean;
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

/**
 * Live count for the create/edit dialog — how many active promotions the
 * chosen scope resolves to before the batch is saved. Returns 0 for an
 * incomplete scope (empty year / class / courses).
 */
export async function getPromotionCountForScope(scope: {
  academicYearId: number | null;
  classId: number | null;
  programCourseIds: number[];
}): Promise<number> {
  const res = await axiosInstance.post<Payload<{ count: number }>>(
    `${BASE_URL}/promotion-count`,
    scope,
  );
  return res.data.payload?.count ?? 0;
}

/**
 * One flat row per document_ledger entry for a student — the shape the
 * Student Ledger page groups by academic year / class.
 */
export type StudentLedgerRow = {
  ledgerId: number;
  status: "UPLOADED" | "PENDING" | "ON_HOLD" | "COLLECTED" | "WAIVED" | "EXPECTED" | "NO_CHANGE";
  isSelfSourced: boolean;
  link: string | null;
  collectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  documentTypeId: number;
  documentTypeName: string;
  documentTypeCode: string;
  documentTypeCategory: string | null;
  issuingAuthority: string | null;
  promotionId: number;
  academicYear: string | null;
  className: string | null;
  batchReceiptId: number | null;
  batchReceiptName: string | null;
  isBatchArchived: boolean;
  providedByUserId: number | null;
  providedByName: string | null;
  /** For ID_CARD rows the front-image is served via
   *  `/api/idcard/issues/:id/front`, not stored on `link`. Null otherwise. */
  idCardIssueId: number | null;
};

export async function getStudentLedger(studentId: number): Promise<StudentLedgerRow[]> {
  const res = await axiosInstance.get<Payload<StudentLedgerRow[]>>(
    `${BASE_URL}/ledger/student/${studentId}`,
  );
  return res.data.payload ?? [];
}

/**
 * Mark a ledger entry as collected — PENDING → COLLECTED on the row. Backend
 * uses the current user as `providedBy` and stamps `collectedAt` server-side.
 * A double-tap on an already-collected row is safe: backend replies 409 with
 * the existing collectedAt, which the caller can surface as a warning.
 */
export async function markLedgerEntryCollected(ledgerId: number): Promise<{
  ledgerId: number;
  collected: boolean;
  alreadyCollected: boolean;
  collectedAt: string | null;
}> {
  const res = await axiosInstance.post<
    Payload<{
      ledgerId: number;
      collected: boolean;
      alreadyCollected: boolean;
      collectedAt: string | null;
    }>
  >(`${BASE_URL}/ledger/${ledgerId}/collect`);
  return res.data.payload;
}
