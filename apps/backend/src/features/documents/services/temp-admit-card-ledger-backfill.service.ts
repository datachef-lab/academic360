// State-based backfill that projects every `temp_admit_card_distributions`
// row into `document_batch_receipts` + `document_ledger`. Same shape as the
// ID card and CU-reg upload backfills — batched, per-row FOR UPDATE, back-link
// FK is authoritative for idempotency.
//
// Two helpers are exported so the live distribute path
// (`admit-card.service.ts::distributeAdmitCard`) can call the same code and
// keep the two tables in step in real time:
//   • resolveOrCreateAdmitCardBatch — find-or-create the synthetic batch for
//     (academicYear, class), inserting mode + program-course rows as needed.
//   • insertAdmitCardLedgerRow — insert the COLLECTED ledger row and return
//     its id so the caller can back-link temp.document_ledger_id_fk.

import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { createLogger } from "@/config/logger.js";
import { tempAdmitCardDistributionsModel } from "@repo/db/schemas/models/exams";
import {
  documentBatchReceiptModel,
  documentBatchReceiptModeModel,
  documentBatchReceiptProgramCourseModel,
  documentLedgerModel,
} from "@repo/db/schemas/models/documents";
import { promotionModel } from "@repo/db/schemas/models/batches";
import {
  classModel,
  academicYearModel,
} from "@repo/db/schemas/models/academics";
import { sessionModel } from "@repo/db/schemas/models/academics/session.model";
import { resolvePromotionForDate } from "@/features/batches/services/promotion-resolver.service.js";
import {
  DOCUMENT_TYPE_CODES,
  getDocumentTypeIdByCode,
} from "./document-ledger.service.js";

const log = createLogger("temp-admit-card-ledger-backfill");

const BATCH_SIZE = 500;
const SEMESTER_ONE_CLASS_ID = 1;

type Db = typeof db;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Executor = Db | Tx;

/**
 * A promotion resolved to its (year, class, course, student) context — the
 * shape both the backfill and live path need to construct a ledger row and
 * find-or-create the enclosing batch receipt.
 */
export type ResolvedPromotionContext = {
  promotionId: number;
  studentId: number;
  classId: number;
  className: string;
  academicYearId: number;
  academicYearLabel: string;
  programCourseId: number;
};

/**
 * Look up all the promotion-side context for a given promotion id in one
 * shot. Used by both the backfill (per row) and the live path (per new
 * distribution).
 */
export async function loadPromotionContext(
  promotionId: number,
  executor: Executor = db,
): Promise<ResolvedPromotionContext | null> {
  const rows = (await executor
    .select({
      promotionId: promotionModel.id,
      studentId: promotionModel.studentId,
      classId: promotionModel.classId,
      className: classModel.name,
      academicYearId: academicYearModel.id,
      academicYearLabel: academicYearModel.year,
      programCourseId: promotionModel.programCourseId,
    })
    .from(promotionModel)
    .innerJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
    .innerJoin(
      academicYearModel,
      eq(academicYearModel.id, sessionModel.academicYearId),
    )
    .innerJoin(classModel, eq(classModel.id, promotionModel.classId))
    .where(eq(promotionModel.id, promotionId))
    .limit(1)) as ResolvedPromotionContext[];
  return rows[0] ?? null;
}

/**
 * Resolve the promotion for a temp row. If the row already carries a
 * promotionId, trust it. If it doesn't (legacy Sem I rows), resolve by date
 * and assert Sem I; on a mismatch (a re-admitted student where the date-based
 * resolver picked a later Sem I record), fall back to the earliest Sem I
 * promotion for that student.
 */
async function resolveTempRowPromotion(
  temp: {
    id: number;
    studentId: number;
    promotionId: number | null;
    createdAt: Date | null;
  },
  executor: Executor = db,
): Promise<number | null> {
  if (temp.promotionId != null) return temp.promotionId;

  const asOf = temp.createdAt ?? new Date();
  const dated = await resolvePromotionForDate(temp.studentId, asOf);
  if (dated) {
    const ctx = await loadPromotionContext(dated.promotionId, executor);
    if (ctx && ctx.classId === SEMESTER_ONE_CLASS_ID) return dated.promotionId;
  }

  // Fallback: earliest Sem I promotion for this student by session start.
  const rows = (await executor
    .select({ id: promotionModel.id })
    .from(promotionModel)
    .innerJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
    .where(
      and(
        eq(promotionModel.studentId, temp.studentId),
        eq(promotionModel.classId, SEMESTER_ONE_CLASS_ID),
      ),
    )
    .orderBy(asc(sessionModel.from), asc(promotionModel.id))
    .limit(1)) as { id: number }[];
  return rows[0]?.id ?? null;
}

