import { db } from "@/db/index.js";
import {
  paymentModel,
  settlementModel,
} from "@repo/db/schemas/models/payments";
import { feeStudentMappingModel } from "@repo/db/schemas/models/fees";
import { studentModel } from "@repo/db/schemas/models/user";
import { applicationFormModel } from "@/features/admissions/models/application-form.model.js";
import { and, desc, eq, sql } from "drizzle-orm";
import type {
  PaytmPCFDetailsRequest,
  PaytmPCFDetailsResponse,
  PaytmBINDetailsResponse,
  PaytmTransactionStatusResponse,
} from "@repo/db/dtos/payments";
import {
  getPaytmBINDetails,
  getPaytmMerchantDetails,
  getPaytmPCFDetails,
  getPaytmSettlementOrderDetail,
  getPaytmTransactionStatusDetails,
} from "./paytm-payment.service.js";
import {
  isPaytmConfigured,
  isPaytmSettlementConfigured,
} from "../config/paytm.config.js";

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
  let resolvedUserId: number | null = null;
  if (payment.studentId) {
    const [student] = await db
      .select({ userId: studentModel.userId })
      .from(studentModel)
      .where(eq(studentModel.id, payment.studentId));
    if (student?.userId) resolvedUserId = student.userId;
  }
  const [newPayment] = await db
    .insert(paymentModel)
    .values({
      userId: resolvedUserId ?? undefined,
      context: "FEE",
      amount: Number.isFinite(amountNum) ? amountNum : 0,
      paymentMode: "ONLINE",
      paymentGatewayVendor: payment.gatewayName ?? "PAYTM",
      orderId: payment.orderId,
      status: "PENDING",
      remarks: payment.remarks ?? null,
      gatewayResponse: {
        meta: { feeStudentMappingId: payment.feeStudentMappingId },
      } satisfies GatewayResponseShape,
    })
    .returning();

  if (newPayment?.id) {
    await db
      .update(feeStudentMappingModel)
      .set({ paymentId: newPayment.id })
      .where(eq(feeStudentMappingModel.id, payment.feeStudentMappingId));
  }

  return newPayment;
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

// UPDATE payment on success/failure
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
  const [existingPayment] = await db
    .select()
    .from(paymentModel)
    .where(eq(paymentModel.orderId, orderId));

  if (!existingPayment) {
    throw new Error(`Payment not found for orderId: ${orderId}`);
  }

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

  const mergedGateway = mergeGatewayResponse(
    existingPayment.gatewayResponse,
    updates.gatewayResponse,
  ) as GatewayResponseShape | null;

  const txnDateStr =
    formatTxnDate(updates.txnDate) ??
    (existingPayment.txnDate as string | undefined) ??
    null;

  const [updated] = await db
    .update(paymentModel)
    .set(
      omitUndefined({
        status: updates.status,
        txnId: updates.transactionId ?? existingPayment.txnId ?? undefined,
        bankTxnId: updates.bankTxnId ?? existingPayment.bankTxnId ?? undefined,
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
      await db
        .update(applicationFormModel)
        .set({ formStatus: "PAYMENT_SUCCESS" })
        .where(eq(applicationFormModel.id, meta.applicationFormId));
    }
  }

  if (
    updated?.context === "FEE" &&
    updates.status === "SUCCESS" &&
    updated.id
  ) {
    try {
      const [mapping] = await db
        .select()
        .from(feeStudentMappingModel)
        .where(eq(feeStudentMappingModel.paymentId, updated.id));

      const target =
        mapping ??
        (meta.feeStudentMappingId
          ? (
              await db
                .select()
                .from(feeStudentMappingModel)
                .where(eq(feeStudentMappingModel.id, meta.feeStudentMappingId))
            )[0]
          : undefined);

      if (target) {
        const amountPaid = Number(updated.amount);
        const existingPaid = target.amountPaid ?? 0;
        const newTotalPaid = existingPaid + amountPaid;
        const totalPayable = target.totalPayable ?? 0;
        await db
          .update(feeStudentMappingModel)
          .set({
            amountPaid: newTotalPaid,
            paymentId: updated.id,
          })
          .where(eq(feeStudentMappingModel.id, target.id));
      }
    } catch {
      // non-blocking
    }
  }

  return updated ?? null;
}

