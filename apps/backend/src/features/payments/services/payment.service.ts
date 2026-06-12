import { db } from "@/db/index.js";
import {
  paymentModel,
  settlementModel,
} from "@academic/db/schemas/models/payments";
import {
  feeGroupModel,
  feeGroupPromotionMappingModel,
  feeSlabModel,
  feeStructureModel,
  feeStudentMappingModel,
  receiptTypeModel,
} from "@academic/db/schemas/models/fees";
import { studentModel, userModel } from "@academic/db/schemas/models/user";
import { issueFeeStudentMappingReceiptIfMissing } from "@/features/fees/services/fee-student-mapping.service.js";
import { scheduleFeesDashboardBroadcast } from "@/features/fees/fees-dashboard.socket.js";
import { applicationFormModel } from "@/features/admissions/models/application-form.model.js";
import { and, eq, sql } from "drizzle-orm";
import type {
  PaytmPCFDetailsRequest,
  PaytmPCFDetailsResponse,
  PaytmTransactionStatusResponse,
} from "@academic/db/dtos/payments";
import {
  getPaytmMerchantDetails,
  getPaytmPCFDetails,
  getPaytmSettlementOrderDetail,
  getPaytmTransactionStatusDetails,
} from "./paytm-payment.service.js";
import {
  isPaytmConfigured,
  isPaytmSettlementConfigured,
} from "../config/paytm.config.js";
import {
  academicYearModel,
  classModel,
  programCourseModel,
  promotionModel,
  sectionModel,
  shiftModel,
} from "@academic/db/index.js";

type PaymentMeta = {
  applicationFormId?: number;
  feeStudentMappingId?: number;
};

type GatewayResponseShape = {
  meta?: PaymentMeta;
  paytm?: Record<string, unknown>;
};

function parseGatewayMeta(
  row: { gatewayResponse: unknown } | null,
): PaymentMeta {
  const g = row?.gatewayResponse as GatewayResponseShape | null | undefined;
  return g?.meta ?? {};
}

function mergeGatewayResponse(
  existing: unknown,
  patch: object | undefined,
): unknown {
  if (!patch) return existing;
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  const p = patch as Record<string, unknown>;

  // Shallow-merge most keys, but preserve nested `meta`/`paytm` structure we rely on.
  const merged: Record<string, unknown> = { ...base, ...p };

  const baseMeta =
    (base.meta as Record<string, unknown> | undefined) ?? undefined;
  const patchMeta =
    (p.meta as Record<string, unknown> | undefined) ?? undefined;
  if (baseMeta || patchMeta) {
    merged.meta = { ...(baseMeta ?? {}), ...(patchMeta ?? {}) };
  }

  const basePaytm =
    (base.paytm as Record<string, unknown> | undefined) ?? undefined;
  const patchPaytm =
    (p.paytm as Record<string, unknown> | undefined) ?? undefined;
  if (basePaytm || patchPaytm) {
    merged.paytm = { ...(basePaytm ?? {}), ...(patchPaytm ?? {}) };
  }

  return merged;
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null),
  ) as Partial<T>;
}

