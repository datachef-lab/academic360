import { db } from "@/db/index.js";
import { createLogger } from "@/config/logger.js";
import { resolvePromotionForDate } from "@/features/batches/services/promotion-resolver.service.js";
import {
  documentLedgerModel,
  documentTypeModel,
} from "@repo/db/schemas/models/documents";
import { idCardIssueModel } from "@repo/db/schemas/models/idcard";
import { eq } from "drizzle-orm";

const log = createLogger("document-ledger");

/**
 * `document_ledger` is the student's document passbook: one row per document
 * INSTANCE held against a promotion.
 *
 * Deliberately per-instance, not per (promotion, document type): a student can
 * hold several cards for the same promotion after a reissue. On live data 331
 * promotions carry 2-4 ID cards, so a unique on (promotion, type) would reject
 * 681 rows.
 */

/** Codes are the stable, server-assigned keys on `document_types`. */
export const DOCUMENT_TYPE_CODES = {
  EXAM_ADMIT_CARD: "EXAM_ADMIT_CARD",
  FEE_RECEIPT: "FEE_RECEIPT",
  CU_REGISTRATION_PDF: "CU_REGISTRATION_PDF",
  ID_CARD: "ID_CARD",
  CU_EXAM_FORM: "CU_EXAM_FORM",
} as const;

export type DocumentTypeCode =
  (typeof DOCUMENT_TYPE_CODES)[keyof typeof DOCUMENT_TYPE_CODES];

type Db = typeof db;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Executor = Db | Tx;

/**
 * Codes never change once assigned, so the id is safe to memoise for the process
 * lifetime. A miss is a programming error (the seed guarantees these rows), so it
 * throws rather than silently skipping — the old name-based lookup's habit of
 * logging and carrying on is exactly how CU registration PDFs went unrecorded.
 */
const typeIdByCode = new Map<string, number>();

export async function getDocumentTypeIdByCode(
  code: DocumentTypeCode,
  executor: Executor = db,
): Promise<number> {
  const cached = typeIdByCode.get(code);
  if (cached != null) return cached;

  const [row] = await executor
    .select({ id: documentTypeModel.id })
    .from(documentTypeModel)
    .where(eq(documentTypeModel.code, code))
    .limit(1);

  if (!row) {
    throw new Error(
      `document_types row with code "${code}" is missing — the document-types seed has not run on this database.`,
    );
  }
  typeIdByCode.set(code, row.id);
  return row.id;
}

type IdCardIssueForLedger = {
  id: number;
  studentId: number;
  issueDate: Date;
  issuedByUserId?: number | null;
  frontImageUrl?: string | null;
  documentLedgerId?: number | null;
  /**
   * Carried onto the ledger row so the passbook keeps the card's real history.
   * Without these, a backfill would stamp every row with the boot time and the
   * legacy sync's carefully preserved old-DB timestamps would be lost.
   */
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

/**
 * Create the passbook entry for an ID card issue and link it back.
 *
 * Idempotent on `documentLedgerId`: an issue that already has an entry is left
 * alone, which is what lets the legacy sync (it re-scans every boot) and the
 * backfill both call this freely.
 *
 * Returns the ledger id, or null when the student has no promotion to hang it off.
 */
export async function upsertIdCardLedgerEntry(
  issue: IdCardIssueForLedger,
  executor: Executor = db,
): Promise<number | null> {
  if (issue.documentLedgerId != null) return issue.documentLedgerId;

  const promotion = await resolvePromotionForDate(
    issue.studentId,
    issue.issueDate,
  );
  if (!promotion) {
    log.warn(
      `id_card_issues#${issue.id}: student ${issue.studentId} has no promotion — ledger entry skipped`,
    );
    return null;
  }

  const documentTypeId = await getDocumentTypeIdByCode(
    DOCUMENT_TYPE_CODES.ID_CARD,
    executor,
  );

  const [ledger] = await executor
    .insert(documentLedgerModel)
    .values({
      documentTypeId,
      promotionId: promotion.promotionId,
      // The college prints and hands the card over; the student does not source it.
      isSelfSourced: false,
      // The row exists because the card was issued, so it is already in hand.
      status: "COLLECTED",
      collectedAt: issue.issueDate,
      providedBy: issue.issuedByUserId ?? null,
      link: issue.frontImageUrl ?? null,
      documentBatchReceiptId: null,
      // Mirror the card's own timestamps rather than "now".
      createdAt: issue.createdAt ?? issue.issueDate,
      updatedAt: issue.updatedAt ?? issue.createdAt ?? issue.issueDate,
    })
    .returning({ id: documentLedgerModel.id });

  if (!ledger) return null;

  await executor
    .update(idCardIssueModel)
    .set({
      documentLedgerId: ledger.id,
      // `updatedAt` carries $onUpdate, so linking would otherwise restamp every
      // card with the backfill time. Write the existing value back explicitly.
      ...(issue.updatedAt ? { updatedAt: issue.updatedAt } : {}),
    })
    .where(eq(idCardIssueModel.id, issue.id));

  return ledger.id;
}

/**
 * Drop the passbook entry belonging to an ID card issue. Clears the FK first so
 * the delete cannot trip the reference.
 */
export async function deleteIdCardLedgerEntry(
  issueId: number,
  ledgerId: number | null | undefined,
  executor: Executor = db,
): Promise<void> {
  if (ledgerId == null) return;
  await executor
    .update(idCardIssueModel)
    .set({ documentLedgerId: null })
    .where(eq(idCardIssueModel.id, issueId));
  await executor
    .delete(documentLedgerModel)
    .where(eq(documentLedgerModel.id, ledgerId));
}