/**
 * Find or create a batch receipt for the University Admit Card distribution
 * of a given (academicYear, class). Same tuple across rows collapses to one
 * batch; each unique program course gets its own program-course-mapping row.
 *
 * On create: EXAM_LINKED enabled + ADMINISTRATIVE disabled mode rows (matches
 * the console create-dialog default from `createBatchReceipt`).
 *
 * `createdByUserId` is the user credited on batch/mode/course-mapping create.
 * For the backfill this is the migration's chosen system user; for the live
 * path it's the distributing staff.
 */
export async function resolveOrCreateAdmitCardBatch(
  args: {
    academicYearId: number;
    classId: number;
    className: string;
    academicYearLabel: string;
    programCourseId: number;
    createdByUserId: number;
  },
  executor: Executor,
): Promise<number> {
  const documentTypeId = await getDocumentTypeIdByCode(
    DOCUMENT_TYPE_CODES.EXAM_ADMIT_CARD,
    executor,
  );

  // Serialise the find-or-create per (year, class) so two concurrent boot
  // instances can't both create the same batch. pg advisory lock scoped to
  // the tx — releases automatically on commit/rollback.
  await executor.execute(
    sql`SELECT pg_advisory_xact_lock(918360, ${args.academicYearId * 100000 + args.classId})`,
  );

  const existing = (await executor
    .select({ id: documentBatchReceiptModel.id })
    .from(documentBatchReceiptModel)
    .where(
      and(
        eq(documentBatchReceiptModel.documentTypeId, documentTypeId),
        eq(documentBatchReceiptModel.academicYearId, args.academicYearId),
        eq(documentBatchReceiptModel.classId, args.classId),
        isNull(documentBatchReceiptModel.appearTypeId),
      ),
    )
    .limit(1)) as { id: number }[];

  const batchId =
    existing[0]?.id ??
    (
      await executor
        .insert(documentBatchReceiptModel)
        .values({
          documentTypeId,
          name: `${args.className} University Admit Card Distribution - ${args.academicYearLabel}`,
          academicYearId: args.academicYearId,
          classId: args.classId,
          appearTypeId: null,
          expectedArrivalDate: null,
          availableFromDate: null,
          documentsReceivedBy: null,
          documentsReceivedAt: null,
          isArchived: false,
          createdBy: args.createdByUserId,
          updatedBy: args.createdByUserId,
        })
        .returning({ id: documentBatchReceiptModel.id })
    )[0]?.id ??
    0;

  if (batchId === 0) throw new Error("failed to obtain a batch receipt id");

  // Ensure the two mode rows exist. First-time create needs them; a batch we
  // just found may already have them — the unique on (batch, mode) means we
  // must not blind-insert.
  await executor
    .insert(documentBatchReceiptModeModel)
    .values([
      {
        documentBatchReceiptModeId: batchId,
        mode: "EXAM_LINKED" as const,
        isEnabled: true,
      },
      {
        documentBatchReceiptModeId: batchId,
        mode: "ADMINISTRATIVE" as const,
        isEnabled: false,
      },
    ])
    .onConflictDoNothing();

  // Ensure this program course is in the batch's course set. No DB unique on
  // (batch, course), so guard with an existence check inside the same tx.
  const alreadyLinked = (await executor
    .select({ id: documentBatchReceiptProgramCourseModel.id })
    .from(documentBatchReceiptProgramCourseModel)
    .where(
      and(
        eq(
          documentBatchReceiptProgramCourseModel.documentBatchReceiptId,
          batchId,
        ),
        eq(
          documentBatchReceiptProgramCourseModel.programCourseId,
          args.programCourseId,
        ),
      ),
    )
    .limit(1)) as { id: number }[];
  if (alreadyLinked.length === 0) {
    await executor.insert(documentBatchReceiptProgramCourseModel).values({
      documentBatchReceiptId: batchId,
      programCourseId: args.programCourseId,
    });
  }

  return batchId;
}

/**
 * Insert the COLLECTED ledger row for a temp admit card distribution and
 * return its id. Timestamps are copied from the temp row so the passbook's
 * history reflects the actual handover moment, not this insert's clock.
 */
