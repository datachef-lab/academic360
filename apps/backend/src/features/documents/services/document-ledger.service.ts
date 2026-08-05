import { db } from "@/db/index.js";
import { createLogger } from "@/config/logger.js";
import {
  resolvePromotionForAcademicYear,
  resolvePromotionForDate,
} from "@/features/batches/services/promotion-resolver.service.js";
import {
  documentLedgerModel,
  documentTypeModel,
} from "@repo/db/schemas/models/documents";
import { idCardIssueModel } from "@repo/db/schemas/models/idcard";
import { cuRegistrationDocumentUploadModel } from "@repo/db/schemas/models/admissions";
import { eq, sql } from "drizzle-orm";
import { recomputeFeeClearanceForStudent } from "./fee-clearance.service.js";

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
  CU_REGISTRATION_PDF: "CU_REGISTRATION_PDF",
  ID_CARD: "ID_CARD",
  CU_EXAM_FORM: "CU_EXAM_FORM",
  // CU registration UPLOAD types (student-supplied). Codes match the seed at
  // apps/backend/src/features/academics/services/document.service.ts:130-188.
  CLASS_XII_MARKSHEET: "CLASS_XII_MARKSHEET",
  AADHAAR_CARD: "AADHAAR_CARD",
  APAAR_ID_CARD: "APAAR_ID_CARD",
  FATHER_PHOTO_ID: "FATHER_PHOTO_ID",
  MOTHER_PHOTO_ID: "MOTHER_PHOTO_ID",
  EWS_CERTIFICATE: "EWS_CERTIFICATE",
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

/* ------------------------------------------------------------------------- */
/*                     CU registration document uploads                      */
/* ------------------------------------------------------------------------- */

type CuRegUploadForLedger = {
  id: number;
  /** Already a `document_types.id` on this table — no code lookup needed. */
  documentId: number;
  documentUrl?: string | null;
  documentLedgerId?: number | null;
  /** Copied onto the ledger row so the passbook keeps the real submission history. */
  createdAt?: Date | null;
  updatedAt?: Date | null;
  /** From the parent correction request. */
  studentId: number;
  academicYearId?: number | null;
};

/**
 * Student-supplied documents are `UPLOADED` / self-sourced, unlike an ID card
 * which the college hands over. The one exception lives in this same table: the
 * generated adm-reg PDF is written as an upload row but is college-generated, so
 * it is discriminated on the document type's category.
 */
async function isSelfSourcedUpload(
  documentTypeId: number,
  executor: Executor,
): Promise<boolean> {
  const [type] = await executor
    .select({ category: documentTypeModel.category })
    .from(documentTypeModel)
    .where(eq(documentTypeModel.id, documentTypeId))
    .limit(1);
  return type?.category !== "SYSTEM_GENERATED";
}

/**
 * Create the passbook entry for a CU registration upload and link it back.
 * Idempotent on `documentLedgerId`, which is what makes the backfill state-based.
 */
