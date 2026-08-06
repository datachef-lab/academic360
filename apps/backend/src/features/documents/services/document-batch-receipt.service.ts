import { db } from "@/db/index.js";
import { createLogger } from "@/config/logger.js";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import {
  documentBatchReceiptModel,
  documentBatchReceiptModeModel,
  documentBatchReceiptProgramCourseModel,
  documentLedgerModel,
  documentTypeModel,
} from "@repo/db/schemas/models/documents";
import {
  academicYearModel,
  classModel,
} from "@repo/db/schemas/models/academics";
import { programCourseModel } from "@repo/db/schemas/models/course-design";
import { promotionModel } from "@repo/db/schemas/models/batches";
import { tempAdmitCardDistributionsModel } from "@repo/db/schemas/models/exams";
import { recomputeFeeClearanceForStudent } from "./fee-clearance.service.js";
import {
  DOCUMENT_TYPE_CODES,
  getDocumentTypeIdByCode,
} from "./document-ledger.service.js";
import { emitDocumentsEvent } from "./documents-realtime.service.js";

const log = createLogger("document-batch-receipt");

type Db = typeof db;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Executor = Db | Tx;

/**
 * Namespace for the per-batch generation lock. Combined with the batch id it
 * gives `pg_advisory_xact_lock(GENERATION_LOCK_NAMESPACE, batchId)` — a
 * transaction-scoped lock released automatically on commit or rollback.
 */
const GENERATION_LOCK_NAMESPACE = 918360;

export type BatchReceiptModeName = "EXAM_LINKED" | "ADMINISTRATIVE";

export type LedgerGenerationResult = {
  batchReceiptId: number;
  /** Promotions the batch's scope resolves to. */
  eligible: number;
  /** Ledger rows written by this run. */
  created: number;
  /** Promotions that already had a row for this batch. */
  alreadyPresent: number;
};

/**
 * Resolve the promotions a batch receipt covers.
 *
 * The batch names an academic year, a class and a set of program courses; the
 * promotions carrying that combination are the students the bundle is for.
 *
 * Two filters are not negotiable:
 * - `promotions.is_deprecated = false` — a shift change deprecates the old
 *   promotion but keeps it as history; billing a deprecated row would hand the
 *   document to a student under a batch they have left.
 * - `users.is_active = true` — the student must still be on the rolls.
 *
 * `appearTypeId` is applied ONLY when the batch sets one, and even then it is a
 * narrowing filter rather than a required join. Appear type is not a column on
 * `promotions` (it is commented out in the model); it lives on
 * `exam_form_fillup.appear_type_id_fk` and is reachable only through
 * `promotions.exam_form_fillup_id_fk`, which is set on 6,624 of 43,140
 * promotions — 2025-26 Semesters I and II only, and zero in Sem IV / VI. An
 * inner join on it would resolve an empty cohort for every current batch.
 */
export async function resolveBatchReceiptPromotionIds(
  batchReceiptId: number,
  executor: Executor = db,
): Promise<number[]> {
  const rows = (
    await executor.execute(sql`
      SELECT p.id
      FROM document_batch_receipts br
      JOIN sessions se        ON se.academic_id_fk = br.academic_year_id_fk
      JOIN promotions p       ON p.session_id_fk = se.id
                             AND p.class_id_fk  = br.class_id_fk
      JOIN students s         ON s.id = p.student_id_fk
      JOIN users u            ON u.id = s.user_id_fk
      WHERE br.id = ${batchReceiptId}
        AND COALESCE(p.is_deprecated, false) = false
        AND u.is_active = true
        AND EXISTS (
          SELECT 1 FROM document_batch_receipt_program_courses bpc
          WHERE bpc.document_batch_receipt_id_fk = br.id
            AND bpc.program_course_id_fk = p.program_course_id_fk
        )
        AND (
          br.appear_type_id_fk IS NULL
          OR EXISTS (
            SELECT 1 FROM exam_form_fillup eff
            WHERE eff.id = p.exam_form_fillup_id_fk
              AND eff.appear_type_id_fk = br.appear_type_id_fk
          )
        )
      ORDER BY p.id`)
  ).rows as unknown as { id: number }[];

  return rows.map((r) => Number(r.id));
}

/**
 * Create the batch's ledger entries — one PENDING row per promotion in scope.
 *
 * Called when the batch's **ADMINISTRATIVE** mode is enabled: that is the step
 * that says the bundle is ready to be handed out, so that is when a student
 * acquires something to collect. EXAM_LINKED records arrival and availability
 * and writes nothing to the ledger.
 *
 * **Idempotent without a unique constraint.** A promotion legitimately holds
 * several rows of the same type — an ID card issued, then reissued, then
 * renewed — so a unique on (batch, promotion) would block a reissue recorded
 * against the same bundle. Instead:
 *
 * - `pg_advisory_xact_lock(namespace, batchId)` serialises generation per
 *   batch, so two staff clicking at once cannot both pass the existence check.
 *   It is transaction-scoped: released on commit or rollback, never leaked.
 * - the insert filters on `NOT EXISTS (… same batch, same promotion)`, so a
 *   re-run creates nothing for promotions already covered.
 *
 * Re-running is therefore also the **top-up**: promotions created after the
 * first run (a late admission, a shift change producing a new promotion) get
 * their row on the next run without duplicating anyone else's.
 */
