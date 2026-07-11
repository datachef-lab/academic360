import { db } from "@/db";
import {
  feeStudentMappingModel,
  createFeeStudentMappingSchema,
  feeStructureModel,
  feeGroupPromotionMappingModel,
  feeGroupModel,
  paymentModel,
  studentModel,
  academicYearModel,
  sessionModel,
  userModel,
  personalDetailsModel,
  classModel,
  programCourseModel,
  shiftModel,
  feeStructureComponentModel,
  receiptTypeModel,
  feeCategoryModel,
  feeStudentReceiptNumberModel,
  promotionModel,
} from "@repo/db/schemas";
import { and, asc, eq, sql } from "drizzle-orm";
import { FeeStudentMappingDto } from "@repo/db/dtos/fees";
import {
  withAdvisoryXactLock,
  isUniqueViolation,
} from "@/utils/db-concurrency.js";
import { socketService } from "@/services/socketService.js";
import * as feeStructureService from "./fee-structure.service.js";
import * as feeGroupPromotionMappingService from "./fee-group-promotion-mapping.service.js";
import * as feeStructureInstallmentService from "./fee-structure-installment.service.js";
import * as feeHeadService from "./fee-head.service.js";
import * as userService from "@/features/user/services/user.service.js";
import { pdfGenerationService } from "@/services/pdf-generation.service.js";
import {
  formatIndianNumber,
  numberToWords,
  toSentenceCasePreservingTrailingRoman,
} from "@/utils/helper.js";

/**
 * Normalizes a challan number for lookup. Barcodes encode slash as hyphen for
 * scanner compatibility; this converts back to canonical "uid/semNum" form.
 * Use when processing scanned barcode values (e.g. fee update by challan).
 */
export function normalizeChallanNumber(scanned: string): string {
  if (!scanned || typeof scanned !== "string") return scanned;
  return scanned.trim().replace(/-/g, "/");
}

/** DB lookup key for receipt_number (aligned with fee payment marking). */
export function normalizeReceiptLookupKey(input: string): string {
  return String(input || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "/")
    .replace(/\/+/g, "/")
    .toUpperCase();
}

/**
 * Challan / receipt number: `{studentUid}/{NN}` or, when the fee category has a code,
 * `{studentUid}/{NN}-{feeCategoryCode}`.
 */
function buildChallanNumber(
  studentUid: string,
  paddedSeq: string,
  feeCategoryCode: string | null,
): string {
  const base = `${studentUid}/${paddedSeq}`;
  return feeCategoryCode ? `${base}-${feeCategoryCode}` : base;
}

function extractTxnDateFromGateway(gatewayResponse: unknown): string {
  const gr = gatewayResponse as {
    paytm?: { callback?: Record<string, string> };
  } | null;
  const raw =
    gr?.paytm?.callback?.TXNDATE ?? gr?.paytm?.callback?.txnDate ?? "";
  return String(raw).trim();
}

function formatReceiptTxnDate(raw: string | Date | null | undefined): string {
  if (raw == null || raw === "") return "";
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString("en-GB") : "";
}

/**
 * First-time receipt download: assigns receipt_number and challan_generated_at.
 * If receipt_number exists but challan_generated_at is missing (legacy), sets timestamp once.
 */
/**
 * After a fee payment succeeds (including online): assign receipt/challan number and
 * `challan_generated_at` if missing — same as first PDF download, but automatic.
 * Idempotent; safe to call on duplicate callbacks.
 */
export async function issueFeeStudentMappingReceiptIfMissing(
  feeStudentMappingId: number,
): Promise<void> {
  const [row] = await db
    .select({
      mappingId: feeStudentMappingModel.id,
      studentId: feeStudentMappingModel.studentId,
      uid: studentModel.uid,
      feeCategoryCode: feeCategoryModel.code,
    })
    .from(feeStudentMappingModel)
    .innerJoin(
      studentModel,
      eq(studentModel.id, feeStudentMappingModel.studentId),
    )
    .innerJoin(
      feeGroupPromotionMappingModel,
      eq(
        feeGroupPromotionMappingModel.id,
        feeStudentMappingModel.feeGroupPromotionMappingId,
      ),
    )
    .innerJoin(
      feeGroupModel,
      eq(feeGroupModel.id, feeGroupPromotionMappingModel.feeGroupId),
    )
    .leftJoin(
      feeCategoryModel,
      eq(feeCategoryModel.id, feeGroupModel.feeCategoryId),
    )
    .where(eq(feeStudentMappingModel.id, feeStudentMappingId))
    .limit(1);

  if (!row) return;

  await persistReceiptIssuanceIfNeeded({
    mappingId: row.mappingId,
    studentId: row.studentId,
    studentUid: row.uid,
    feeCategoryCode: row.feeCategoryCode,
  });
}