function mapBinBodyToPaymentColumns(
  body: PaytmBINDetailsResponse["body"],
): Record<string, unknown> {
  const b = body.binDetail ?? ({} as Record<string, unknown>);
  return omitUndefined({
    bin: (b as { bin?: string }).bin,
    binIssuingBank: (b as { issuingBank?: string }).issuingBank,
    binIssuingBankCode: (b as { issuingBankCode?: string }).issuingBankCode,
    binPaymentMode: (b as { paymentMode?: string }).paymentMode,
    binChannelName: (b as { channelName?: string }).channelName,
    binChannelCode: (b as { channelCode?: string }).channelCode,
    binCnMin: (b as { cnMin?: string }).cnMin,
    binCnMax: (b as { cnMax?: string }).cnMax,
    binCvvR: (b as { cvvR?: string }).cvvR,
    binCvvL: (b as { cvvL?: string }).cvvL,
    binExpR: (b as { expR?: string }).expR,
    isbinIndian: (b as { IsIndian?: string }).IsIndian,
    isbinActive: (b as { IsActive?: string }).IsActive,
    binCountryCode: (b as { countryCode?: string }).countryCode,
    binCountryName: (b as { countryName?: string }).countryName,
    binCountryNumericCode: (b as { countryNumericCode?: string })
      .countryNumericCode,
    binCurrencyCode: (b as { currencyCode?: string }).currencyCode,
    binCurrencyName: (b as { currencyName?: string }).currencyName,
    binCurrencyNumericCode: (b as { currencyNumericCode?: string })
      .currencyNumericCode,
    binCurrencySymbol: (b as { currencySymbol?: string }).currencySymbol,
    isBinEligibleForCoft: (b as { isEligibleForCoft?: boolean })
      .isEligibleForCoft,
    isBinCoftPaymentSupported: (b as { isCoftPaymentSupported?: boolean })
      .isCoftPaymentSupported,
    isBinEligibleForAltId: (b as { isEligibleForAltId?: boolean })
      .isEligibleForAltId,
    isBinAltIdPaymentSupported: (b as { isAltIdPaymentSupported?: boolean })
      .isAltIdPaymentSupported,
    hasLowSuccessRateStatus: (
      body.hasLowSuccessRate as { status?: boolean } | undefined
    )?.status,
    hasLowSuccessRateMsg: (
      body.hasLowSuccessRate as { msg?: string } | undefined
    )?.msg,
    IsEmiAvailable:
      typeof (body as { IsEmiAvailable?: string }).IsEmiAvailable === "string"
        ? (body as { IsEmiAvailable: string }).IsEmiAvailable.toLowerCase() ===
          "true"
        : undefined,
    iconUrl: (body as { iconUrl?: string }).iconUrl,
    errorMessage: (body as { errorMessage?: string }).errorMessage,
    isSubscriptionAvailable: (body as { isSubscriptionAvailable?: boolean })
      .isSubscriptionAvailable,
    isHybridDisabled: (body as { isHybridDisabled?: boolean }).isHybridDisabled,
    prepaidCard: (body as { prepaidCard?: boolean }).prepaidCard
      ? "true"
      : undefined,
    prepaidCardMaxAmount: (body as { prepaidCardMaxAmount?: string })
      .prepaidCardMaxAmount,
    nativeOtpEligible: (body as { nativeOtpEligible?: string })
      .nativeOtpEligible,
  });
}

function extractBinFromGatewayResponse(
  gatewayResponse: unknown,
): string | null {
  const g = gatewayResponse as Record<string, unknown> | null | undefined;
  if (!g || typeof g !== "object") return null;
  const candidates = [
    g.BIN,
    g.bin,
    g.cardBin,
    g.CARD_BIN,
    (g.cardNumber as string | undefined)?.slice(0, 9),
  ];
  for (const c of candidates) {
    if (typeof c === "string") {
      const digits = c.replace(/\D/g, "");
      if (digits.length >= 9) return digits.slice(0, 9);
    }
  }
  return null;
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

  const payment = await findPaymentByOrderId(trimmed);
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

  // BIN details (requires txnToken + BIN first 9 digits)
  if (token && isPaytmConfigured()) {
    const bin = extractBinFromGatewayResponse(payment.gatewayResponse) ?? null;
    if (!bin) {
      paytmSnapshot.binError =
        "Missing BIN (first 9 digits) for BIN details API";
      logPaytmEnrich("error", "bin.missing", { orderId: trimmed });
    } else {
      const effectiveMid =
        (columnPatch.mid as string | undefined) ||
        (payment.mid as string | undefined) ||
        undefined;
      const pm = (payment.txnPaymentMode ?? "").toUpperCase();
      const paymentMode =
        pm === "CC" || pm === "CREDIT_CARD"
          ? "CREDIT_CARD"
          : pm === "DC" || pm === "DEBIT_CARD"
            ? "DEBIT_CARD"
            : undefined;
      const binRes = await getPaytmBINDetails({
        orderId: trimmed,
        txnToken: token,
        bin,
        paymentMode,
        mid: effectiveMid,
      });
      if (binRes.success && binRes.data) {
        paytmSnapshot.bin = binRes.data;
        Object.assign(columnPatch, mapBinBodyToPaymentColumns(binRes.data));
        logPaytmEnrich("info", "bin.success", {
          orderId: trimmed,
          bin,
          resultStatus: binRes.data.resultInfo?.resultStatus,
          resultCode: binRes.data.resultInfo?.resultCode,
          response: previewJson(binRes.data),
        });
      } else if (binRes.error) {
        paytmSnapshot.binError = binRes.error;
        logPaytmEnrich("error", "bin.error", {
          orderId: trimmed,
          bin,
          error: binRes.error,
        });
      }
    }
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
    return { success: true };
  }

  await db
    .update(paymentModel)
    .set({
      ...omitUndefined(columnPatch),
      gatewayResponse: nextGateway,
    })
    .where(eq(paymentModel.orderId, trimmed));

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

const ORDER_ID_SUFFIX = "AS";
const ORDER_ID_START = 1000;

export async function generateOrderId() {
  const [latest] = await db
    .select({ orderId: paymentModel.orderId })
    .from(paymentModel)
    .where(sql`${paymentModel.orderId} LIKE '%${sql.raw(ORDER_ID_SUFFIX)}'`)
    .orderBy(desc(paymentModel.id))
    .limit(1);

  let nextNum = ORDER_ID_START;
  if (latest?.orderId) {
    const numericPart = parseInt(
      latest.orderId.replace(ORDER_ID_SUFFIX, ""),
      10,
    );
    if (!isNaN(numericPart)) nextNum = numericPart + 1;
  }

  return `${nextNum}${ORDER_ID_SUFFIX}`;
}