export async function generateLedgerEntriesForBatchReceipt(
  batchReceiptId: number,
  executor: Executor = db,
): Promise<LedgerGenerationResult> {
  const run = async (tx: Executor): Promise<LedgerGenerationResult> => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(${GENERATION_LOCK_NAMESPACE}, ${batchReceiptId})`,
    );

    const [batch] = await tx
      .select({
        id: documentBatchReceiptModel.id,
        documentTypeId: documentBatchReceiptModel.documentTypeId,
      })
      .from(documentBatchReceiptModel)
      .where(eq(documentBatchReceiptModel.id, batchReceiptId))
      .limit(1);

    if (!batch) {
      throw new Error(`Document batch receipt ${batchReceiptId} not found`);
    }

    const promotionIds = await resolveBatchReceiptPromotionIds(
      batchReceiptId,
      tx,
    );

    if (promotionIds.length === 0) {
      return {
        batchReceiptId,
        eligible: 0,
        created: 0,
        alreadyPresent: 0,
      };
    }

    // Insert straight from the resolved set so the existence check and the
    // insert are one statement — nothing can slip in between them.
    const inserted = (
      await tx.execute(sql`
        INSERT INTO document_ledger
          (document_type_id_fk, document_batch_receipt_id_fk, promotion_id_fk,
           is_self_sourced, status)
        SELECT ${batch.documentTypeId}, ${batchReceiptId}, p.id, false, 'PENDING'
        FROM unnest(${sql.raw(`ARRAY[${promotionIds.join(",")}]::int[]`)}) AS p(id)
        WHERE NOT EXISTS (
          SELECT 1 FROM document_ledger dl
          WHERE dl.document_batch_receipt_id_fk = ${batchReceiptId}
            AND dl.promotion_id_fk = p.id
        )
        RETURNING id`)
    ).rows as unknown as { id: number }[];

    // Fee-clearance recompute for every student that received a new PENDING
    // row. Uses one query per unique student rather than per row — the fee
    // predicate is per-student, not per-row. Runs inside the same tx so the
    // new rows and their final status commit atomically.
    if (inserted.length > 0) {
      const affected = (
        await tx.execute(sql`
          SELECT DISTINCT p.student_id_fk AS "studentId"
          FROM promotions p
          WHERE p.id IN (${sql.raw(promotionIds.join(","))})`)
      ).rows as unknown as { studentId: number }[];
      for (const { studentId } of affected) {
        await recomputeFeeClearanceForStudent(studentId, tx);
      }
    }

    return {
      batchReceiptId,
      eligible: promotionIds.length,
      created: inserted.length,
      alreadyPresent: promotionIds.length - inserted.length,
    };
  };

  // Only open a transaction when the caller has not already given us one — the
  // advisory lock must live in the SAME transaction as the insert.
  const result =
    executor === db
      ? await db.transaction((tx) => run(tx))
      : await run(executor);

  log.info(
    `batch ${batchReceiptId}: ${result.created} ledger rows created, ${result.alreadyPresent} already present of ${result.eligible} eligible`,
  );
  if (result.created > 0) {
    // Ledger rows changed — every dashboard on this batch, and every student
    // whose ledger just gained a PENDING row, should refresh.
    emitDocumentsEvent("documents:ledger:updated", {
      batchId: batchReceiptId,
      detail: { action: "generated", created: result.created },
    });
  }
  return result;
}

/**
 * Turn a batch's mode on or off.
 *
 * **Disabling never deletes ledger rows.** By the time a batch is switched off
 * some of its rows may already be COLLECTED, and a document that was handed to
 * a student is a fact, not a setting. Disabling only closes the distribution
 * gate; re-enabling later tops up rather than re-creating.
 *
 * **Ledger generation on ADMINISTRATIVE-enable is deferred.** The wiring is
 * kept in this file (see `generateLedgerEntriesForBatchReceipt`) — the trigger
 * is intentionally not called from here yet. Enabling the mode simply persists
 * the flag until the enable-criteria + generation UX lands.
 */
export async function setBatchReceiptMode(
  batchReceiptId: number,
  mode: BatchReceiptModeName,
  isEnabled: boolean,
  opts?: { notifyStudent?: boolean },
): Promise<{
  mode: BatchReceiptModeName;
  isEnabled: boolean;
  generation?: LedgerGenerationResult;
}> {
  return db
    .transaction(async (tx) => {
      // Once the batch has recorded (COLLECTED/UPLOADED) ledger rows, its
      // mode is fixed: flipping it now would break the semantics of a
      // handover that has already happened. `notifyStudent` remains editable
      // — that's just a preference, not scope-defining.
      if (opts?.notifyStudent === undefined) {
        const [{ recorded }] = (
          await tx.execute(sql`
          SELECT count(*)::int AS recorded FROM document_ledger
          WHERE document_batch_receipt_id_fk = ${batchReceiptId}
            AND status IN ('COLLECTED','UPLOADED')`)
        ).rows as unknown as { recorded: number }[];
        if (recorded > 0) {
          throw new Error(
            `This batch has ${recorded} recorded document(s) — the mode is fixed.`,
          );
        }
      }

      const [existing] = await tx
        .select({ id: documentBatchReceiptModeModel.id })
        .from(documentBatchReceiptModeModel)
        .where(
          and(
            eq(
              documentBatchReceiptModeModel.documentBatchReceiptModeId,
              batchReceiptId,
            ),
            eq(documentBatchReceiptModeModel.mode, mode),
          ),
        )
        .limit(1);

      if (existing) {
        await tx
          .update(documentBatchReceiptModeModel)
          .set({
            isEnabled,
            ...(opts?.notifyStudent === undefined
              ? {}
              : { notifyStudent: opts.notifyStudent }),
          })
          .where(eq(documentBatchReceiptModeModel.id, existing.id));
      } else {
        await tx.insert(documentBatchReceiptModeModel).values({
          documentBatchReceiptModeId: batchReceiptId,
          mode,
          isEnabled,
          notifyStudent: opts?.notifyStudent ?? false,
        });
      }

      // TODO: when the ADMINISTRATIVE-enable criteria are finalised, restore:
      //   if (mode === "ADMINISTRATIVE" && isEnabled) {
      //     const generation = await generateLedgerEntriesForBatchReceipt(batchReceiptId, tx);
      //     return { mode, isEnabled, generation };
      //   }
      return { mode, isEnabled };
    })
    .then((result) => {
      emitDocumentsEvent("documents:batch-receipt:updated", {
        batchId: batchReceiptId,
        detail: { action: "mode-changed", mode, isEnabled },
      });
      return result;
    });
}

/**
 * Count the active promotions a hypothetical scope would resolve to.
 *
 * Mirrors {@link resolveBatchReceiptPromotionIds}'s rules without needing a
 * saved batch — powers the live "N promotions match this scope" indicator in
 * the create/edit dialog. Filters:
 * - `promotions.is_deprecated = false` (a shift change deprecates the old row)
 * - `users.is_active = true`
 * - academic year → sessions → promotions (matched via `class_id_fk`)
 * - program courses (must be non-empty; otherwise scope is undefined and we
 *   return 0 rather than "all")
 *
 * `appear_type_id_fk` is intentionally not filtered — the dialog doesn't set
 * it, and applying it here would silently subset the count against a filter
 * the user cannot see.
 */
export async function computePromotionCountForScope(
  scope: {
    academicYearId: number | null;
    classId: number | null;
    programCourseIds: number[];
  },
  executor: Executor = db,
): Promise<number> {
  if (
    !scope.academicYearId ||
    !scope.classId ||
    scope.programCourseIds.length === 0
  ) {
    return 0;
  }
  const ids = [...new Set(scope.programCourseIds.map(Number))].filter(
    Number.isFinite,
  );
  if (ids.length === 0) return 0;

  const rows = (
    await executor.execute(sql`
      SELECT count(*)::int AS "count"
      FROM promotions p
      JOIN sessions se ON se.id = p.session_id_fk
      JOIN students s  ON s.id = p.student_id_fk
      JOIN users u     ON u.id = s.user_id_fk
      WHERE se.academic_id_fk = ${scope.academicYearId}
        AND p.class_id_fk    = ${scope.classId}
        AND p.program_course_id_fk IN (${sql.raw(ids.join(","))})
        AND COALESCE(p.is_deprecated, false) = false
        AND u.is_active = true`)
  ).rows as unknown as { count: number }[];

  return Number(rows[0]?.count ?? 0);
}

export type CreateBatchReceiptInput = {
  documentTypeId: number;
  name: string;
  academicYearId: number;
  classId: number;
  programCourseIds: number[];
  appearTypeId?: number | null;
  expectedArrivalDate?: Date | null;
  availableFromDate?: Date | null;
  documentsReceivedBy?: number | null;
  documentsReceivedAt?: Date | null;
  isArchived?: boolean;
};

/**
 * Create a batch receipt with both of its mode rows.
 *
 * Both modes are created up front so the console renders two toggles without
 * having to distinguish "off" from "not yet created", and because the table's
 * unique on (batch, mode) makes the pair the natural shape of a batch.
 *
 * **EXAM_LINKED opens enabled** — a bundle exists to record the university
 * handover, that step is part of *creating* the batch. **ADMINISTRATIVE opens
 * disabled** — enabling it is what says "ready to distribute", a later
 * decision.
 */
export async function createBatchReceipt(
  input: CreateBatchReceiptInput,
  userId: number,
): Promise<{ id: number }> {
  if (!input.programCourseIds?.length) {
    throw new Error("At least one program course is required");
  }

  return db
    .transaction(async (tx) => {
      const [batch] = await tx
        .insert(documentBatchReceiptModel)
        .values({
          documentTypeId: input.documentTypeId,
          name: input.name.trim(),
          academicYearId: input.academicYearId,
          classId: input.classId,
          appearTypeId: input.appearTypeId ?? null,
          expectedArrivalDate: input.expectedArrivalDate ?? null,
          availableFromDate: input.availableFromDate ?? null,
          documentsReceivedBy: input.documentsReceivedBy ?? null,
          documentsReceivedAt: input.documentsReceivedAt ?? null,
          isArchived: input.isArchived ?? false,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning({ id: documentBatchReceiptModel.id });

      await tx.insert(documentBatchReceiptProgramCourseModel).values(
        [...new Set(input.programCourseIds)].map((programCourseId) => ({
          documentBatchReceiptId: batch.id,
          programCourseId,
        })),
      );

      await tx.insert(documentBatchReceiptModeModel).values([
        {
          documentBatchReceiptModeId: batch.id,
          mode: "EXAM_LINKED" as const,
          isEnabled: true,
        },
        {
          documentBatchReceiptModeId: batch.id,
          mode: "ADMINISTRATIVE" as const,
          isEnabled: false,
        },
      ]);

      return { id: batch.id };
    })
    .then((result) => {
      emitDocumentsEvent("documents:batch-receipt:updated", {
        batchId: result.id,
        detail: { action: "created" },
      });
      return result;
    });
}

export type UpdateBatchReceiptInput = Partial<CreateBatchReceiptInput>;

/**
 * Edit a batch.
 *
 * **Scope columns freeze once entries exist.** `documentTypeId`,
 * `academicYearId` and `classId` decide which promotions the batch covers and
 * what type its rows carry. Changing them after generation would leave the
 * already-written ledger rows describing the old scope, with nothing to
 * reconcile them — generation only ever adds. So once the batch has ledger
 * rows those three are rejected; everything else (name, dates, received-by,
 * appear type, program courses) stays editable.
 *
 * Program courses are replaced wholesale. Adding one widens the scope and the
 * next generate tops it up; removing one does NOT delete rows already written
 * for that course, for the same reason a collected document cannot be undone.
 */
export async function updateBatchReceipt(
  batchReceiptId: number,
  input: UpdateBatchReceiptInput,
  userId: number,
): Promise<{ id: number }> {
  return db
    .transaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: documentBatchReceiptModel.id,
          documentTypeId: documentBatchReceiptModel.documentTypeId,
          academicYearId: documentBatchReceiptModel.academicYearId,
          classId: documentBatchReceiptModel.classId,
        })
        .from(documentBatchReceiptModel)
        .where(eq(documentBatchReceiptModel.id, batchReceiptId))
        .limit(1);

      if (!existing) {
        throw new Error(`Document batch receipt ${batchReceiptId} not found`);
      }

      // `recorded` (COLLECTED/UPLOADED) is the stronger of two locks: once a
      // handover exists, doc type / academic year / class are permanently
      // fixed for the batch (they define which students that handover
      // belongs to). PENDING-only rows are a weaker version that still
      // prevents scope changes to keep the derivation stable.
      const [{ ledgerRows, recorded }] = (
        await tx.execute(sql`
        SELECT
          count(*)::int                                             AS "ledgerRows",
          count(*) FILTER (WHERE status IN ('COLLECTED','UPLOADED'))::int AS "recorded"
        FROM document_ledger
        WHERE document_batch_receipt_id_fk = ${batchReceiptId}`)
      ).rows as unknown as { ledgerRows: number; recorded: number }[];

      if (ledgerRows > 0) {
        const changesScope =
          (input.documentTypeId != null &&
            Number(input.documentTypeId) !== existing.documentTypeId) ||
          (input.academicYearId != null &&
            Number(input.academicYearId) !== existing.academicYearId) ||
          (input.classId != null && Number(input.classId) !== existing.classId);

        if (changesScope) {
          throw new Error(
            recorded > 0
              ? `This batch has ${recorded} recorded document(s) — the document type, academic year and class are fixed.`
              : `This batch already has ${ledgerRows} ledger entries — the document type, academic year and class can no longer be changed.`,
          );
        }
      }

      await tx
        .update(documentBatchReceiptModel)
        .set({
          ...(input.name === undefined ? {} : { name: input.name.trim() }),
          ...(input.documentTypeId === undefined
            ? {}
            : { documentTypeId: Number(input.documentTypeId) }),
          ...(input.academicYearId === undefined
            ? {}
            : { academicYearId: Number(input.academicYearId) }),
          ...(input.classId === undefined
            ? {}
            : { classId: Number(input.classId) }),
          ...(input.appearTypeId === undefined
            ? {}
            : { appearTypeId: input.appearTypeId ?? null }),
          ...(input.expectedArrivalDate === undefined
            ? {}
            : { expectedArrivalDate: input.expectedArrivalDate ?? null }),
          ...(input.availableFromDate === undefined
            ? {}
            : { availableFromDate: input.availableFromDate ?? null }),
          ...(input.documentsReceivedBy === undefined
            ? {}
            : { documentsReceivedBy: input.documentsReceivedBy ?? null }),
          ...(input.documentsReceivedAt === undefined
            ? {}
            : { documentsReceivedAt: input.documentsReceivedAt ?? null }),
          ...(input.isArchived === undefined
            ? {}
            : { isArchived: Boolean(input.isArchived) }),
          updatedBy: userId,
        })
        .where(eq(documentBatchReceiptModel.id, batchReceiptId));

      if (input.programCourseIds?.length) {
        const newIds = new Set(
          [...new Set(input.programCourseIds)].map((c) => Number(c)),
        );

        // Which courses are currently mapped, and which of them are being
        // dropped? A course with any COLLECTED/UPLOADED ledger row cannot
        // be removed — its removal would sever the batch from a real
        // handover. A course whose only rows are PENDING is safe to drop:
        // we cascade-delete those PENDING rows so no orphans remain.
        const currentMap = await tx
          .select({
            programCourseId:
              documentBatchReceiptProgramCourseModel.programCourseId,
          })
          .from(documentBatchReceiptProgramCourseModel)
          .where(
            eq(
              documentBatchReceiptProgramCourseModel.documentBatchReceiptId,
              batchReceiptId,
            ),
          );
        const removedIds = currentMap
          .map((r) => r.programCourseId)
          .filter((id) => !newIds.has(id));

        if (removedIds.length) {
          // Refuse removal of any course that has recorded ledger rows.
          const blockers = (
            await tx.execute(sql`
            SELECT p.program_course_id_fk AS "programCourseId",
                   count(*)::int          AS "recorded"
            FROM document_ledger dl
            INNER JOIN promotions p ON p.id = dl.promotion_id_fk
            WHERE dl.document_batch_receipt_id_fk = ${batchReceiptId}
              AND p.program_course_id_fk IN (${sql.raw(removedIds.join(","))})
              AND dl.status IN ('COLLECTED','UPLOADED')
            GROUP BY p.program_course_id_fk`)
          ).rows as unknown as {
            programCourseId: number;
            recorded: number;
          }[];
          if (blockers.length) {
            const names = blockers
              .map((b) => `program course ${b.programCourseId} (${b.recorded})`)
              .join(", ");
            throw new Error(
              `Cannot remove course${blockers.length === 1 ? "" : "s"} with recorded handovers: ${names}. Un-collect / re-issue those first.`,
            );
          }

          // Safe to drop — delete the PENDING ledger rows for the removed
          // courses so no rows sit orphaned once the mapping is gone.
          await tx.execute(sql`
          DELETE FROM document_ledger
          WHERE id IN (
            SELECT dl.id FROM document_ledger dl
            INNER JOIN promotions p ON p.id = dl.promotion_id_fk
            WHERE dl.document_batch_receipt_id_fk = ${batchReceiptId}
              AND p.program_course_id_fk IN (${sql.raw(removedIds.join(","))})
              AND dl.status = 'PENDING'
          )`);
        }

        await tx
          .delete(documentBatchReceiptProgramCourseModel)
          .where(
            eq(
              documentBatchReceiptProgramCourseModel.documentBatchReceiptId,
              batchReceiptId,
            ),
          );
        await tx.insert(documentBatchReceiptProgramCourseModel).values(
          [...newIds].map((programCourseId) => ({
            documentBatchReceiptId: batchReceiptId,
            programCourseId,
          })),
        );
      }

      return { id: batchReceiptId };
    })
    .then((result) => {
      emitDocumentsEvent("documents:batch-receipt:updated", {
        batchId: result.id,
        detail: { action: "updated" },
      });
      return result;
    });
}

/**
 * Delete a batch and everything that hangs off it.
 *
 * **Refused once anything has been collected.** A handover is a fact about a
 * student, not a setting — deleting the batch would erase the only record that
 * they received the document. Undistributed (PENDING) rows go with the batch,
 * because they are just the expectation the batch created.
 */
export async function deleteBatchReceipt(batchReceiptId: number): Promise<{
  deleted: boolean;
  removedLedgerRows: number;
}> {
  return db
    .transaction(async (tx) => {
      const [{ collected }] = (
        await tx.execute(sql`
        SELECT count(*)::int AS collected FROM document_ledger
        WHERE document_batch_receipt_id_fk = ${batchReceiptId}
          AND status <> 'PENDING'`)
      ).rows as unknown as { collected: number }[];

      if (collected > 0) {
        throw new Error(
          `This batch has ${collected} document(s) already collected or acted on — it cannot be deleted.`,
        );
      }

      const removed = await tx
        .delete(documentLedgerModel)
        .where(eq(documentLedgerModel.documentBatchReceiptId, batchReceiptId))
        .returning({ id: documentLedgerModel.id });

      await tx
        .delete(documentBatchReceiptModeModel)
        .where(
          eq(
            documentBatchReceiptModeModel.documentBatchReceiptModeId,
            batchReceiptId,
          ),
        );
      await tx
        .delete(documentBatchReceiptProgramCourseModel)
        .where(
          eq(
            documentBatchReceiptProgramCourseModel.documentBatchReceiptId,
            batchReceiptId,
          ),
        );
      await tx
        .delete(documentBatchReceiptModel)
        .where(eq(documentBatchReceiptModel.id, batchReceiptId));

      return { deleted: true, removedLedgerRows: removed.length };
    })
    .then((result) => {
      emitDocumentsEvent("documents:batch-receipt:updated", {
        batchId: batchReceiptId,
        detail: { action: "deleted" },
      });
      return result;
    });
}

export type BatchReceiptListRow = {
  id: number;
  name: string;
  documentTypeId: number;
  documentTypeName: string;
  academicYearId: number;
  academicYear: string;
  classId: number;
  className: string;
  appearTypeId: number | null;
  /** Ids as well as names: the edit form needs to preselect, not string-match. */
  programCourseIds: number[];
  programCourses: string[];
  expectedArrivalDate: Date | null;
  availableFromDate: Date | null;
  documentsReceivedAt: Date | null;
  isArchived: boolean;
  modes: Array<{
    mode: BatchReceiptModeName;
    isEnabled: boolean;
    notifyStudent: boolean;
  }>;
  /**
   * `total`   — every ledger row under this batch, any status.
   * `pending` — status = PENDING.
   * `collected` — status = COLLECTED.
   * `recorded` — status in (COLLECTED, UPLOADED). Any row here means the
   *              scope-narrowing dropdowns and the exam-linked toggle are
   *              locked in the edit dialog: changing them could orphan a
   *              real handover.
   */
  ledger: {
    /**
     * Live count of active promotions this batch currently covers —
     * students in scope right now, regardless of whether a ledger row
     * has been materialised yet. This is the denominator staff reason
     * about ("how many students the bundle is for").
     */
    eligible: number;
    /** Ledger rows materialised for this batch, across all statuses. */
    total: number;
    pending: number;
    collected: number;
    recorded: number;
  };
  /**
   * Per-program-course recorded (COLLECTED/UPLOADED) counts. Used by the
   * edit dialog: a course whose count is > 0 has locked-in handovers and
   * cannot be unchecked. Undefined for a course with zero recorded rows.
   */
  recordedByProgramCourseId: Record<number, number>;
};

/** One row per batch, with its modes, courses and live ledger counts. */
export async function listBatchReceipts(filters?: {
  academicYearId?: number;
  documentTypeId?: number;
}): Promise<BatchReceiptListRow[]> {
  const where = [
    filters?.academicYearId
      ? eq(documentBatchReceiptModel.academicYearId, filters.academicYearId)
      : undefined,
    filters?.documentTypeId
      ? eq(documentBatchReceiptModel.documentTypeId, filters.documentTypeId)
      : undefined,
  ].filter(Boolean);

  const batches = await db
    .select({
      id: documentBatchReceiptModel.id,
      name: documentBatchReceiptModel.name,
      documentTypeId: documentBatchReceiptModel.documentTypeId,
      documentTypeName: documentTypeModel.name,
      academicYearId: documentBatchReceiptModel.academicYearId,
      academicYear: academicYearModel.year,
      classId: documentBatchReceiptModel.classId,
      className: classModel.name,
      appearTypeId: documentBatchReceiptModel.appearTypeId,
      expectedArrivalDate: documentBatchReceiptModel.expectedArrivalDate,
      availableFromDate: documentBatchReceiptModel.availableFromDate,
      documentsReceivedAt: documentBatchReceiptModel.documentsReceivedAt,
      isArchived: documentBatchReceiptModel.isArchived,
    })
    .from(documentBatchReceiptModel)
    .innerJoin(
      documentTypeModel,
      eq(documentTypeModel.id, documentBatchReceiptModel.documentTypeId),
    )
    .innerJoin(
      academicYearModel,
      eq(academicYearModel.id, documentBatchReceiptModel.academicYearId),
    )
    .innerJoin(classModel, eq(classModel.id, documentBatchReceiptModel.classId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(documentBatchReceiptModel.id));

  if (!batches.length) return [];
  const ids = batches.map((b) => b.id);

  // Live eligible-scope count per batch — resolves each batch's scope
  // against active promotions right now, independent of what has been
  // materialised into document_ledger. Same predicates as
  // `resolveBatchReceiptPromotionIds` (is_deprecated=false, user active,
  // program-course match, appear-type when set), just aggregated.
  const eligibleByBatch = (
    await db.execute(sql`
      SELECT br.id AS batch_id, count(*)::int AS eligible
      FROM document_batch_receipts br
      JOIN sessions se ON se.academic_id_fk = br.academic_year_id_fk
      JOIN promotions p ON p.session_id_fk = se.id
                       AND p.class_id_fk  = br.class_id_fk
      JOIN students s  ON s.id = p.student_id_fk
      JOIN users u     ON u.id = s.user_id_fk
      WHERE br.id = ANY(${sql.raw(`ARRAY[${ids.join(",")}]::int[]`)})
        AND COALESCE(p.is_deprecated, false) = false
        AND u.is_active = true
        AND EXISTS (
          SELECT 1 FROM document_batch_receipt_program_courses bpc
          WHERE bpc.document_batch_receipt_id_fk = br.id
            AND bpc.program_course_id_fk = p.program_course_id_fk
        )
        AND (
          br.appear_type_id_fk IS NULL
          OR EXISTS (
            SELECT 1 FROM exam_form_fillup eff
            WHERE eff.id = p.exam_form_fillup_id_fk
              AND eff.appear_type_id_fk = br.appear_type_id_fk
          )
        )
      GROUP BY br.id`)
  ).rows as unknown as { batch_id: number; eligible: number }[];
  const eligibleMap = new Map<number, number>(
    eligibleByBatch.map((r) => [Number(r.batch_id), Number(r.eligible)]),
  );

  const [courses, modes, counts, recordedByCourse] = await Promise.all([
    db
      .select({
        batchId: documentBatchReceiptProgramCourseModel.documentBatchReceiptId,
        programCourseId: documentBatchReceiptProgramCourseModel.programCourseId,
        name: programCourseModel.name,
      })
      .from(documentBatchReceiptProgramCourseModel)
      .innerJoin(
        programCourseModel,
        eq(
          programCourseModel.id,
          documentBatchReceiptProgramCourseModel.programCourseId,
        ),
      )
      .where(
        inArray(
          documentBatchReceiptProgramCourseModel.documentBatchReceiptId,
          ids,
        ),
      ),
    db
      .select({
        batchId: documentBatchReceiptModeModel.documentBatchReceiptModeId,
        mode: documentBatchReceiptModeModel.mode,
        isEnabled: documentBatchReceiptModeModel.isEnabled,
        notifyStudent: documentBatchReceiptModeModel.notifyStudent,
      })
      .from(documentBatchReceiptModeModel)
      .where(
        inArray(documentBatchReceiptModeModel.documentBatchReceiptModeId, ids),
      ),
    db
      .select({
        batchId: documentLedgerModel.documentBatchReceiptId,
        status: documentLedgerModel.status,
        count: sql<number>`count(*)::int`,
      })
      .from(documentLedgerModel)
      .where(inArray(documentLedgerModel.documentBatchReceiptId, ids))
      .groupBy(
        documentLedgerModel.documentBatchReceiptId,
        documentLedgerModel.status,
      ),
    // Per-program-course "recorded" (COLLECTED or UPLOADED) count. Joined
    // via promotion → program_course, so a batch that spans multiple
    // program courses gets one row per course. The edit dialog uses this
    // to disable the checkbox for any course with recorded handovers.
    db
      .select({
        batchId: documentLedgerModel.documentBatchReceiptId,
        programCourseId: promotionModel.programCourseId,
        count: sql<number>`count(*)::int`,
      })
      .from(documentLedgerModel)
      .innerJoin(
        promotionModel,
        eq(promotionModel.id, documentLedgerModel.promotionId),
      )
      .where(
        and(
          inArray(documentLedgerModel.documentBatchReceiptId, ids),
          inArray(documentLedgerModel.status, [
            "COLLECTED" as const,
            "UPLOADED" as const,
          ]),
        ),
      )
      .groupBy(
        documentLedgerModel.documentBatchReceiptId,
        promotionModel.programCourseId,
      ),
  ]);

  return batches.map((b) => {
    const own = counts.filter((c) => c.batchId === b.id);
    return {
      ...b,
      programCourseIds: courses
        .filter((c) => c.batchId === b.id)
        .map((c) => c.programCourseId),
      programCourses: courses
        .filter((c) => c.batchId === b.id)
        .map((c) => c.name ?? "")
        .filter(Boolean),
      modes: modes
        .filter((m) => m.batchId === b.id)
        .map((m) => ({
          mode: m.mode as BatchReceiptModeName,
          isEnabled: m.isEnabled ?? false,
          notifyStudent: m.notifyStudent ?? false,
        })),
      ledger: {
        eligible: eligibleMap.get(b.id) ?? 0,
        total: own.reduce((a, c) => a + Number(c.count), 0),
        pending: own
          .filter((c) => c.status === "PENDING")
          .reduce((a, c) => a + Number(c.count), 0),
        collected: own
          .filter((c) => c.status === "COLLECTED")
          .reduce((a, c) => a + Number(c.count), 0),
        recorded: own
          .filter((c) => c.status === "COLLECTED" || c.status === "UPLOADED")
          .reduce((a, c) => a + Number(c.count), 0),
      },
      recordedByProgramCourseId: recordedByCourse
        .filter((r) => r.batchId === b.id)
        .reduce<Record<number, number>>((acc, r) => {
          acc[r.programCourseId] = Number(r.count);
          return acc;
        }, {}),
    };
  });
}

/**
 * Hand a document over: the ledger row moves PENDING -> COLLECTED.
 *
 * This is the whole of "distribution" — the ledger row IS the record, so there
 * is no second table to keep in step.
 *
 * Guarded so a double-tap at the counter cannot re-stamp an earlier handover:
 * the update matches on `status = 'PENDING'`, and a row already COLLECTED
 * returns `{ alreadyCollected: true }` with its original `collectedAt` rather
 * than overwriting it.
 */
export async function markLedgerEntryCollected(
  ledgerId: number,
  collectedByUserId: number,
): Promise<{
  ledgerId: number;
  collected: boolean;
  alreadyCollected: boolean;
  collectedAt: Date | null;
}> {
  // Captured inside the tx and read after commit so the realtime emit can
  // scope to the exact student + batch the row belongs to. Null for the
  // "already collected" fast path — no emit needed there.
  let emitContext: { batchId: number | null; studentId: number | null } | null =
    null;
  const result = await db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        id: documentLedgerModel.id,
        status: documentLedgerModel.status,
        collectedAt: documentLedgerModel.collectedAt,
        documentTypeId: documentLedgerModel.documentTypeId,
        promotionId: documentLedgerModel.promotionId,
        batchId: documentLedgerModel.documentBatchReceiptId,
      })
      .from(documentLedgerModel)
      .where(eq(documentLedgerModel.id, ledgerId))
      .for("update")
      .limit(1);

    if (!current) throw new Error(`Ledger entry ${ledgerId} not found`);

    if (current.status === "COLLECTED") {
      return {
        ledgerId,
        collected: false,
        alreadyCollected: true,
        collectedAt: current.collectedAt,
      };
    }

    const collectedAt = new Date();
    await tx
      .update(documentLedgerModel)
      .set({
        status: "COLLECTED",
        collectedAt,
        providedBy: collectedByUserId,
      })
      .where(eq(documentLedgerModel.id, ledgerId));

    // Resolve the student for the realtime scope while we're already in the
    // hot path. Same join the admit-card branch uses below — reuse the row.
    const [promoRow] = await tx
      .select({ studentId: promotionModel.studentId })
      .from(promotionModel)
      .where(eq(promotionModel.id, current.promotionId))
      .limit(1);
    emitContext = {
      batchId: current.batchId ?? null,
      studentId: promoRow?.studentId ?? null,
    };

    // Reverse projection to the legacy temp_admit_card_distributions table so
    // the two systems stay in step for exam admit card handovers.
    // - Only applies when this ledger row's document type is EXAM_ADMIT_CARD.
    // - Dedupes on (studentId, promotionId) — same rule the admit-card service
    //   applies to its own inserts.
    const examAdmitCardTypeId = await getDocumentTypeIdByCode(
      DOCUMENT_TYPE_CODES.EXAM_ADMIT_CARD,
      tx,
    );
    if (
      current.documentTypeId === examAdmitCardTypeId &&
      promoRow?.studentId != null
    ) {
      const [existingTemp] = await tx
        .select({ id: tempAdmitCardDistributionsModel.id })
        .from(tempAdmitCardDistributionsModel)
        .where(
          and(
            eq(tempAdmitCardDistributionsModel.studentId, promoRow.studentId),
            eq(
              tempAdmitCardDistributionsModel.promotionId,
              current.promotionId,
            ),
          ),
        )
        .limit(1);
      if (!existingTemp) {
        await tx.insert(tempAdmitCardDistributionsModel).values({
          studentId: promoRow.studentId,
          distributedByUserId: collectedByUserId,
          promotionId: current.promotionId,
          documentLedgerId: ledgerId,
        });
      }
    }

    return { ledgerId, collected: true, alreadyCollected: false, collectedAt };
  });

  if (emitContext) {
    emitDocumentsEvent("documents:ledger:updated", {
      batchId: emitContext.batchId,
      studentId: emitContext.studentId,
      detail: { action: "collected", ledgerId },
    });
  }
  return result;
}
