import { db } from "@/db/index.js";
import { createLogger } from "@/config/logger.js";
import { idCardIssueModel } from "@repo/db/schemas/models/idcard";
import { asc, eq, isNull } from "drizzle-orm";
import { upsertIdCardLedgerEntry } from "./document-ledger.service.js";

const log = createLogger("idcard-ledger-backfill");

const BATCH_SIZE = 500;

/**
 * Give every pre-existing ID card issue its document_ledger entry.
 *
 * State-based rather than marker-guarded: the work item is literally
 * "issues with document_ledger_id_fk IS NULL", so a second boot finds nothing and
 * does nothing. That also makes it self-healing — the legacy sync re-scans the
 * old database on every boot, so new issues can appear at any time and this picks
 * them up on the next start.
 *
 * (Contrast `document-types-seed`, which IS marker-guarded: those rows are
 * admin-owned and must never be recreated once deleted. These rows are derived,
 * so re-deriving them is always correct.)
 */
export async function runIdCardLedgerBackfill(): Promise<
  Record<string, unknown>
> {
  let linked = 0;
  let skippedNoPromotion = 0;
  let failed = 0;

  for (;;) {
    const pending = await db
      .select({
        id: idCardIssueModel.id,
        studentId: idCardIssueModel.studentId,
        issueDate: idCardIssueModel.issueDate,
        issuedByUserId: idCardIssueModel.issuedByUserId,
        frontImageUrl: idCardIssueModel.frontImageUrl,
        createdAt: idCardIssueModel.createdAt,
        updatedAt: idCardIssueModel.updatedAt,
      })
      .from(idCardIssueModel)
      .where(isNull(idCardIssueModel.documentLedgerId))
      .orderBy(asc(idCardIssueModel.id))
      .limit(BATCH_SIZE);

    if (pending.length === 0) break;

    let progressedThisBatch = 0;
    for (const issue of pending) {
      try {
        // Lock the source row and re-check inside the transaction — two
        // instances booting together would otherwise both insert a ledger row
        // for the same card and orphan the loser's.
        const ledgerId = await db.transaction(async (tx) => {
          const [locked] = await tx
            .select({ documentLedgerId: idCardIssueModel.documentLedgerId })
            .from(idCardIssueModel)
            .where(eq(idCardIssueModel.id, issue.id))
            .for("update");

          if (!locked || locked.documentLedgerId != null) return null;
          return await upsertIdCardLedgerEntry(issue, tx);
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
          `id_card_issues#${issue.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // Rows that can't progress (no promotion / repeated failure) keep matching the
    // query, so stop once a whole batch produced no links instead of looping.
    if (progressedThisBatch === 0) break;
  }

  return { linked, skippedNoPromotion, failed };
}
