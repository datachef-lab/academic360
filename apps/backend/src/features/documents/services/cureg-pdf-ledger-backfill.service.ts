// Backfill CU_REGISTRATION_PDF ledger rows for correction requests that
// finished ONLINE_REGISTRATION before the recorder shipped.
//
// The four live PDF-generation paths (student self-submit, admin submit,
// regenerate-on-edit, tmptriggerNotif) now all call
// `recordGeneratedCuRegPdf()` which inserts one row into
// `cu_registration_document_uploads` (tagged CU_REGISTRATION_PDF) and
// projects to `document_ledger`. Any correction request that reached
// ONLINE_REGISTRATION_DONE BEFORE that recorder shipped generated a PDF,
// uploaded it to S3 and emailed the student — but wrote nothing to either
// table. Those PDFs are invisible in the passbook.
//
// This backfill closes that gap. State-based:
//   1. Read `cu_registration_correction_requests` rows with a non-null
//      `cuRegistrationApplicationNumber` (implies the PDF was actually
//      generated, since the application number is only assigned at PDF
//      generation time via advisory lock).
//   2. Skip any request that already has a CU_REGISTRATION_PDF upload row
//      (idempotent — re-runs are zero-work).
//   3. Reconstruct the canonical S3 URL from the same path helper the live
//      code uses (`getCuRegPdfPathDynamic`) — path is deterministic in
//      (studentId, uid, applicationNumber), so we get the exact URL the
//      original upload wrote.
//   4. Call `recordGeneratedCuRegPdf()` — same helper the live paths use,
//      so the upload row + ledger row shape is identical to a freshly
//      generated PDF.
//
// Multi-instance boot safety: one advisory lock scoped to the whole
// backfill (only one instance runs it per boot) plus per-row FOR UPDATE
// via the recorder's own dedup on (correctionRequest, docType).
//
// URL vs live-download: this backfill DOES NOT re-upload to S3. It stores
// the deterministic canonical URL derived from the path helper. If a PDF
// was never actually uploaded to S3 (rare), the ledger row will surface a
// 404 on click — that's still strictly better than an invisible PDF, and
// the passbook already handles 404s on external links gracefully.

import { db } from "@/db";
import { createLogger } from "@/config/logger";
import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { cuRegistrationCorrectionRequestModel } from "@repo/db/schemas/models/admissions";
import { cuRegistrationDocumentUploadModel } from "@repo/db/schemas/models/admissions";
import { studentModel } from "@repo/db/schemas/models/user";
import {
  DOCUMENT_TYPE_CODES,
  getDocumentTypeIdByCode,
} from "./document-ledger.service";
import { recordGeneratedCuRegPdf } from "@/features/admissions/services/cu-registration-document-upload.service";
import { getCuRegPdfPathDynamic } from "@/features/admissions/services/cu-registration-document-path.service";

const log = createLogger("cureg-pdf-ledger-backfill");
const ADVISORY_LOCK_KEY = 918360002;

export type CuRegPdfLedgerBackfillSummary = {
  scanned: number;
  inserted: number;
  skippedAlreadyRecorded: number;
  skippedMissingApplicationNumber: number;
  skippedMissingStudent: number;
  failed: number;
  [key: string]: unknown;
};