export async function insertAdmitCardLedgerRow(
  args: {
    promotionId: number;
    documentBatchReceiptId: number;
    providedByUserId: number;
    collectedAt: Date;
    createdAt?: Date | null;
    updatedAt?: Date | null;
  },
  executor: Executor,
): Promise<number> {
  const documentTypeId = await getDocumentTypeIdByCode(
    DOCUMENT_TYPE_CODES.EXAM_ADMIT_CARD,
    executor,
  );

  const [inserted] = (await executor
    .insert(documentLedgerModel)
    .values({
      documentTypeId,
      documentBatchReceiptId: args.documentBatchReceiptId,
      promotionId: args.promotionId,
      isSelfSourced: false,
      status: "COLLECTED",
      collectedAt: args.collectedAt,
      providedBy: args.providedByUserId,
      // Timestamps come from the temp row so the passbook shows the handover
      // moment, not the moment this backfill ran.
      createdAt: args.createdAt ?? args.collectedAt,
      updatedAt: args.updatedAt ?? args.collectedAt,
    })
    .returning({ id: documentLedgerModel.id })) as { id: number }[];
  return inserted.id;
}

/**
 * State-based backfill loop. Processes rows in id-order batches; for each row
 * inside a transaction: FOR-UPDATE-lock the temp row, re-check its
 * `document_ledger_id_fk`, resolve the promotion, find-or-create the batch,
 * insert the ledger row, back-link the FK. Two runners on the same row: the
 * loser sees the FK is now set and skips.
 */
export async function runTempAdmitCardLedgerBackfill(): Promise<
  Record<string, unknown>
> {
  let linked = 0;
  let skippedNoPromotion = 0;
  let failed = 0;

  for (;;) {
    const pending = await db
      .select({
        id: tempAdmitCardDistributionsModel.id,
        studentId: tempAdmitCardDistributionsModel.studentId,
        distributedByUserId:
          tempAdmitCardDistributionsModel.distributedByUserId,
        promotionId: tempAdmitCardDistributionsModel.promotionId,
        createdAt: tempAdmitCardDistributionsModel.createdAt,
        updatedAt: tempAdmitCardDistributionsModel.updatedAt,
      })
      .from(tempAdmitCardDistributionsModel)
      .where(isNull(tempAdmitCardDistributionsModel.documentLedgerId))
      .orderBy(asc(tempAdmitCardDistributionsModel.id))
      .limit(BATCH_SIZE);

    if (pending.length === 0) break;

    let progressedThisBatch = 0;
    for (const temp of pending) {
      try {
        const ledgerId = await db.transaction(async (tx) => {
          const [locked] = (await tx
            .select({
              documentLedgerId:
                tempAdmitCardDistributionsModel.documentLedgerId,
            })
            .from(tempAdmitCardDistributionsModel)
            .where(eq(tempAdmitCardDistributionsModel.id, temp.id))
            .for("update")) as { documentLedgerId: number | null }[];
          if (!locked || locked.documentLedgerId != null) return null;

          const promotionId = await resolveTempRowPromotion(temp, tx);
          if (promotionId == null) return null;

          const ctx = await loadPromotionContext(promotionId, tx);
          if (!ctx) return null;

          const batchId = await resolveOrCreateAdmitCardBatch(
            {
              academicYearId: ctx.academicYearId,
              classId: ctx.classId,
              className: ctx.className,
              academicYearLabel: ctx.academicYearLabel,
              programCourseId: ctx.programCourseId,
              createdByUserId: temp.distributedByUserId,
            },
            tx,
          );

          const newLedgerId = await insertAdmitCardLedgerRow(
            {
              promotionId,
              documentBatchReceiptId: batchId,
              providedByUserId: temp.distributedByUserId,
              collectedAt: temp.createdAt ?? new Date(),
              createdAt: temp.createdAt,
              updatedAt: temp.updatedAt,
            },
            tx,
          );

          await tx
            .update(tempAdmitCardDistributionsModel)
            .set({ documentLedgerId: newLedgerId })
            .where(eq(tempAdmitCardDistributionsModel.id, temp.id));

          return newLedgerId;
        });

        if (ledgerId == null) {
          skippedNoPromotion++;
        } else {
          linked++;
          progressedThisBatch++;
        }
      } catch (err) {
        failed++;
        log.warn(
          `temp_admit_card_distributions#${temp.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // Stop once a whole batch produced no links — the remaining rows are
    // stuck (no promotion / repeated failure) and would loop forever.
    if (progressedThisBatch === 0) break;
  }

  return { linked, skippedNoPromotion, failed };
}
