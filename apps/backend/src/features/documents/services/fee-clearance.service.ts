// Reactive rule: `document_ledger` rows whose type carries
// `requires_fee_clearance = true` flip between PENDING and ON_HOLD based on
// whether the student has any outstanding fee mapping. Read-only against the
// fee tables; writes only to `document_ledger.status`.
//
// Only PENDING/ON_HOLD rows are ever touched — COLLECTED / UPLOADED / WAIVED
// / EXPECTED / NO_CHANGE are facts (or explicit terminal states) and must
// never be reverted by the automation.

import { sql } from "drizzle-orm";
import { db } from "@/db/index.js";
import { createLogger } from "@/config/logger.js";

const log = createLogger("fee-clearance");

type Db = typeof db;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Executor = Db | Tx;

export type FeeClearanceResult = {
  studentId: number;
  hasOutstanding: boolean;
  onHold: number;
  released: number;
};

/**
 * True when at least one fee_student_mappings row for the student is
 * (a) not fully waived, and (b) still has an unpaid balance:
 *   `totalPayable - COALESCE(amountPaid, 0) - COALESCE(waivedOffAmount, 0) > 0`.
 *
 * Exported so other surfaces (UI badges, dashboards) can reuse the exact
 * predicate rather than reinventing it and drifting.
 */
export async function hasOutstandingFees(
  studentId: number,
  executor: Executor = db,
): Promise<boolean> {
  const res = await executor.execute(sql`
    SELECT EXISTS (
      SELECT 1 FROM fee_student_mappings fsm
      WHERE fsm.student_id_fk = ${studentId}
        AND COALESCE(fsm.is_waived_off, false) = false
        AND (fsm.total_payable
             - COALESCE(fsm.amount_paid, 0)
             - COALESCE(fsm.waived_off_amount, 0)) > 0
    ) AS outstanding`);
  const row = res.rows[0] as { outstanding: boolean } | undefined;
  return Boolean(row?.outstanding);
}

/**
 * Bring a single student's fee-gated ledger rows in line with their current
 * fee balance. Idempotent — re-running with no change resolves to
 * `{ onHold: 0, released: 0 }`.
 *
 * Runs two focused UPDATE ... FROM statements rather than a per-row loop:
 * one to place holds when outstanding, one to release when clear. The FROM
 * joins pull `documentType.requires_fee_clearance` and `promotions.student_id_fk`
 * so the WHERE clause can filter on both without a subselect.
 */
export async function recomputeFeeClearanceForStudent(
  studentId: number,
  executor: Executor = db,
): Promise<FeeClearanceResult> {
  const outstanding = await hasOutstandingFees(studentId, executor);

  if (outstanding) {
    const res = await executor.execute(sql`
      UPDATE document_ledger dl
      SET status = 'ON_HOLD', updated_at = now()
      FROM document_types dt, promotions p
      WHERE dl.document_type_id_fk = dt.id
        AND dl.promotion_id_fk = p.id
        AND p.student_id_fk = ${studentId}
        AND dt.requires_fee_clearance = true
        AND dl.status = 'PENDING'`);
    const onHold = res.rowCount ?? 0;
    if (onHold > 0) {
      log.info(
        `student ${studentId}: placed ${onHold} fee-gated ledger row(s) ON_HOLD`,
      );
    }
    return { studentId, hasOutstanding: true, onHold, released: 0 };
  }

  const res = await executor.execute(sql`
    UPDATE document_ledger dl
    SET status = 'PENDING', updated_at = now()
    FROM document_types dt, promotions p
    WHERE dl.document_type_id_fk = dt.id
      AND dl.promotion_id_fk = p.id
      AND p.student_id_fk = ${studentId}
      AND dt.requires_fee_clearance = true
      AND dl.status = 'ON_HOLD'`);
  const released = res.rowCount ?? 0;
  if (released > 0) {
    log.info(
      `student ${studentId}: released ${released} fee-gated ledger row(s) from ON_HOLD → PENDING`,
    );
  }
  return { studentId, hasOutstanding: false, onHold: 0, released };
}

/**
 * Trigger hook for fee/payment write sites — thin wrapper around
 * {@link recomputeFeeClearanceForStudent} so the payments and fees code
 * doesn't have to know the internal recompute name and split behaviour.
 *
 * Call rules:
 * - Inside a `db.transaction(...)` (cash + manual-online marking, waiver
 *   PATCH, slab reassign): pass the tx as `executor` so the recompute
 *   commits atomically with the fee write.
 * - After a transaction commits (gateway SUCCESS callback etc.): call
 *   unwrapped — the recompute opens its own connection and sees the
 *   just-committed row.
 * - Bulk sites (fee-structure / fee-group / fee-category recalcs) should
 *   dedupe studentIds via a `Set<number>` per invocation and iterate once
 *   per unique student.
 */
export async function onFeePaymentApplied(
  studentId: number,
  executor: Executor = db,
): Promise<FeeClearanceResult> {
  return recomputeFeeClearanceForStudent(studentId, executor);
}

/**
 * Called when a `document_types.requires_fee_clearance` flag flips — walks
 * every student who currently holds a PENDING or ON_HOLD row of that type
 * and recomputes their status. Two direction reasons this is needed:
 * flag ON → previously-PENDING rows may need to move to ON_HOLD;
 * flag OFF → previously-ON_HOLD rows should return to PENDING (the fee
 * predicate is now irrelevant for this type, so ON_HOLD is stale).
 *
 * Uses per-student recompute so the same code path handles both directions
 * — its UPDATE already filters on `requires_fee_clearance = true`, and a
 * type whose flag has just gone OFF will not match, so those rows are
 * released via a companion query below.
 */
export async function recomputeFeeClearanceForDocumentType(
  documentTypeId: number,
  executor: Executor = db,
): Promise<{
  studentsScanned: number;
  onHold: number;
  released: number;
}> {
  const students = (
    await executor.execute(sql`
      SELECT DISTINCT p.student_id_fk AS "studentId"
      FROM document_ledger dl
      JOIN promotions p ON p.id = dl.promotion_id_fk
      WHERE dl.document_type_id_fk = ${documentTypeId}
        AND dl.status IN ('PENDING', 'ON_HOLD')`)
  ).rows as unknown as { studentId: number }[];

  // Companion release: if the flag is currently OFF, per-student recompute
  // won't touch existing ON_HOLD rows (the WHERE requires the flag to be
  // ON). Release them explicitly.
  const flagRow = (
    await executor.execute(sql`
      SELECT requires_fee_clearance AS req
      FROM document_types WHERE id = ${documentTypeId} LIMIT 1`)
  ).rows[0] as { req: boolean } | undefined;
  let bulkReleased = 0;
  if (flagRow && !flagRow.req) {
    const r = await executor.execute(sql`
      UPDATE document_ledger dl
      SET status = 'PENDING', updated_at = now()
      WHERE dl.document_type_id_fk = ${documentTypeId}
        AND dl.status = 'ON_HOLD'`);
    bulkReleased = r.rowCount ?? 0;
    if (bulkReleased > 0) {
      log.info(
        `document type ${documentTypeId}: fee-clearance turned off — released ${bulkReleased} ON_HOLD row(s)`,
      );
    }
  }

  let onHold = 0;
  let released = bulkReleased;
  for (const { studentId } of students) {
    const r = await recomputeFeeClearanceForStudent(studentId, executor);
    onHold += r.onHold;
    released += r.released;
  }

  return { studentsScanned: students.length, onHold, released };
}
