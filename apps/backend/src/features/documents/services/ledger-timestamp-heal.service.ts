// Reconciles `document_ledger.created_at` / `updated_at` / `collected_at`
// with the source-table timestamps that back-link the row. Earlier versions
// of the three backfills (id-card / cureg-upload / temp-admit-card) wrote
// `NOW()` at insert time; the back-link then blocked the next backfill run
// from re-writing. Result: passbook rows for old handovers were stamped
// with the boot's clock instead of the actual event date.
//
// State-based: only UPDATE rows where the ledger's timestamp differs from
// the source's, so a second boot after everything is reconciled is a
// zero-row no-op. Idempotent, safe under parallel boots (updates key on a
// distinct back-link column per source table, no shared rows).
//
// Batch receipts get the same treatment: a synthetic
// `document_batch_receipts` row created by the temp-admit-card backfill was
// stamped `NOW()` even when the underlying handover happened years ago. We
// reset each batch's `created_at` to the earliest child ledger row's
// `created_at` (only for the auto-created "University Admit Card
// Distribution" batches — production batches from the console dialog keep
// their own timestamps).
import { db } from "@/db/index.js";
import { createLogger } from "@/config/logger.js";
import { sql } from "drizzle-orm";

const log = createLogger("ledger-timestamp-heal");

export type LedgerTimestampHealSummary = {
  idCardRowsHealed: number;
  cuRegUploadRowsHealed: number;
  cuRegPdfRowsHealed: number;
  tempAdmitCardRowsHealed: number;
  batchReceiptRowsHealed: number;
  [key: string]: unknown;
};

export async function runLedgerTimestampHeal(): Promise<LedgerTimestampHealSummary> {
  const summary: LedgerTimestampHealSummary = {
    idCardRowsHealed: 0,
    cuRegUploadRowsHealed: 0,
    cuRegPdfRowsHealed: 0,
    tempAdmitCardRowsHealed: 0,
    batchReceiptRowsHealed: 0,
  };

  // ID cards — ledger.created_at should equal id_card_issues.created_at,
  // and collected_at should equal issue.issue_date (mirrors
  // upsertIdCardLedgerEntry).
  const idCardResult = await db.execute(sql`
    UPDATE document_ledger dl
    SET created_at = COALESCE(ic.created_at, ic.issue_date),
        updated_at = COALESCE(ic.updated_at, ic.created_at, ic.issue_date),
        collected_at = ic.issue_date
    FROM id_card_issues ic
    WHERE ic.document_ledger_id_fk = dl.id
      AND (
        dl.created_at IS DISTINCT FROM COALESCE(ic.created_at, ic.issue_date)
        OR dl.collected_at IS DISTINCT FROM ic.issue_date
      )
  `);
  summary.idCardRowsHealed = idCardResult.rowCount ?? 0;

  // CU registration uploads — ledger.created_at should equal
  // upload.created_at (mirrors upsertCuRegUploadLedgerEntry).
  const cuRegResult = await db.execute(sql`
    UPDATE document_ledger dl
    SET created_at = COALESCE(u.created_at, dl.created_at),
        updated_at = COALESCE(u.updated_at, u.created_at, dl.updated_at)
    FROM cu_registration_document_uploads u
    WHERE u.document_ledger_id_fk = dl.id
      AND u.created_at IS NOT NULL
      AND dl.created_at IS DISTINCT FROM u.created_at
  `);
  summary.cuRegUploadRowsHealed = cuRegResult.rowCount ?? 0;

  // Temp admit card distributions — ledger.created_at + collected_at both
  // come from temp.created_at (mirrors insertAdmitCardLedgerRow's backfill
  // call).
  const tempResult = await db.execute(sql`
    UPDATE document_ledger dl
    SET created_at = COALESCE(t.created_at, dl.created_at),
        updated_at = COALESCE(t.updated_at, t.created_at, dl.updated_at),
        collected_at = COALESCE(t.created_at, dl.collected_at)
    FROM temp_admit_card_distributions t
    WHERE t.document_ledger_id_fk = dl.id
      AND t.created_at IS NOT NULL
      AND (
        dl.created_at IS DISTINCT FROM t.created_at
        OR dl.collected_at IS DISTINCT FROM t.created_at
      )
  `);
  summary.tempAdmitCardRowsHealed = tempResult.rowCount ?? 0;

  // CU_REGISTRATION_PDF rows — unlike student uploads, the PDF has no
  // separate "generation moment" of its own on the row itself. The truth
  // is on the parent cu_registration_correction_requests.updated_at: the
  // PDF is regenerated whenever the request is finalised or its data
  // fields update. Any upload/ledger row whose createdAt is later than
  // that (e.g. inserted by an earlier cureg-pdf-ledger-backfill run that
  // used NOW()) gets pulled back to match the true submission moment.
  const cuRegPdfResult = await db.execute(sql`
    WITH truth AS (
      SELECT u.id AS upload_id,
             u.document_ledger_id_fk AS ledger_id,
             cr.updated_at AS submission_updated_at
      FROM cu_registration_document_uploads u
      JOIN document_types dt ON dt.id = u.document_id_fk
      JOIN cu_registration_correction_requests cr
        ON cr.id = u.cu_registration_correction_request_id_fk
      WHERE dt.code = 'CU_REGISTRATION_PDF'
        AND cr.updated_at IS NOT NULL
    ),
    upd_ledger AS (
      UPDATE document_ledger dl
      SET created_at = t.submission_updated_at,
          updated_at = t.submission_updated_at
      FROM truth t
      WHERE t.ledger_id = dl.id
        AND dl.created_at IS DISTINCT FROM t.submission_updated_at
      RETURNING dl.id
    ),
    upd_upload AS (
      UPDATE cu_registration_document_uploads u
      SET created_at = t.submission_updated_at,
          updated_at = t.submission_updated_at
      FROM truth t
      WHERE t.upload_id = u.id
        AND u.created_at IS DISTINCT FROM t.submission_updated_at
      RETURNING u.id
    )
    SELECT (SELECT COUNT(*) FROM upd_ledger) AS ledger_updates,
           (SELECT COUNT(*) FROM upd_upload) AS upload_updates
  `);
  const pdfRow = (cuRegPdfResult.rows?.[0] ?? {}) as {
    ledger_updates?: string | number;
    upload_updates?: string | number;
  };
  summary.cuRegPdfRowsHealed = Number(pdfRow.ledger_updates ?? 0);

  // Batch receipts for the synthetic "University Admit Card Distribution"
  // batches — pull them back to the earliest child ledger row's created_at.
  // Scoped to admit-card batches (matched via document_types.code) and only
  // when the batch's own created_at is later than any of its child rows
  // (i.e. an obviously wrong "created after its own contents" state).
  const batchResult = await db.execute(sql`
    UPDATE document_batch_receipts br
    SET created_at = earliest.min_created_at,
        updated_at = GREATEST(br.updated_at, earliest.min_created_at)
    FROM (
      SELECT dl.document_batch_receipt_id_fk AS batch_id,
             MIN(dl.created_at) AS min_created_at
      FROM document_ledger dl
      WHERE dl.document_batch_receipt_id_fk IS NOT NULL
      GROUP BY dl.document_batch_receipt_id_fk
    ) earliest
    WHERE earliest.batch_id = br.id
      AND br.document_type_id_fk IN (
        SELECT id FROM document_types WHERE code = 'EXAM_ADMIT_CARD'
      )
      AND br.created_at > earliest.min_created_at
  `);
  summary.batchReceiptRowsHealed = batchResult.rowCount ?? 0;

  log.info("ledger-timestamp-heal complete", summary);
  return summary;
}