export async function upsertCuRegUploadLedgerEntry(
  upload: CuRegUploadForLedger,
  executor: Executor = db,
): Promise<number | null> {
  if (upload.documentLedgerId != null) return upload.documentLedgerId;

  // The correction request carries an explicit academic year, which beats
  // guessing from a date. Fall back to the date only if it is missing.
  const promotion = upload.academicYearId
    ? ((await resolvePromotionForAcademicYear(
        upload.studentId,
        upload.academicYearId,
      )) ??
      (upload.createdAt
        ? await resolvePromotionForDate(upload.studentId, upload.createdAt)
        : null))
    : upload.createdAt
      ? await resolvePromotionForDate(upload.studentId, upload.createdAt)
      : null;

  if (!promotion) {
    log.warn(
      `cu_registration_document_uploads#${upload.id}: student ${upload.studentId} has no promotion — ledger entry skipped`,
    );
    return null;
  }

  const [ledger] = await executor
    .insert(documentLedgerModel)
    .values({
      documentTypeId: upload.documentId,
      promotionId: promotion.promotionId,
      isSelfSourced: await isSelfSourcedUpload(upload.documentId, executor),
      // The enum documents this as "Document uploaded to the system".
      status: "UPLOADED",
      // Nobody handed it over, so neither of these applies.
      collectedAt: null,
      providedBy: null,
      link: upload.documentUrl ?? null,
      documentBatchReceiptId: null,
      // Mirror the upload's own timestamps rather than "now".
      createdAt: upload.createdAt ?? new Date(),
      updatedAt: upload.updatedAt ?? upload.createdAt ?? new Date(),
    })
    .returning({ id: documentLedgerModel.id });

  if (!ledger) return null;

  await executor
    .update(cuRegistrationDocumentUploadModel)
    .set({
      documentLedgerId: ledger.id,
      // `updatedAt` carries $onUpdate — write the existing value back so linking
      // cannot restamp every source row.
      ...(upload.updatedAt ? { updatedAt: upload.updatedAt } : {}),
    })
    .where(eq(cuRegistrationDocumentUploadModel.id, upload.id));

  return ledger.id;
}

/**
 * A re-upload replaces the file in place (the upsert keeps the same row id), so
 * the passbook entry is refreshed rather than duplicated.
 */
export async function refreshCuRegUploadLedgerEntry(
  upload: Pick<
    CuRegUploadForLedger,
    "documentLedgerId" | "documentUrl" | "updatedAt"
  >,
  executor: Executor = db,
): Promise<void> {
  if (upload.documentLedgerId == null) return;
  await executor
    .update(documentLedgerModel)
    .set({
      link: upload.documentUrl ?? null,
      updatedAt: upload.updatedAt ?? new Date(),
    })
    .where(eq(documentLedgerModel.id, upload.documentLedgerId));
}

/** Drop the passbook entry belonging to a CU registration upload. */
export async function deleteCuRegUploadLedgerEntry(
  uploadId: number,
  ledgerId: number | null | undefined,
  executor: Executor = db,
): Promise<void> {
  if (ledgerId == null) return;
  await executor
    .update(cuRegistrationDocumentUploadModel)
    .set({ documentLedgerId: null })
    .where(eq(cuRegistrationDocumentUploadModel.id, uploadId));
  await executor
    .delete(documentLedgerModel)
    .where(eq(documentLedgerModel.id, ledgerId));
}

/** Bulk variant for "delete every upload of a correction request". */
export async function deleteCuRegUploadLedgerEntriesByIds(
  uploads: { id: number; documentLedgerId?: number | null }[],
  executor: Executor = db,
): Promise<void> {
  for (const u of uploads) {
    await deleteCuRegUploadLedgerEntry(u.id, u.documentLedgerId, executor);
  }
}

/**
 * Shape returned by {@link listLedgerForStudent}. Flat row per ledger entry —
 * the caller (student-ledger UI) groups by academic year / class client-side.
 */
export type StudentLedgerRow = {
  ledgerId: number;
  status: string;
  isSelfSourced: boolean;
  link: string | null;
  collectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
  /**
   * True when the parent batch's ADMINISTRATIVE mode is enabled. The
   * console gates the Collect button on this — a distribution can only
   * happen once the batch is administratively marked "ready to hand
   * out". Null when the row has no parent batch (self-uploads, ID cards)
   * — those don't collect via this path.
   */
  batchAdministrativeEnabled: boolean | null;
  providedByUserId: number | null;
  providedByName: string | null;
  /** ID-card ledger rows carry the S3-key photo on `id_card_issues`, not on
   *  `document_ledger.link`. Populated only when `documentTypeCode === "ID_CARD"`
   *  and the linked issue exists; used by the console to build the front-image
   *  view URL (`/api/idcard/issues/:id/front`). */
  idCardIssueId: number | null;
};

