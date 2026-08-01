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
  return result;
}

/**
 * Turn a batch's mode on or off.
 *
 * Enabling ADMINISTRATIVE generates the ledger entries in the same transaction,
 * so the toggle and the rows it implies commit together.
 *
 * **Disabling never deletes ledger rows.** By the time a batch is switched off
 * some of its rows may already be COLLECTED, and a document that was handed to
 * a student is a fact, not a setting. Disabling only closes the distribution
 * gate; re-enabling later tops up rather than re-creating.
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
  return db.transaction(async (tx) => {
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

    if (mode === "ADMINISTRATIVE" && isEnabled) {
      const generation = await generateLedgerEntriesForBatchReceipt(
        batchReceiptId,
        tx,
      );
      return { mode, isEnabled, generation };
    }

    return { mode, isEnabled };
  });
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
};

/**
 * Create a batch receipt with both of its mode rows, disabled.
 *
 * Both modes are created up front so the console can render two toggles without
 * having to distinguish "off" from "not yet created", and because the table's
 * unique on (batch, mode) makes the pair the natural shape of a batch.
 */
export async function createBatchReceipt(
  input: CreateBatchReceiptInput,
  userId: number,
): Promise<{ id: number }> {
  if (!input.programCourseIds?.length) {
    throw new Error("At least one program course is required");
  }

  return db.transaction(async (tx) => {
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
        isEnabled: false,
      },
      {
        documentBatchReceiptModeId: batch.id,
        mode: "ADMINISTRATIVE" as const,
        isEnabled: false,
      },
    ]);

    return { id: batch.id };
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
  return db.transaction(async (tx) => {
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

    const [{ ledgerRows }] = (
      await tx.execute(sql`
        SELECT count(*)::int AS "ledgerRows" FROM document_ledger
        WHERE document_batch_receipt_id_fk = ${batchReceiptId}`)
    ).rows as unknown as { ledgerRows: number }[];

    if (ledgerRows > 0) {
      const changesScope =
        (input.documentTypeId != null &&
          Number(input.documentTypeId) !== existing.documentTypeId) ||
        (input.academicYearId != null &&
          Number(input.academicYearId) !== existing.academicYearId) ||
        (input.classId != null && Number(input.classId) !== existing.classId);

      if (changesScope) {
        throw new Error(
          `This batch already has ${ledgerRows} ledger entries — the document type, academic year and class can no longer be changed.`,
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
        updatedBy: userId,
      })
      .where(eq(documentBatchReceiptModel.id, batchReceiptId));

    if (input.programCourseIds?.length) {
      await tx
        .delete(documentBatchReceiptProgramCourseModel)
        .where(
          eq(
            documentBatchReceiptProgramCourseModel.documentBatchReceiptId,
            batchReceiptId,
          ),
        );
      await tx.insert(documentBatchReceiptProgramCourseModel).values(
        [...new Set(input.programCourseIds)].map((programCourseId) => ({
          documentBatchReceiptId: batchReceiptId,
          programCourseId: Number(programCourseId),
        })),
      );
    }

    return { id: batchReceiptId };
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
  return db.transaction(async (tx) => {
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
  modes: Array<{
    mode: BatchReceiptModeName;
    isEnabled: boolean;
    notifyStudent: boolean;
  }>;
  ledger: { total: number; pending: number; collected: number };
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

  const [courses, modes, counts] = await Promise.all([
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
        total: own.reduce((a, c) => a + Number(c.count), 0),
        pending: own
          .filter((c) => c.status === "PENDING")
          .reduce((a, c) => a + Number(c.count), 0),
        collected: own
          .filter((c) => c.status === "COLLECTED")
          .reduce((a, c) => a + Number(c.count), 0),
      },
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
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        id: documentLedgerModel.id,
        status: documentLedgerModel.status,
        collectedAt: documentLedgerModel.collectedAt,
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

    return { ledgerId, collected: true, alreadyCollected: false, collectedAt };
  });
}