function buildCanonicalS3Url(fullPath: string): string | null {
  const bucket = process.env.AWS_S3_BUCKET || "";
  const region = process.env.AWS_REGION || "ap-south-1";
  const root = (process.env.AWS_ROOT_FOLDER || "").replace(/^\/+|\/+$/g, "");
  if (!bucket) return null;
  const key = root ? `${root}/${fullPath}` : fullPath;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function runCuRegPdfLedgerBackfill(): Promise<CuRegPdfLedgerBackfillSummary> {
  const summary: CuRegPdfLedgerBackfillSummary = {
    scanned: 0,
    inserted: 0,
    skippedAlreadyRecorded: 0,
    skippedMissingApplicationNumber: 0,
    skippedMissingStudent: 0,
    failed: 0,
  };

  // Only one instance runs this per boot.
  const { rows: lockRows } = await db.$client.query<{ locked: boolean }>(
    "SELECT pg_try_advisory_lock($1) AS locked",
    [ADVISORY_LOCK_KEY],
  );
  if (lockRows[0]?.locked !== true) {
    log.info("skipping — another instance holds the backfill lock");
    return { ...summary, skippedLock: true };
  }

  try {
    const pdfDocTypeId = await getDocumentTypeIdByCode(
      DOCUMENT_TYPE_CODES.CU_REGISTRATION_PDF,
    );

    // Left-anti-join: find correction requests with an application number
    // that do NOT have an upload row for CU_REGISTRATION_PDF yet.
    const candidates = await db
      .select({
        requestId: cuRegistrationCorrectionRequestModel.id,
        applicationNumber:
          cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
        studentId: cuRegistrationCorrectionRequestModel.studentId,
        studentUid: studentModel.uid,
        // The PDF is generated at the moment of final submission / last
        // edit that regenerates it — see the four live PDF paths. The
        // request's `updatedAt` is the closest stable proxy we have to
        // that generation moment for a historical row.
        submissionUpdatedAt: cuRegistrationCorrectionRequestModel.updatedAt,
        submissionCreatedAt: cuRegistrationCorrectionRequestModel.createdAt,
      })
      .from(cuRegistrationCorrectionRequestModel)
      .leftJoin(
        studentModel,
        eq(studentModel.id, cuRegistrationCorrectionRequestModel.studentId),
      )
      .leftJoin(
        cuRegistrationDocumentUploadModel,
        and(
          eq(
            cuRegistrationDocumentUploadModel.cuRegistrationCorrectionRequestId,
            cuRegistrationCorrectionRequestModel.id,
          ),
          eq(cuRegistrationDocumentUploadModel.documentId, pdfDocTypeId),
        ),
      )
      .where(
        and(
          isNotNull(
            cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
          ),
          isNull(cuRegistrationDocumentUploadModel.id),
        ),
      );

    summary.scanned = candidates.length;

    for (const row of candidates) {
      if (!row.applicationNumber) {
        summary.skippedMissingApplicationNumber += 1;
        continue;
      }
      if (!row.studentUid) {
        summary.skippedMissingStudent += 1;
        continue;
      }
      try {
        const pathConfig = await getCuRegPdfPathDynamic(
          row.studentId,
          row.studentUid,
          row.applicationNumber,
        );
        const canonicalUrl = buildCanonicalS3Url(pathConfig.fullPath);
        if (!canonicalUrl) {
          summary.failed += 1;
          log.warn(
            `AWS_S3_BUCKET missing — cannot backfill request ${row.requestId}`,
          );
          continue;
        }

        // recordGeneratedCuRegPdf is idempotent on
        // (correctionRequestId, CU_REGISTRATION_PDF); a concurrent live PDF
        // regeneration between our SELECT above and this call updates in
        // place rather than duplicating.
        //
        // Pass the request's updatedAt as `generatedAt` so the upload row
        // + ledger row both stamp the actual submission moment, not the
        // backfill's clock. Falls back to createdAt if updatedAt is null
        // (very old rows predating the trigger). Live callers omit this
        // arg and get defaultNow() as before.
        const generatedAt =
          row.submissionUpdatedAt ?? row.submissionCreatedAt ?? null;
        await recordGeneratedCuRegPdf({
          correctionRequestId: row.requestId,
          applicationNumber: row.applicationNumber,
          documentUrl: canonicalUrl,
          generatedAt,
        });
        summary.inserted += 1;
      } catch (err) {
        summary.failed += 1;
        log.error(
          `failed to backfill request ${row.requestId}: ${(err as Error).message}`,
        );
      }
    }
  } finally {
    await db.$client.query("SELECT pg_advisory_unlock($1)", [
      ADVISORY_LOCK_KEY,
    ]);
  }

  log.info("cureg-pdf-ledger-backfill complete", summary);
  return summary;
}
