import { db } from "@/db/index.js";
import { createLogger } from "@/config/logger.js";
import {
  cuRegistrationCorrectionRequestModel,
  cuRegistrationDocumentUploadModel,
} from "@repo/db/schemas/models/admissions";
import { asc, eq, isNull } from "drizzle-orm";
import { upsertCuRegUploadLedgerEntry } from "./document-ledger.service.js";

const log = createLogger("cureg-upload-ledger-backfill");

const BATCH_SIZE = 500;

/**
 * Give every pre-existing CU registration upload its document_ledger entry.
 *
 * State-based, exactly like `idcard-ledger-backfill`: the work item is "uploads
 * with a NULL ledger FK", so a second boot finds nothing. Derived rows should
 * re-derive, which is why this is not marker-guarded.
 *
 * The student and academic year come from the parent correction request — the
 * upload row carries neither.
 */
export async function runCuRegUploadLedgerBackfill(): Promise<
  Record<string, unknown>
> {
  let linked = 0;
  let skippedNoPromotion = 0;
  let failed = 0;

  for (;;) {
    const pending = await db
      .select({
        id: cuRegistrationDocumentUploadModel.id,
        documentId: cuRegistrationDocumentUploadModel.documentId,
        documentUrl: cuRegistrationDocumentUploadModel.documentUrl,
        createdAt: cuRegistrationDocumentUploadModel.createdAt,
        updatedAt: cuRegistrationDocumentUploadModel.updatedAt,
        studentId: cuRegistrationCorrectionRequestModel.studentId,
        academicYearId: cuRegistrationCorrectionRequestModel.academicYearId,
      })
      .from(cuRegistrationDocumentUploadModel)
      .innerJoin(
        cuRegistrationCorrectionRequestModel,
        eq(
          cuRegistrationCorrectionRequestModel.id,
          cuRegistrationDocumentUploadModel.cuRegistrationCorrectionRequestId,
        ),
      )
      .where(isNull(cuRegistrationDocumentUploadModel.documentLedgerId))
      .orderBy(asc(cuRegistrationDocumentUploadModel.id))
      .limit(BATCH_SIZE);

    if (pending.length === 0) break;

    let progressedThisBatch = 0;
    for (const upload of pending) {
      try {
        // Lock the source row and re-check inside the transaction. Without this,
        // two instances booting at once both see a NULL FK, both insert a ledger
        // row, and the loser's row is orphaned — silently duplicating documents
        // in the passbook.
        const ledgerId = await db.transaction(async (tx) => {
          const [locked] = await tx
            .select({
              documentLedgerId:
                cuRegistrationDocumentUploadModel.documentLedgerId,
            })
            .from(cuRegistrationDocumentUploadModel)
            .where(eq(cuRegistrationDocumentUploadModel.id, upload.id))
            .for("update");

          if (!locked || locked.documentLedgerId != null) return null;
          return await upsertCuRegUploadLedgerEntry(upload, tx);
        });
        if (ledgerId == null) {
          // Either no promotion to hang it off, or another runner claimed the
          // row first. Left NULL so it is retried rather than mis-written.
          skippedNoPromotion++;
        } else {
          linked++;
          progressedThisBatch++;
        }
      } catch (err) {
        failed++;
        log.warn(
          `cu_registration_document_uploads#${upload.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // Rows that can't progress keep matching the query, so stop once a whole
    // batch produced no links instead of looping forever.
    if (progressedThisBatch === 0) break;
  }

  return { linked, skippedNoPromotion, failed };
}