function formatTxnDate(value: Date | string | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function previewJson(value: unknown, maxLen = 2000): string {
  try {
    const s = JSON.stringify(value);
    return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
  } catch {
    return String(value);
  }
}

/** Student fee / challan payments (Paytm uses ADMISSION; legacy rows may use FEE). */
export function isFeeStudentMappingPaymentContext(
  ctx: string | null | undefined,
): boolean {
  return ctx === "FEE" || ctx === "ADMISSION";
}

export async function ensureFeeReceiptAfterSuccessfulFeePayment(
  payment:
    | {
        id: number;
        context: string | null;
        status: string | null;
      }
    | null
    | undefined,
): Promise<void> {
  if (
    !payment?.id ||
    !isFeeStudentMappingPaymentContext(payment.context) ||
    payment.status !== "SUCCESS"
  ) {
    return;
  }
  try {
    // The receipt is tied to the fee_student_mapping, which is now stored
    // directly on the payment row (payments.feeStudentMappingId).
    const [row] = await db
      .select({ feeStudentMappingId: paymentModel.feeStudentMappingId })
      .from(paymentModel)
      .where(eq(paymentModel.id, payment.id))
      .limit(1);
    if (row?.feeStudentMappingId) {
      await issueFeeStudentMappingReceiptIfMissing(row.feeStudentMappingId);
    }
  } catch (e) {
    console.error("[FEE] ensureFeeReceiptAfterSuccessfulFeePayment failed", e);
  }
}

/**
 * Returns the canonical linked payment row for a fee_student_mapping.
 * There can be many payment rows per fee mapping; only ONE should have
 * `isLinked = true` (set by either the first successful Paytm callback or by a
 * manual entry created from the marking UI / cash receipt flow).
 */
export async function findLinkedPaymentByFeeStudentMappingId(
  feeStudentMappingId: number,
): Promise<typeof paymentModel.$inferSelect | null> {
  const [payment] = await db
    .select()
    .from(paymentModel)
    .where(
      and(
        eq(paymentModel.feeStudentMappingId, feeStudentMappingId),
        eq(paymentModel.isLinked, true),
      ),
    )
    .limit(1);
  return payment ?? null;
}

function logPaytmEnrich(
  level: "info" | "error",
  event: string,
  payload: Record<string, unknown>,
): void {
  const base = {
    event,
    ...payload,
  };
  if (level === "error") console.error("[Paytm enrich]", base);
  else console.info("[Paytm enrich]", base);
}

function mapTxnPaymentModeToPaymentOption(
  raw: string | undefined | null,
):
  | "UPI"
  | "WALLET"
  | "NET_BANKING"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "PAYTM_BALANCE"
  | undefined {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (!s) return undefined;
  // Paytm `paymentMode` commonly returns: CC, DC, NB, UPI, PPI, BALANCE
  if (s === "UPI") return "UPI";
  if (s === "NB" || s === "NET_BANKING" || s === "NETBANKING")
    return "NET_BANKING";
  if (s === "CC" || s === "CREDIT_CARD") return "CREDIT_CARD";
  if (s === "DC" || s === "DEBIT_CARD") return "DEBIT_CARD";
  if (s === "PPI" || s === "WALLET") return "WALLET";
  if (s === "BALANCE" || s === "PAYTM_BALANCE") return "PAYTM_BALANCE";
  return undefined;
}

function mapTxnStatusBodyToPaymentColumns(
  body: PaytmTransactionStatusResponse["body"],
): Record<string, unknown> {
  const ri = body.resultInfo;
  return omitUndefined({
    mid: body.mid,
    txnId: body.txnId,
    bankTxnId: body.bankTxnId,
    txnAmount: body.txnAmount,
    txnType: body.txnType,
    txnGatewayName: body.gatewayName,
    txnGatewayInfo: body.gatewayInfo,
    bankName: body.bankName,
    txnPaymentMode: body.paymentMode,
    paymentOption: mapTxnPaymentModeToPaymentOption(body.paymentMode),
    txnRefundAmt: body.refundAmt,
    txnDate: body.txnDate,

    payableAmount: body.payableAmount,
    paymentPromoCheckoutData: body.paymentPromoCheckoutData,
    subsId: body.subsId,

    // Bank transfer (VAN) fields (only for transfer paymodes)
    van: body.vanInfo?.van,
    beneficiaryName: body.vanInfo?.beneficiaryName,
    ifscCode: body.vanInfo?.ifscCode,
    vanBankName: body.vanInfo?.bankName,
    vanPurpose: body.vanInfo?.purpose,
    customerName: body.vanInfo?.customerDetails?.name,
    customerEmail: body.vanInfo?.customerDetails?.email,
    customerPhone: body.vanInfo?.customerDetails?.phone,

    // Remitter details (only for transfer paymodes)
    sourceAccountNumberMasked: body.sourceAccountDetails?.maskedAccountNumber,
    sourceAccountHolderName: body.sourceAccountDetails?.accountHolderName,
    transferMode: body.transferMode,
    utr: body.utr,
    bankTransactionDate: body.bankTransactionDate,

    // Card-related fields (only for card paymodes)
    rrnCode: body.rrnCode,
    arnCode: body.arnCode,
    arnAvailable: body.arnAvailable,
    authCode: body.authCode,
    merchantUniqRef: body.merchantUniqueReference,
    cardScheme: body.cardScheme,
    cardLastFourDigit: body.lastFourDigit,
    internationalCardPayment: body.internationalCardPayment,
    blockedAmount: body.blockedAmount,
    authRefId: body.authRefId,
  });
}

function resolvePcfConsult(
  body: PaytmPCFDetailsResponse["body"],
): PaytmPCFDetailsResponse["body"]["consultDetails"] | undefined {
  const raw = body.consultDetails as unknown;
  if (!raw || typeof raw !== "object") return undefined;
  if ("payMethod" in raw) {
    return raw as PaytmPCFDetailsResponse["body"]["consultDetails"];
  }
  const first = Object.values(raw as Record<string, unknown>)[0];
  return first as PaytmPCFDetailsResponse["body"]["consultDetails"] | undefined;
}

function mapPcfBodyToPaymentColumns(
  body: PaytmPCFDetailsResponse["body"],
): Record<string, unknown> {
  const ri = body.resultInfo;
  const c = resolvePcfConsult(body);
  const base = omitUndefined({
    pcfResultCode: ri?.resultCode,
    pcfResultStatus: ri?.resultStatus,
    pcfResultMsg: ri?.resultMsg,
  });
  if (!c) return base;
  return {
    ...base,
    ...omitUndefined({
      pcfConsultDetailsPayMethod: c.payMethod,
      pcfConsultDetailsBaseTransactionAmountValue:
        c.baseTransactionAmount?.value,
      pcfConsultDetailsBaseTransactionAmountCurrency:
        c.baseTransactionAmount?.currency,
      pcfConsultDetailsFeeAmountValue: c.feeAmount?.value,
      pcfConsultDetailsFeeAmountCurrency: c.feeAmount?.currency,
      pcfConsultDetailsTaxAmountValue: c.taxAmount?.value,
      pcfConsultDetailsTaxAmountCurrency: c.taxAmount?.currency,
      pcfConsultDetailsTotalConvenienceChargesValue:
        c.totalConvenienceCharges?.value,
      pcfConsultDetailsTotalConvenienceChargesCurrency:
        c.totalConvenienceCharges?.currency,
      pcfConsultDetailsTotalTransactionAmountValue:
        c.totalTransactionAmount?.value,
      pcfConsultDetailsTotalTransactionAmountCurrency:
        c.totalTransactionAmount?.currency,
      pcfConsultDetailsText: c.text,
      pcfConsultDetailsDisplayText: c.displayText,
    }),
  };
}

function mapMerchantToPaymentColumns(merchant: {
  mcc?: string;
  merchantVpa?: string;
  merchantName?: string;
  merchantLogo?: string;
}): Record<string, unknown> {
  return omitUndefined({
    mcc: merchant.mcc,
    merchantVpa: merchant.merchantVpa,
    merchantName: merchant.merchantName,
    merchantLogo: merchant.merchantLogo,
  });
}

function mapSettlementOrderToInsert(
  paymentId: number,
  o: Record<string, unknown>,
): typeof settlementModel.$inferInsert {
  return {
    paymentId,
    transactionId: (o.transactionId as string) ?? undefined,
    merchantUniqueRef: (o.merchantUniqueRef as string) ?? undefined,
    transactionDate: (o.transactionDate as string) ?? undefined,
    updatedDate: (o.updatedDate as string) ?? undefined,
    transactionType: (o.transactionType as string) ?? undefined,
    status: (o.status as string) ?? undefined,
    originalMid: (o.originalMid as string) ?? undefined,
    customerId: (o.customerId as string) ?? undefined,
    amount: (o.amount as string) ?? undefined,
    commission: (o.commission as string) ?? undefined,
    gst: (o.gst as string) ?? undefined,
    merchantBillId: (o.merchantBillId as string) ?? undefined,
    payoutId: (o.payoutId as string) ?? undefined,
    channel: (o.channel as string) ?? undefined,
    utrNo: (o.utrNo as string) ?? undefined,
    payoutDate: (o.payoutDate as string) ?? undefined,
    settledDate: (o.settledDate as string) ?? undefined,
    paymentMode: (o.paymentMode as string) ?? undefined,
    issuingBank: (o.issuingBank as string) ?? undefined,
    settledAmount: (o.settledAmount as string) ?? undefined,
    bankTransactionId: (o.bankTransactionId as string) ?? undefined,
    referenceTransactionId: (o.referenceTransactionId as string) ?? undefined,
    merchantRefId: (o.merchantRefId as string) ?? undefined,
    prn: (o.prn as string) ?? undefined,
    acquiringFee: (o.acquiringFee as string) ?? undefined,
    platformFee: (o.platformFee as string) ?? undefined,
    acquiringTax: (o.acquiringTax as string) ?? undefined,
    platformTax: (o.platformTax as string) ?? undefined,
    ifscCode: (o.ifscCode as string) ?? undefined,
    bankName: (o.bankName as string) ?? undefined,
    beneficiaryName: (o.beneficiaryName as string) ?? undefined,
    maskedCardNo: (o.maskedCardNo as string) ?? undefined,
    cardNetwork: (o.cardNetwork as string) ?? undefined,
    rrnCode: (o.rrnCode as string) ?? undefined,
    disputeId: (o.disputeId as string) ?? undefined,
    posId: (o.posId as string) ?? undefined,
    extSerialNo: (o.extSerialNo as string) ?? undefined,
    gateway: (o.gateway as string) ?? undefined,
    commissionRate: (o.commissionRate as string) ?? undefined,
    productCode: (o.productCode as string) ?? undefined,
    requestType: (o.requestType as string) ?? undefined,
    feeFactor: (o.feeFactor as string) ?? undefined,
    van: (o.van as string) ?? undefined,
  };
}

// CREATE (admission application fee)
export async function createPayment(payment: {
  applicationFormId: number;
  paymentFor: "ADMISSION_APPLICATION_FEE" | "FEE" | "OTHER";
  orderId: string;
  amount: string;
  gatewayName?: string;
}) {
  const amountNum = Number(payment.amount);
  const [newPayment] = await db
    .insert(paymentModel)
    .values({
      context: payment.paymentFor,
      amount: Number.isFinite(amountNum) ? amountNum : 0,
      paymentMode: "ONLINE",
      paymentGatewayVendor: payment.gatewayName ?? "PAYTM",
      orderId: payment.orderId,
      status: "PENDING",
      gatewayResponse: {
        meta: { applicationFormId: payment.applicationFormId },
      } satisfies GatewayResponseShape,
    })
    .returning();

  return newPayment;
}

// CREATE (student fee)
export async function createFeePayment(payment: {
  feeStudentMappingId: number;
  studentId?: number;
  orderId: string;
  amount: string;
  gatewayName?: string;
  remarks?: string;
}) {
  const amountNum = Number(payment.amount);

  return await db.transaction(async (tx) => {
    // Lock the fee-student-mapping row to prevent concurrent payment initiation
    const [mapping] = await tx
      .select({ id: feeStudentMappingModel.id })
      .from(feeStudentMappingModel)
      .where(eq(feeStudentMappingModel.id, payment.feeStudentMappingId))
      .for("update");

    if (!mapping) {
      throw new Error(
        `Fee student mapping ${payment.feeStudentMappingId} not found`,
      );
    }

    // Each payment attempt produces a brand-new row with its own orderId.
    // Only an existing SUCCESS + isLinked=true row for this mapping blocks
    // re-initiation. All other prior rows (PENDING / FAILED / unlinked SUCCESS)
    // are deliberately left untouched so any in-flight Paytm callback for
    // their orderId still resolves to its source-of-truth record.
    const [linkedSuccess] = await tx
      .select({ id: paymentModel.id })
      .from(paymentModel)
      .where(
        and(
          eq(paymentModel.feeStudentMappingId, mapping.id),
          eq(paymentModel.isLinked, true),
          eq(paymentModel.status, "SUCCESS"),
        ),
      )
      .limit(1);

    if (linkedSuccess) {
      throw new Error(
        `Payment already completed for fee mapping ${payment.feeStudentMappingId}`,
      );
    }

    let resolvedUserId: number | null = null;
    if (payment.studentId) {
      const [student] = await tx
        .select({ userId: studentModel.userId })
        .from(studentModel)
        .where(eq(studentModel.id, payment.studentId));
      if (student?.userId) resolvedUserId = student.userId;
    }

    const [newPayment] = await tx
      .insert(paymentModel)
      .values({
        userId: resolvedUserId ?? undefined,
        feeStudentMappingId: payment.feeStudentMappingId,
        context: "ADMISSION",
        amount: Number.isFinite(amountNum) ? amountNum : 0,
        paymentMode: "ONLINE",
        paymentGatewayVendor: payment.gatewayName ?? "PAYTM",
        orderId: payment.orderId,
        status: "PENDING",
        isLinked: false,
        remarks: payment.remarks ?? null,
        gatewayResponse: {
          meta: { feeStudentMappingId: payment.feeStudentMappingId },
        } satisfies GatewayResponseShape,
      })
      .returning();

    const [userInfo] = await tx
      .select({
        uid: studentModel.uid,
        paymentId: paymentModel.id,
        feeStudentMappingId: feeStudentMappingModel.id,
        name: userModel.name,
        email: userModel.email,
        phone: userModel.phone,
        academicYear: academicYearModel.year,
        receiptType: receiptTypeModel.name,
        feeSlab: feeSlabModel.name,
        programCourse: programCourseModel.name,
        semester: classModel.name,
        shift: shiftModel.name,
        section: sectionModel.name,
      })
      .from(paymentModel)
      .leftJoin(
        feeStudentMappingModel,
        eq(paymentModel.feeStudentMappingId, feeStudentMappingModel.id),
      )
      .leftJoin(
        studentModel,
        eq(studentModel.id, feeStudentMappingModel.studentId),
      )
      .leftJoin(userModel, eq(userModel.id, studentModel.userId))
      .leftJoin(
        feeStructureModel,
        eq(feeStructureModel.id, feeStudentMappingModel.feeStructureId),
      )
      .leftJoin(
        receiptTypeModel,
        eq(receiptTypeModel.id, feeStructureModel.receiptTypeId),
      )
      .leftJoin(
        academicYearModel,
        eq(academicYearModel.id, feeStructureModel.academicYearId),
      )
      .leftJoin(
        programCourseModel,
        eq(programCourseModel.id, feeStructureModel.programCourseId),
      )
      .leftJoin(classModel, eq(classModel.id, feeStructureModel.classId))
      .leftJoin(shiftModel, eq(shiftModel.id, feeStructureModel.shiftId))
      .leftJoin(
        promotionModel,
        and(
          eq(promotionModel.studentId, studentModel.id),
          eq(promotionModel.programCourseId, feeStructureModel.programCourseId),
          eq(promotionModel.classId, feeStructureModel.classId),
          eq(promotionModel.shiftId, feeStructureModel.shiftId),
        ),
      )
      .leftJoin(sectionModel, eq(sectionModel.id, promotionModel.sectionId))
      .leftJoin(
        feeGroupPromotionMappingModel,
        eq(
          feeGroupPromotionMappingModel.id,
          feeStudentMappingModel.feeGroupPromotionMappingId,
        ),
      )
      .leftJoin(
        feeGroupModel,
        eq(feeGroupModel.id, feeGroupPromotionMappingModel.feeGroupId),
      )
      .leftJoin(feeSlabModel, eq(feeSlabModel.id, feeGroupModel.feeSlabId))
      .where(eq(paymentModel.id, newPayment.id));

    return {
      newPayment,
      userInfo,
    };
  });
}

export async function attachPaytmTxnTokenToPayment(params: {
  orderId: string;
  txnToken: string;
}): Promise<void> {
  const orderId = params.orderId?.trim();
  const txnToken = params.txnToken?.trim();
  if (!orderId || !txnToken) return;

  const [existing] = await db
    .select({ gatewayResponse: paymentModel.gatewayResponse })
    .from(paymentModel)
    .where(eq(paymentModel.orderId, orderId));

  const merged = mergeGatewayResponse(existing?.gatewayResponse, {
    paytm: { txnToken },
  }) as GatewayResponseShape | null;

  await db
    .update(paymentModel)
    .set({ gatewayResponse: merged ?? undefined })
    .where(eq(paymentModel.orderId, orderId));
}

// READ by ID
export async function findPaymentById(id: number) {
  const [payment] = await db
    .select()
    .from(paymentModel)
    .where(eq(paymentModel.id, id));

  return payment || null;
}

// READ by Order ID
export async function findPaymentByOrderId(orderId: string) {
  const [payment] = await db
    .select()
    .from(paymentModel)
    .where(eq(paymentModel.orderId, orderId));

  return payment || null;
}

// READ by Application Form ID (single)
export async function findPaymentInfoByApplicationFormId(
  applicationFormId: number,
) {
  const [foundPayment] = await db
    .select()
    .from(paymentModel)
    .where(
      and(
        eq(paymentModel.context, "ADMISSION_APPLICATION_FEE"),
        sql`(${paymentModel.gatewayResponse}->'meta'->>'applicationFormId')::int = ${applicationFormId}`,
      ),
    );

  return foundPayment;
}

// READ by Application Form ID (all)
export async function findPaymentsByApplicationFormId(
  applicationFormId: number,
) {
  return await db
    .select()
    .from(paymentModel)
    .where(
      and(
        eq(paymentModel.context, "ADMISSION_APPLICATION_FEE"),
        sql`(${paymentModel.gatewayResponse}->'meta'->>'applicationFormId')::int = ${applicationFormId}`,
      ),
    );
}

// UPDATE payment on success/failure — uses a transaction with row-level lock
// to prevent duplicate callbacks from double-crediting amountPaid.
export async function updatePaymentByOrderId(
  orderId: string,
  updates: {
    status: "SUCCESS" | "FAILED";
    transactionId?: string;
    bankTxnId?: string;
    txnDate?: Date | string;
    mid?: string;
    txnAmount?: string;
    bankName?: string;
    txnGatewayName?: string;
    txnPaymentMode?: string;
    paymentOption?:
      | "UPI"
      | "WALLET"
      | "NET_BANKING"
      | "CREDIT_CARD"
      | "DEBIT_CARD"
      | "PAYTM_BALANCE";
    checksumHash?: string;
    cardScheme?: string;
    gatewayResponse?: object;
  },
) {
  const updatedPayment = await db.transaction(async (tx) => {
    // SELECT FOR UPDATE: blocks concurrent callbacks for the same orderId
    const [existingPayment] = await tx
      .select()
      .from(paymentModel)
      .where(eq(paymentModel.orderId, orderId))
      .for("update");

    if (!existingPayment) {
      throw new Error(`Payment not found for orderId: ${orderId}`);
    }

    // Manual entries have higher precedence than gateway callbacks; the gateway
    // is not allowed to overwrite a row that has already been recorded manually.
    if (existingPayment.isManualEntry) {
      console.log(
        `Payment ${orderId} is a manual entry; ignoring gateway callback`,
      );
      return existingPayment;
    }

    // Idempotency: skip if already processed with same txnId
    if (
      existingPayment.txnId &&
      updates.transactionId &&
      existingPayment.txnId === updates.transactionId
    ) {
      console.log(
        `Duplicate payment callback detected for orderId: ${orderId}, skipping update`,
      );
      return existingPayment;
    }

    // Idempotency: skip if payment already in a terminal state matching the update
    if (existingPayment.status === "SUCCESS" && updates.status === "SUCCESS") {
      console.log(
        `Payment ${orderId} already SUCCESS, skipping duplicate SUCCESS callback`,
      );
      return existingPayment;
    }

    const mergedGateway = mergeGatewayResponse(
      existingPayment.gatewayResponse,
      updates.gatewayResponse,
    ) as GatewayResponseShape | null;

    const txnDateStr =
      formatTxnDate(updates.txnDate) ??
      (existingPayment.txnDate as string | undefined) ??
      null;

    // Step 1: Always persist the row's latest status / txn details first.
    const [updated] = await tx
      .update(paymentModel)
      .set(
        omitUndefined({
          status: updates.status,
          txnId: updates.transactionId ?? existingPayment.txnId ?? undefined,
          bankTxnId:
            updates.bankTxnId ?? existingPayment.bankTxnId ?? undefined,
          txnDate: txnDateStr ?? undefined,
          mid: updates.mid ?? undefined,
          txnAmount: updates.txnAmount ?? undefined,
          bankName: updates.bankName ?? undefined,
          txnGatewayName: updates.txnGatewayName ?? undefined,
          txnPaymentMode: updates.txnPaymentMode ?? undefined,
          paymentOption:
            updates.paymentOption ??
            mapTxnPaymentModeToPaymentOption(updates.txnPaymentMode) ??
            undefined,
          checksumHash: updates.checksumHash ?? undefined,
          cardScheme: updates.cardScheme ?? undefined,
          gatewayResponse: mergedGateway ?? undefined,
        }),
      )
      .where(eq(paymentModel.orderId, orderId))
      .returning();

    const meta = parseGatewayMeta(updated ?? null);

    if (
      updated?.context === "ADMISSION_APPLICATION_FEE" &&
      meta.applicationFormId
    ) {
      if (updates.status === "SUCCESS") {
        await tx
          .update(applicationFormModel)
          .set({ formStatus: "PAYMENT_SUCCESS" })
          .where(eq(applicationFormModel.id, meta.applicationFormId));
      }
    }

    // Step 2: For a SUCCESS callback on a fee/admission payment, try to link.
    //   - If another payment row for the same fee mapping is already
    //     `isLinked = true`, this one becomes a saved-but-dead success
    //     (audit only). The mapping is NOT re-credited.
    //   - Otherwise this row becomes the canonical one for the mapping:
    //     set `isLinked = true` and write `amountPaid = this.amount` on the mapping.
    if (
      isFeeStudentMappingPaymentContext(updated?.context ?? null) &&
      updates.status === "SUCCESS" &&
      updated?.id
    ) {
      const fsmId =
        updated.feeStudentMappingId ?? meta.feeStudentMappingId ?? null;
      if (fsmId) {
        const [mapping] = await tx
          .select({ id: feeStudentMappingModel.id })
          .from(feeStudentMappingModel)
          .where(eq(feeStudentMappingModel.id, fsmId))
          .for("update");

        if (mapping) {
          const [alreadyLinked] = await tx
            .select({ id: paymentModel.id })
            .from(paymentModel)
            .where(
              and(
                eq(paymentModel.feeStudentMappingId, mapping.id),
                eq(paymentModel.isLinked, true),
              ),
            )
            .limit(1);

          if (!alreadyLinked) {
            await tx
              .update(paymentModel)
              .set({ isLinked: true })
              .where(eq(paymentModel.id, updated.id));

            await tx
              .update(feeStudentMappingModel)
              .set({ amountPaid: Number(updated.amount) || 0 })
              .where(eq(feeStudentMappingModel.id, mapping.id));
          } else {
            console.log(
              `[FEE] Payment ${orderId} succeeded for fee_mapping ${mapping.id}, but another payment is already linked — kept as audit-only.`,
            );
          }
        }
      }
    }

    return updated ?? null;
  });

  await ensureFeeReceiptAfterSuccessfulFeePayment(updatedPayment);
  scheduleFeesDashboardBroadcast("payment_updated");

  return updatedPayment;
}

export interface EnrichPaytmPaymentOptions {
  /** Required for merchant + PCF Paytm APIs. */
  txnToken?: string;
  /** `YYYY-MM-DD` for Settlement Order Detail (production only). */
  transactionDate?: string;
  pcfPayMethods?: PaytmPCFDetailsRequest["body"]["payMethods"];
  skipMerchant?: boolean;
  skipPcf?: boolean;
  skipTransactionStatus?: boolean;
  skipSettlement?: boolean;
}

/**
 * Loads Paytm transaction / merchant / PCF / settlement payloads and persists mapped columns
 * on `payments` (+ optional `settlement_details` rows). Safe to call after payment success.
 */
export async function enrichPaymentWithPaytmDetails(
  orderId: string,
  options: EnrichPaytmPaymentOptions = {},
): Promise<{ success: boolean; error?: string }> {
  const trimmed = orderId?.trim();
  if (!trimmed) {
    return { success: false, error: "orderId is required" };
  }
  console.info("[Paytm enrich] start", {
    orderId: trimmed,
    hasTxnToken: !!options.txnToken,
    skipMerchant: !!options.skipMerchant,
    skipPcf: !!options.skipPcf,
    skipTransactionStatus: !!options.skipTransactionStatus,
    skipSettlement: !!options.skipSettlement,
  });

  let payment = await findPaymentByOrderId(trimmed);
  if (!payment?.id) {
    return {
      success: false,
      error: `Payment not found for orderId: ${trimmed}`,
    };
  }

  const paytmSnapshot: Record<string, unknown> = {};
  const columnPatch: Record<string, unknown> = {};

  if (!options.skipTransactionStatus && isPaytmConfigured()) {
    const ts = await getPaytmTransactionStatusDetails(trimmed);
    if (ts.success && ts.data) {
      paytmSnapshot.transactionStatus = ts.data;
      Object.assign(columnPatch, mapTxnStatusBodyToPaymentColumns(ts.data));
      logPaytmEnrich("info", "transactionStatus.success", {
        orderId: trimmed,
        resultStatus: ts.data.resultInfo?.resultStatus,
        resultCode: ts.data.resultInfo?.resultCode,
        response: previewJson(ts.data),
      });

      const resultStatus = ts.data.resultInfo?.resultStatus;
      const normalized =
        typeof resultStatus === "string"
          ? resultStatus.trim().toUpperCase()
          : "";
      if (normalized === "TXN_SUCCESS" && payment.status !== "SUCCESS") {
        const txnDateRaw = ts.data.txnDate;
        await updatePaymentByOrderId(trimmed, {
          status: "SUCCESS",
          transactionId: ts.data.txnId ?? undefined,
          bankTxnId: ts.data.bankTxnId,
          txnDate:
            txnDateRaw != null && String(txnDateRaw).trim() !== ""
              ? new Date(String(txnDateRaw))
              : undefined,
          mid: ts.data.mid,
          txnAmount: ts.data.txnAmount,
          bankName: ts.data.bankName,
          txnGatewayName: ts.data.gatewayName,
          txnPaymentMode: ts.data.paymentMode,
          gatewayResponse: {
            paytm: { promoteSuccessFromTxnStatus: true },
          },
        });
        const reloaded = await findPaymentByOrderId(trimmed);
        if (reloaded) {
          payment = reloaded;
        }
      }
    } else if (ts.error) {
      paytmSnapshot.transactionStatusError = ts.error;
      logPaytmEnrich("error", "transactionStatus.error", {
        orderId: trimmed,
        error: ts.error,
      });
    }
  }

  const token = options.txnToken?.trim();
  if (!token) {
    paytmSnapshot.merchantDetailsError =
      paytmSnapshot.merchantDetailsError ??
      "Missing txnToken (required for merchant/PCF)";
    paytmSnapshot.pcfError =
      paytmSnapshot.pcfError ?? "Missing txnToken (required for merchant/PCF)";
  }

  if (token && !options.skipMerchant && isPaytmConfigured()) {
    const effectiveMid =
      (columnPatch.mid as string | undefined) ||
      (payment.mid as string | undefined) ||
      undefined;
    const m = await getPaytmMerchantDetails(trimmed, token, {
      mid: effectiveMid,
    });
    if (m.success && m.merchantDetails) {
      paytmSnapshot.merchantDetails = m.merchantDetails;
      Object.assign(
        columnPatch,
        mapMerchantToPaymentColumns(m.merchantDetails),
      );
      logPaytmEnrich("info", "merchant.success", {
        orderId: trimmed,
        response: previewJson(m.merchantDetails),
      });
    } else if (m.error) {
      paytmSnapshot.merchantDetailsError = m.error;
      logPaytmEnrich("error", "merchant.error", {
        orderId: trimmed,
        error: m.error,
      });
    }
  }

  if (token && !options.skipPcf && isPaytmConfigured()) {
    const payMethods =
      (options.pcfPayMethods?.length ?? 0) > 0
        ? options.pcfPayMethods!
        : [{ payMethod: "UPI" as const }];
    const effectiveMid =
      (columnPatch.mid as string | undefined) ||
      (payment.mid as string | undefined) ||
      undefined;
    const pcf = await getPaytmPCFDetails({
      orderId: trimmed,
      txnToken: token,
      mid: effectiveMid,
      payMethods,
    });
    if (pcf.success && pcf.data) {
      paytmSnapshot.pcf = pcf.data;
      Object.assign(columnPatch, mapPcfBodyToPaymentColumns(pcf.data));
      logPaytmEnrich("info", "pcf.success", {
        orderId: trimmed,
        resultStatus: pcf.data.resultInfo?.resultStatus,
        resultCode: pcf.data.resultInfo?.resultCode,
        response: previewJson(pcf.data),
      });
    } else if (pcf.error) {
      paytmSnapshot.pcfError = pcf.error;
      logPaytmEnrich("error", "pcf.error", {
        orderId: trimmed,
        error: pcf.error,
      });
    }
  }

  if (!options.skipSettlement && isPaytmSettlementConfigured()) {
    const txDate =
      options.transactionDate?.trim() ||
      (columnPatch.txnDate as string | undefined)?.slice(0, 10) ||
      (payment.txnDate as string | undefined)?.slice(0, 10);
    if (txDate) {
      const st = await getPaytmSettlementOrderDetail({
        orderId: trimmed,
        transactionDate: txDate,
      });
      if (st.success && st.orders?.length) {
        paytmSnapshot.settlementOrders = st.orders;
        logPaytmEnrich("info", "settlement.success", {
          orderId: trimmed,
          transactionDate: txDate,
          ordersCount: st.orders.length,
          response: previewJson(st.orders),
        });
        await db
          .delete(settlementModel)
          .where(eq(settlementModel.paymentId, payment.id));
        for (const row of st.orders) {
          await db
            .insert(settlementModel)
            .values(
              mapSettlementOrderToInsert(
                payment.id,
                row as Record<string, unknown>,
              ),
            );
        }
      } else if (st.error) {
        paytmSnapshot.settlementError = st.error;
        logPaytmEnrich("error", "settlement.error", {
          orderId: trimmed,
          transactionDate: txDate,
          error: st.error,
        });
      }
    }
  }

  const existingGr = payment.gatewayResponse as GatewayResponseShape | null;
  const nextGateway: GatewayResponseShape = {
    ...(existingGr && typeof existingGr === "object" ? existingGr : {}),
    meta: existingGr?.meta,
    paytm: {
      ...(existingGr?.paytm ?? {}),
      ...paytmSnapshot,
      enrichedAt: new Date().toISOString(),
    },
  };

  if (
    Object.keys(columnPatch).length === 0 &&
    Object.keys(paytmSnapshot).length === 0
  ) {
    await ensureFeeReceiptAfterSuccessfulFeePayment(
      await findPaymentByOrderId(trimmed),
    );
    return { success: true };
  }

  await db
    .update(paymentModel)
    .set({
      ...omitUndefined(columnPatch),
      gatewayResponse: nextGateway,
    })
    .where(eq(paymentModel.orderId, trimmed));

  await ensureFeeReceiptAfterSuccessfulFeePayment(
    await findPaymentByOrderId(trimmed),
  );

  return { success: true };
}

// DELETE
export async function deletePayment(id: number) {
  const deleted = await db
    .delete(paymentModel)
    .where(eq(paymentModel.id, id))
    .returning();

  return deleted.length > 0;
}

const ORDER_ID_PREFIX = "ap";

/**
 * Generates order IDs strictly as: ap1000, ap1001, ap1002, ...
 * Uses a DB sequence and first syncs it with the current max numeric ap order id
 * stored in `payments.order_id` to avoid reusing old ids after resets/restores.
 */
export async function generateOrderId(): Promise<string> {
  await db.execute(
    sql`CREATE SEQUENCE IF NOT EXISTS payment_order_id_seq START WITH 1000 INCREMENT BY 1`,
  );

  // Ensure sequence continues after the highest existing ap<number> order id.
  // Use case-insensitive matching so any legacy uppercase ids (AP1000, AS1000) are also respected.
  await db.execute(sql`
    SELECT setval(
      'payment_order_id_seq',
      GREATEST(
        COALESCE((SELECT last_value::bigint FROM payment_order_id_seq), 999),
        COALESCE((
          SELECT MAX((regexp_match(order_id, '^[a-zA-Z]+([0-9]+)$'))[1]::bigint)
          FROM payments
          WHERE order_id ~* '^[a-zA-Z]+[0-9]+$'
        ), 999)
      ),
      true
    )
  `);

  const result = await db.execute(
    sql`SELECT nextval('payment_order_id_seq') as nextval`,
  );
  const row = (result as unknown as { rows: Record<string, unknown>[] })
    ?.rows?.[0];
  const nextNum = Number.parseInt(String(row?.nextval), 10);
  if (!Number.isFinite(nextNum)) {
    throw new Error("Failed to generate numeric payment order id");
  }

  console.log(
    "[PAYMENT_SERVICE] Generated order id:",
    `${ORDER_ID_PREFIX}${nextNum}`,
  );
  return `${ORDER_ID_PREFIX}${nextNum}`;
}