/**
 * Every ledger entry a student holds, joined with the metadata the console
 * needs to render each row without a second round-trip.
 *
 * - Promotion → session → academic year (name), promotion → class (name).
 * - Batch receipt name is nullable — ID cards and self-uploaded rows don't
 *   belong to a batch.
 * - Archived batches are still returned; the frontend can hide/dim them
 *   based on `isBatchArchived` per that flag's design.
 * - Ordered newest-first per row so the UI can render a chronological feed
 *   without extra sort work, but the grouper is expected to keep its own
 *   (year, class) order.
 */
export async function listLedgerForStudent(
  studentId: number,
): Promise<StudentLedgerRow[]> {
  if (!Number.isFinite(studentId) || studentId <= 0) return [];

  // Lazy sync: bring fee-gated rows in line with the current fee balance
  // before returning. Cheap when nothing has changed (both UPDATEs match
  // nothing). Keeps the passbook truthful without needing every fee-write
  // site to know about the document ledger.
  try {
    await recomputeFeeClearanceForStudent(studentId);
  } catch (err) {
    log.warn(
      `fee-clearance recompute failed for student ${studentId}; returning stale statuses: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const rows = (
    await db.execute(sql`
      SELECT
        dl.id                             AS "ledgerId",
        dl.status                         AS "status",
        dl.is_self_sourced                AS "isSelfSourced",
        dl.link                           AS "link",
        dl.collected_at                   AS "collectedAt",
        dl.created_at                     AS "createdAt",
        dl.updated_at                     AS "updatedAt",
        dt.id                             AS "documentTypeId",
        dt.name                           AS "documentTypeName",
        dt.code                           AS "documentTypeCode",
        dt.category::text                 AS "documentTypeCategory",
        dt.issuing_authority::text        AS "issuingAuthority",
        p.id                              AS "promotionId",
        ay.year                           AS "academicYear",
        c.name                            AS "className",
        dbr.id                            AS "batchReceiptId",
        dbr.name                          AS "batchReceiptName",
        COALESCE(dbr.is_archived, false)  AS "isBatchArchived",
        -- Whether the batch's ADMINISTRATIVE mode is on. Powers the
        -- Collect button gate — undistributed until the batch is
        -- administratively marked "ready". NULL when no batch (self
        -- uploads, ID cards) — those never collect via this path.
        CASE
          WHEN dbr.id IS NULL THEN NULL
          ELSE COALESCE(
            (SELECT bm.is_enabled FROM document_batch_receipt_modes bm
             WHERE bm.document_batch_receipt_mode_id_fk = dbr.id
               AND bm.mode = 'ADMINISTRATIVE' LIMIT 1),
            false
          )
        END                               AS "batchAdministrativeEnabled",
        prov.id                           AS "providedByUserId",
        prov.name                         AS "providedByName",
        ici.id                            AS "idCardIssueId"
      FROM document_ledger dl
      JOIN document_types dt              ON dt.id = dl.document_type_id_fk
      JOIN promotions p                   ON p.id = dl.promotion_id_fk
      JOIN sessions se                    ON se.id = p.session_id_fk
      JOIN academic_years ay              ON ay.id = se.academic_id_fk
      JOIN classes c                      ON c.id = p.class_id_fk
      LEFT JOIN document_batch_receipts dbr
                                          ON dbr.id = dl.document_batch_receipt_id_fk
      LEFT JOIN users prov                ON prov.id = dl.provided_by_fk
      -- ID cards: front-image key lives on id_card_issues, not on
      -- document_ledger.link. Join to expose the issue id so the console
      -- can build a view URL for ID_CARD rows.
      LEFT JOIN id_card_issues ici        ON ici.document_ledger_id_fk = dl.id
      WHERE p.student_id_fk = ${studentId}
      ORDER BY dl.created_at DESC, dl.id DESC`)
  ).rows as unknown as StudentLedgerRow[];

  return rows.map((r) => ({
    ...r,
    isSelfSourced: Boolean(r.isSelfSourced),
    isBatchArchived: Boolean(r.isBatchArchived),
    batchAdministrativeEnabled:
      r.batchAdministrativeEnabled == null
        ? null
        : Boolean(r.batchAdministrativeEnabled),
  }));
}