/** The active (non-deprecated) receipt row for a fee mapping, if any. */
async function getActiveReceiptForMapping(mappingId: number): Promise<{
  receiptNumber: string;
  challanGeneratedAt: Date | null;
  uid: string;
} | null> {
  const [row] = await db
    .select({
      receiptNumber: feeStudentReceiptNumberModel.receiptNumber,
      challanGeneratedAt: feeStudentReceiptNumberModel.challanGeneratedAt,
      uid: feeStudentReceiptNumberModel.uid,
    })
    .from(feeStudentReceiptNumberModel)
    .where(
      and(
        eq(feeStudentReceiptNumberModel.feeStudentMappingId, mappingId),
        eq(feeStudentReceiptNumberModel.isDeprecated, false),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Next per-student receipt sequence = MAX(sequence)+1 across ALL the student's
 * receipts (active or deprecated) in `fee_student_receipt_numbers` — a
 * continuous per-student counter that survives a uid change.
 */
async function getNextSequenceForStudent(studentId: number): Promise<number> {
  const { rows } = await db.execute<{ next: number }>(sql`
    SELECT COALESCE(MAX(sequence), 0) + 1 AS next
    FROM public.fee_student_receipt_numbers
    WHERE student_id_fk = ${studentId}
  `);
  const n = Number((rows?.[0] as { next?: unknown })?.next ?? 1);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Ensure the mapping has an ACTIVE receipt number in `fee_student_receipt_numbers`.
 * If one exists, return it (idempotent). Otherwise allocate the next per-student
 * sequence and insert an active row. The receipt string format is unchanged
 * (`{uid}/{NN}[-{code}]`). Nothing is written to `fee_student_mappings` — the
 * new table is the single source of truth.
 *
 * Concurrency: a per-student advisory lock serializes allocation across
 * processes; `unique(receipt_number)` + a bounded retry is the backstop.
 */
async function persistReceiptIssuanceIfNeeded(params: {
  mappingId: number;
  studentId: number;
  studentUid: string;
  feeCategoryCode: string | null | undefined;
}): Promise<{ challanNumber: string; challanGeneratedAt: Date; uid: string }> {
  const { mappingId, studentId, studentUid } = params;
  const code = (params.feeCategoryCode ?? "").trim();
  const codeOrNull = code.length > 0 ? code : null;

  const existing = await getActiveReceiptForMapping(mappingId);
  if (existing) {
    return {
      challanNumber: existing.receiptNumber,
      challanGeneratedAt: existing.challanGeneratedAt ?? new Date(),
      uid: existing.uid,
    };
  }

  return withAdvisoryXactLock(`frn:student:${studentId}`, async () => {
    const recheck = await getActiveReceiptForMapping(mappingId);
    if (recheck) {
      return {
        challanNumber: recheck.receiptNumber,
        challanGeneratedAt: recheck.challanGeneratedAt ?? new Date(),
        uid: recheck.uid,
      };
    }

    const now = new Date();
    for (let attempt = 0; attempt < 5; attempt++) {
      const seq = await getNextSequenceForStudent(studentId);
      const receiptNumber = buildChallanNumber(
        studentUid,
        String(seq).padStart(2, "0"),
        codeOrNull,
      );
      try {
        await db.insert(feeStudentReceiptNumberModel).values({
          studentId,
          feeStudentMappingId: mappingId,
          uid: studentUid,
          sequence: seq,
          receiptNumber,
          challanGeneratedAt: now,
          isDeprecated: false,
        });
        scheduleFeesDashboardBroadcast("fee_receipt_issued");
        return { challanNumber: receiptNumber, challanGeneratedAt: now, uid: studentUid };
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
        // Lost a race: either this mapping already got an active receipt, or the
        // student-level number collided. Re-check the mapping, else recompute.
        const raced = await getActiveReceiptForMapping(mappingId);
        if (raced) {
          return {
            challanNumber: raced.receiptNumber,
            challanGeneratedAt: raced.challanGeneratedAt ?? new Date(),
            uid: raced.uid,
          };
        }
      }
    }
    throw new Error(
      `Failed to allocate a receipt number for mapping ${mappingId}`,
    );
  });
}

async function fetchFeeReceiptJoinRow(
  feeStructureId: number,
  studentId: number,
) {
  const result = await db
    .select({
      feeStudentMapping: feeStudentMappingModel,
      feeStructure: feeStructureModel,
      student: studentModel,
      user: userModel,
      personalDetails: personalDetailsModel,
      session: sessionModel,
      feeGroup: feeGroupModel,
      academicYear: academicYearModel,
      class: classModel,
      shift: shiftModel,
      programCourse: programCourseModel,
      receiptType: receiptTypeModel,
      payment: paymentModel,
      feeCategoryCode: feeCategoryModel.code,
    })
    .from(feeStudentMappingModel)
    .innerJoin(
      feeStructureModel,
      eq(feeStructureModel.id, feeStudentMappingModel.feeStructureId),
    )
    .innerJoin(
      studentModel,
      eq(studentModel.id, feeStudentMappingModel.studentId),
    )
    .leftJoin(
      paymentModel,
      and(
        eq(paymentModel.feeStudentMappingId, feeStudentMappingModel.id),
        eq(paymentModel.isLinked, true),
        eq(paymentModel.status, "SUCCESS"),
      ),
    )
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(
      personalDetailsModel,
      eq(personalDetailsModel.userId, userModel.id),
    )
    .innerJoin(
      feeGroupPromotionMappingModel,
      eq(
        feeGroupPromotionMappingModel.id,
        feeStudentMappingModel.feeGroupPromotionMappingId,
      ),
    )
    .innerJoin(
      feeGroupModel,
      eq(feeGroupModel.id, feeGroupPromotionMappingModel.feeGroupId),
    )
    .leftJoin(
      feeCategoryModel,
      eq(feeCategoryModel.id, feeGroupModel.feeCategoryId),
    )
    .innerJoin(
      academicYearModel,
      eq(academicYearModel.id, feeStructureModel.academicYearId),
    )
    .innerJoin(
      sessionModel,
      eq(sessionModel.academicYearId, academicYearModel.id),
    )
    .innerJoin(classModel, eq(classModel.id, feeStructureModel.classId))
    .innerJoin(shiftModel, eq(shiftModel.id, feeStructureModel.shiftId))
    .innerJoin(
      programCourseModel,
      eq(programCourseModel.id, feeStructureModel.programCourseId),
    )
    .innerJoin(
      receiptTypeModel,
      eq(receiptTypeModel.id, feeStructureModel.receiptTypeId),
    )
    .where(
      and(
        eq(feeStudentMappingModel.studentId, studentId),
        eq(feeStudentMappingModel.feeStructureId, feeStructureId),
      ),
    );

  return result[0] ?? null;
}

/**
 * Converts a FeeStudentMapping model to FeeStudentMappingDto
 */
async function modelToDto(
  model: typeof feeStudentMappingModel.$inferSelect | null,
): Promise<FeeStudentMappingDto | null> {
  if (!model) return null;

  // Resolve the canonical (linked) payment row for this fee mapping. There can
  // be many payment attempts per mapping; only the row with `isLinked = true`
  // is used for display / receipts / status. Failed/pending/audit rows are
  // intentionally ignored here.
  const [payment] = await db
    .select({
      status: paymentModel.status,
      txnDate: paymentModel.txnDate,
      updatedAt: paymentModel.updatedAt,
      gatewayResponse: paymentModel.gatewayResponse,
    })
    .from(paymentModel)
    .where(
      and(
        eq(paymentModel.feeStudentMappingId, model.id),
        eq(paymentModel.isLinked, true),
      ),
    )
    .limit(1);

  const [
    feeStructure,
    feeGroupPromotionMapping,
    feeStructureInstallment,
    waivedOffByUser,
  ] = await Promise.all([
    feeStructureService.getFeeStructureById(model.feeStructureId),
    feeGroupPromotionMappingService.getFeeGroupPromotionMappingById(
      model.feeGroupPromotionMappingId,
    ),
    model.feeStructureInstallmentId
      ? feeStructureInstallmentService.getFeeStructureInstallmentById(
          model.feeStructureInstallmentId,
        )
      : Promise.resolve(null),
    model.waivedOffByUserId
      ? userService.findById(model.waivedOffByUserId)
      : Promise.resolve(null),
  ]);

  if (!feeStructure || !feeGroupPromotionMapping) {
    return null;
  }

  // Get all fee group promotion mappings for this fee structure
  // This might need to be adjusted based on your business logic
  const feeGroupPromotionMappings = [feeGroupPromotionMapping];

  const totalPayable = model.totalPayable ?? 0;
  const amountPaid = model.amountPaid ?? 0;
  const paymentStatus: FeeStudentMappingDto["paymentStatus"] =
    payment?.status === "FAILED"
      ? "FAILED"
      : totalPayable > 0 && amountPaid >= totalPayable
        ? "SUCCESS"
        : "PENDING";

  const gatewayTxnDate =
    extractTxnDateFromGateway(
      (payment as { gatewayResponse?: unknown } | null)?.gatewayResponse,
    ) || null;
  const transactionDate: FeeStudentMappingDto["transactionDate"] =
    (payment as { txnDate?: string | null } | null)?.txnDate ??
    gatewayTxnDate ??
    (payment as { updatedAt?: Date | string | null } | null)?.updatedAt ??
    null;

  // Receipt/challan now live in `fee_student_receipt_numbers`; the mapping's own
  // `receiptNumber`/`challanGeneratedAt` columns are frozen legacy data and are
  // not read. Surface the ACTIVE receipt (if any) so all consumers stay correct.
  const activeReceipt = await getActiveReceiptForMapping(model.id);

  return {
    ...model,
    receiptNumber: activeReceipt?.receiptNumber ?? null,
    challanGeneratedAt: activeReceipt?.challanGeneratedAt ?? null,
    feeStructure,
    feeGroupPromotionMappings,
    feeStructureInstallment,
    waivedOffByUser,
    paymentStatus,
    transactionDate,
  };
}

import { scheduleFeesDashboardBroadcast } from "../fees-dashboard.socket.js";

const emitFeeStudentMappingUpdate = async (studentId: number) => {
  try {
    const io = socketService.getIO();
    if (!io) return;
    const [student] = await db
      .select({ userId: studentModel.userId })
      .from(studentModel)
      .where(eq(studentModel.id, studentId));
    if (student?.userId) {
      io.to(`user:${student.userId}`).emit("fee_student_mapping_updated", {
        studentId,
        timestamp: new Date().toISOString(),
      });
    }
    scheduleFeesDashboardBroadcast("fee_student_mapping_updated");
  } catch {
    // non-critical
  }
};

/**
 * Services should accept validated DTOs (controller validates via zod) and
 * return raw rows / arrays / null. Do not catch errors here — controller will handle them.
 */
export const createFeeStudentMapping = async (
  data: typeof createFeeStudentMappingSchema._type,
): Promise<FeeStudentMappingDto> => {
  const [created] = await db
    .insert(feeStudentMappingModel)
    .values(data)
    .returning();

  const dto = await modelToDto(created);
  emitFeeStudentMappingUpdate(created.studentId);
  return dto!;
};

/**
 * Mappings whose fee_group_promotion_mapping → promotion is NOT deprecated.
 * A shift change deprecates the old promotion (preserving its old-shift
 * mappings as history), so this filter excludes those superseded mappings from
 * every by-student listing — matching the export/dashboard convention.
 */
const nonDeprecatedPromotionMappingSql = sql`
  EXISTS (
    SELECT 1 FROM ${feeGroupPromotionMappingModel} fgpm
    JOIN ${promotionModel} p ON p.id = fgpm.promotion_id_fk
    WHERE fgpm.id = ${feeStudentMappingModel.feeGroupPromotionMappingId}
      AND COALESCE(p.is_deprecated, false) = false
  )
`;

export const getAllFeeStudentMappings = async (): Promise<
  FeeStudentMappingDto[]
> => {
  const rows = await db
    .select()
    .from(feeStudentMappingModel)
    .where(nonDeprecatedPromotionMappingSql);
  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter((dto): dto is FeeStudentMappingDto => dto !== null);
};

export const getFeeStudentMappingById = async (
  id: number,
): Promise<FeeStudentMappingDto | null> => {
  const [row] = await db
    .select()
    .from(feeStudentMappingModel)
    .where(eq(feeStudentMappingModel.id, id));

  return await modelToDto(row ?? null);
};

export const getFeeStudentMappingsByStudentId = async (
  studentId: number,
): Promise<FeeStudentMappingDto[]> => {
  const rows = await db
    .select()
    .from(feeStudentMappingModel)
    .where(
      and(
        eq(feeStudentMappingModel.studentId, studentId),
        nonDeprecatedPromotionMappingSql,
      ),
    )
    .orderBy(asc(feeStudentMappingModel.id));

  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter((dto): dto is FeeStudentMappingDto => dto !== null);
};

export const updateFeeStudentMapping = async (
  id: number,
  data: Partial<typeof createFeeStudentMappingSchema._type>,
): Promise<FeeStudentMappingDto | null> => {
  // Get the existing mapping to calculate totalPayable if waived off details are being updated
  const [existing] = await db
    .select()
    .from(feeStudentMappingModel)
    .where(eq(feeStudentMappingModel.id, id));

  if (!existing) {
    return null;
  }

  // If waived off details are being updated, recalculate totalPayable
  if (data.isWaivedOff !== undefined || data.waivedOffAmount !== undefined) {
    // Get fee structure and fee group promotion mapping to calculate base totalPayable
    const [feeStructure] = await db
      .select()
      .from(feeStructureModel)
      .where(eq(feeStructureModel.id, existing.feeStructureId));

    const [feeGroupPromotionMapping] = await db
      .select()
      .from(feeGroupPromotionMappingModel)
      .where(
        eq(
          feeGroupPromotionMappingModel.id,
          existing.feeGroupPromotionMappingId,
        ),
      );

    if (feeStructure && feeGroupPromotionMapping) {
      // Calculate base totalPayable (after concession, before waiver) using the service function
      const baseTotalPayable =
        await feeStructureService.calculateTotalPayableForFeeStudentMapping(
          existing.feeStructureId,
          feeGroupPromotionMapping,
        );

      // Determine waived off amount: use new value if provided, otherwise use existing value
      const isWaivedOff =
        data.isWaivedOff !== undefined
          ? data.isWaivedOff
          : existing.isWaivedOff;
      const waivedOffAmount = isWaivedOff
        ? data.waivedOffAmount !== undefined
          ? data.waivedOffAmount
          : existing.waivedOffAmount
        : 0;

      // Apply waived off amount: baseTotalPayable (after concession) - waivedOffAmount
      // This ensures waiver is deducted from the amount after concession is applied
      const finalTotalPayable = Math.max(0, baseTotalPayable - waivedOffAmount);

      data.totalPayable = finalTotalPayable;
    }
  }

  const [updated] = await db
    .update(feeStudentMappingModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(feeStudentMappingModel.id, id))
    .returning();

  if (updated) emitFeeStudentMappingUpdate(updated.studentId);
  return await modelToDto(updated ?? null);
};

export const deleteFeeStudentMapping = async (
  id: number,
): Promise<FeeStudentMappingDto | null> => {
  const [deleted] = await db
    .delete(feeStudentMappingModel)
    .where(eq(feeStudentMappingModel.id, id))
    .returning();

  return await modelToDto(deleted ?? null);
};

export async function generateFeeReceiptByFeeStructureIdAndStudentId(
  feeStructureId: number,
  studentId: number,
) {
  return generateFeeReceiptInternal({
    feeStructureId,
    studentId,
  });
}

/** POST /fees/receipts — ensure receipt/challan row exists; returns relative URL for GET PDF. */
export async function ensureFeeReceiptChallanUrl(
  feeStructureId: number,
  studentId: number,
): Promise<{ url: string; challanNumber: string } | null> {
  if (!feeStructureId || !studentId) return null;
  const row = await fetchFeeReceiptJoinRow(feeStructureId, studentId);
  if (!row) return null;

  const { challanNumber } = await persistReceiptIssuanceIfNeeded({
    mappingId: row.feeStudentMapping.id,
    studentId: row.student.id,
    studentUid: row.student.uid,
    feeCategoryCode: row.feeCategoryCode,
  });

  const url = `/api/v1/fees/receipts?challanNumber=${challanNumber}`;
  return { url, challanNumber };
}

/**
 * GET /fees/receipts?challanNumber= — generate PDF by challan / receipt number.
 * Looks the receipt up in `fee_student_receipt_numbers` (ANY status, so an old
 * DEPRECATED receipt still regenerates its historical PDF with the uid it was
 * issued under) and renders that exact receipt.
 */
export async function generateFeeReceiptByChallanNumber(
  challanNumberRaw: string,
) {
  const key = normalizeReceiptLookupKey(challanNumberRaw);
  if (!key) return null;

  const { rows } = await db.execute<{
    mappingId: number | null;
    uid: string;
    receiptNumber: string;
    challanGeneratedAt: Date | null;
  }>(sql`
    SELECT fee_student_mapping_id_fk AS "mappingId", uid AS "uid",
           receipt_number AS "receiptNumber", challan_generated_at AS "challanGeneratedAt"
    FROM public.fee_student_receipt_numbers
    WHERE upper(replace(trim(receipt_number), '-', '/')) = ${key}
    LIMIT 1
  `);

  const rn = rows[0];
  if (!rn || rn.mappingId == null) return null;

  const [m] = await db
    .select({
      feeStructureId: feeStudentMappingModel.feeStructureId,
      studentId: feeStudentMappingModel.studentId,
    })
    .from(feeStudentMappingModel)
    .where(eq(feeStudentMappingModel.id, Number(rn.mappingId)))
    .limit(1);
  if (!m) return null;

  return generateFeeReceiptInternal({
    feeStructureId: m.feeStructureId,
    studentId: m.studentId,
    overrideReceipt: {
      receiptNumber: rn.receiptNumber,
      challanGeneratedAt: rn.challanGeneratedAt ?? new Date(),
      uid: rn.uid,
    },
  });
}

async function generateFeeReceiptInternal(params: {
  feeStructureId: number;
  studentId: number;
  /** When set (challan lookup), render this exact receipt with its frozen uid. */
  overrideReceipt?: {
    receiptNumber: string;
    challanGeneratedAt: Date;
    uid: string;
  };
}) {
  const { feeStructureId, studentId } = params;
  if (!feeStructureId || !studentId) {
    throw Error("feeStructureId or studentId is not valid");
  }

  const joinRow = await fetchFeeReceiptJoinRow(feeStructureId, studentId);
  if (!joinRow) {
    return null;
  }

  const {
    feeStudentMapping,
    feeStructure,
    student,
    user,
    personalDetails,
    session,
    feeGroup,
    class: classRecord,
    shift,
    programCourse,
    payment,
    receiptType,
    feeCategoryCode,
  } = joinRow;

  const { challanNumber, challanGeneratedAt, uid: receiptUid } =
    params.overrideReceipt
      ? {
          challanNumber: params.overrideReceipt.receiptNumber,
          challanGeneratedAt: params.overrideReceipt.challanGeneratedAt,
          uid: params.overrideReceipt.uid,
        }
      : await persistReceiptIssuanceIfNeeded({
          mappingId: feeStudentMapping.id,
          studentId: student.id,
          studentUid: student.uid,
          feeCategoryCode: feeCategoryCode,
        });

  const semesterName = toSentenceCasePreservingTrailingRoman(classRecord.name);

  const components = await db
    .select()
    .from(feeStructureComponentModel)
    .where(eq(feeStructureComponentModel.feeStructureId, feeStructure.id));

  const componentDtos: Array<{
    amount: string;
    name: string;
  }> = await Promise.all(
    components
      .filter((component) => component.feeSlabId === feeGroup.feeSlabId)
      .map(async (component) => {
        const feeHead = await feeHeadService.getFeeHeadById(
          component.feeHeadId,
        );
        return {
          amount: formatIndianNumber(component.amount!).toString(),
          name: feeHead?.name || "Unknown",
        };
      }),
  );

  // Use the uid captured on the receipt (issuance uid), NOT the live student uid
  // — so a receipt issued before a shift change still prints its original uid.
  const pageTitle = `${receiptUid} | ${receiptType.name} - ${semesterName} | ${programCourse.name} (${session.name})`;

  const ePaid = await (async () => {
    const [pay] = await db
      .select({
        status: paymentModel.status,
        paymentMode: paymentModel.paymentMode,
        orderId: paymentModel.orderId,
        txnDate: paymentModel.txnDate,
        gatewayResponse: paymentModel.gatewayResponse,
        updatedAt: paymentModel.updatedAt,
      })
      .from(paymentModel)
      .where(
        and(
          eq(paymentModel.feeStudentMappingId, feeStudentMapping.id!),
          eq(paymentModel.isLinked, true),
        ),
      )
      .limit(1);
    const isSuccess = String(pay?.status || "").toUpperCase() === "SUCCESS";
    const isOnline = String(pay?.paymentMode || "").toUpperCase() === "ONLINE";
    const orderId = String(pay?.orderId || "").trim();
    let txnDateRaw = String(pay?.txnDate || "").trim();
    if (!txnDateRaw) {
      txnDateRaw = extractTxnDateFromGateway(pay?.gatewayResponse);
    }
    if (!txnDateRaw && pay?.updatedAt) {
      txnDateRaw = String(pay.updatedAt);
    }
    if (!isSuccess || !isOnline || !orderId || !txnDateRaw) return null;

    const transactionDate = formatReceiptTxnDate(txnDateRaw);
    if (!transactionDate) return null;
    return { orderId, transactionDate };
  })();

  // Paid stamp aligned with the student-console / mapping logic in
  // `modelToDto`: a mapping is considered paid when EITHER the linked payment
  // row is SUCCESS, OR the mapping itself is fully paid
  // (amountPaid >= totalPayable && totalPayable > 0). The latter covers
  // legacy/manual rows that may have no `payments` row with `isLinked = true`.
  const totalPayableNum = Number(feeStudentMapping.totalPayable ?? 0);
  const amountPaidNum = Number(feeStudentMapping.amountPaid ?? 0);
  const mappingFullyPaid =
    totalPayableNum > 0 && amountPaidNum >= totalPayableNum;
  const isPaid = payment?.status === "SUCCESS" || mappingFullyPaid;

  // `mode = "online"` is only safe when `ePaid` is fully resolved
  // (orderId + transactionDate) — the EJS template dereferences `ePaid.orderId`.
  // Everything else (manual cash, gateway-cash, legacy mapping-only paid)
  // falls back to "offline" → "PAID (date)" stamp.
  const mode: "online" | "offline" = ePaid != null ? "online" : "offline";

  const paidDateSource: Date | string | null =
    payment?.txnDate ??
    (payment?.updatedAt as Date | string | null | undefined) ??
    feeStudentMapping.challanGeneratedAt ??
    null;
  const paidDate = paidDateSource ? formatReceiptTxnDate(paidDateSource) : "";

  const pdfBuffer = await pdfGenerationService.generateFeeReceiptPdfBuffer({
    session: session.name,
    name: user.name,
    dob: personalDetails?.dateOfBirth
      ? new Date(personalDetails.dateOfBirth).toLocaleDateString("en-GB")
      : "",
    phone: user.phone ?? "",
    programCourse: programCourse.name ?? "",
    semester: semesterName,
    shift: shift.name ?? "",
    uid: receiptUid,
    totalPayableAmount: formatIndianNumber(feeStudentMapping.totalPayable),
    totalPayableAmountInWords: numberToWords(feeStudentMapping.totalPayable),
    challanNumber,
    challanDate: challanGeneratedAt.toLocaleDateString("en-GB"),
    ePaid,
    feeComponents: componentDtos,
    pageTitle,
    isPaid,
    mode,
    paidDate,
  });

  return {
    pdfBuffer,
    session: session.name,
    semester: semesterName,
    programCourse: programCourse.name,
    receiptName: receiptType.name,
    uid: receiptUid,
  };
}
