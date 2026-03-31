/**
 * Paytm Payment Gateway service.
 * Uses raw Initiate Transaction API (docs format) for reliability.
 * Docs: https://business.paytm.com/docs/api/initiate-transaction-api/
 */

import { createRequire } from "module";
import {
  paytmConfig,
  isPaytmConfigured,
  getPaytmClientId,
  isPaytmSettlementConfigured,
  getPaytmSettlementClientId,
} from "../config/paytm.config.js";
import axios from "axios";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import {
  createDefaultPaytmDowntimeConfig,
  type PaytmCurrentDowntimeStateItem,
  type PaytmBINDetailsRequest,
  type PaytmBINDetailsResponse,
  type PaytmFetchCurrentDowntimeResponseBody,
  type PaytmPCFDetailsRequest,
  type PaytmPCFDetailsResponse,
  type PaytmPaymentOptionRequest,
  type PaytmSettlementDetailsResponse,
  type PaytmTransactionStatusRequest,
  type PaytmTransactionStatusResponse,
  type TmpPaytmPaymentOptionResponse,
} from "@repo/db/dtos/payments";

const require = createRequire(import.meta.url);
const PaytmChecksum = require("paytmchecksum");
const Paytm = require("paytm-pg-node-sdk");

const PAYTM_MID = process.env.PAYTM_MID!;

let paytmInitialized = false;

function initPaytm() {
  if (paytmInitialized || !isPaytmConfigured()) return;
  Paytm.MerchantProperties.initialize(
    paytmConfig.environment === "PRODUCTION"
      ? Paytm.LibraryConstants.PRODUCTION_ENVIRONMENT
      : Paytm.LibraryConstants.STAGING_ENVIRONMENT,
    paytmConfig.mid,
    paytmConfig.merchantKey,
    paytmConfig.clientId || paytmConfig.mid,
    paytmConfig.website,
  );
  paytmInitialized = true;
}

export interface InitiatePaymentParams {
  orderId: string;
  amount: string; // e.g. "500.00"
  custId: string;
  email?: string;
  mobile?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  pincode?: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  txnToken?: string;
  error?: string;
}

/**
 * Create transaction token using raw Initiate Transaction API.
 * Matches Paytm docs format: requestType, mid, websiteName, orderId, callbackUrl, txnAmount, userInfo.
 */
export async function createPaytmTxnToken(
  params: InitiatePaymentParams,
): Promise<InitiatePaymentResult> {
  if (!isPaytmConfigured()) {
    return { success: false, error: "Paytm is not configured" };
  }
  if (paytmConfig.callbackUrl.includes("localhost")) {
    return {
      success: false,
      error:
        "Paytm rejects localhost callback URLs. Use ngrok (e.g. https://xxx.ngrok.io/api/payments/callback) and set PAYTM_CALLBACK_URL in .env",
    };
  }

  const amountStr = String(Number(params.amount).toFixed(2));
  const body: Record<string, unknown> = {
    requestType: "Payment",
    mid: paytmConfig.mid,
    websiteName: paytmConfig.website,
    orderId: params.orderId,
    callbackUrl: paytmConfig.callbackUrl,
    txnAmount: {
      value: amountStr,
      currency: "INR",
    },
    userInfo: {
      custId: params.custId,
    },
  };
  if (params.email)
    (body.userInfo as Record<string, string>).email = params.email;
  if (params.mobile)
    (body.userInfo as Record<string, string>).mobile = params.mobile;

  try {
    const signature = await PaytmChecksum.generateSignature(
      JSON.stringify(body),
      paytmConfig.merchantKey,
    );
    const payload = { head: { signature }, body };

    const hostname =
      paytmConfig.environment === "PRODUCTION"
        ? "secure.paytmpayments.com"
        : "securestage.paytmpayments.com";
    const url = `https://${hostname}/theia/api/v1/initiateTransaction?mid=${paytmConfig.mid}&orderId=${params.orderId}`;

    const response = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });

    const resBody = response?.data?.body ?? response?.data;
    const resultInfo = resBody?.resultInfo ?? {};
    const resultStatus = resultInfo?.resultStatus ?? resBody?.resultStatus;
    const resultMsg = resultInfo?.resultMsg ?? resBody?.resultMsg;
    const txnToken = resBody?.txnToken;

    if (resultStatus === "S" && txnToken) {
      return { success: true, txnToken };
    }

    const errorMsg = resultMsg || "Failed to create transaction token";
    console.error("[Paytm] createTxnToken failed:", {
      resultStatus,
      resultMsg,
      resultCode: resultInfo?.resultCode,
    });
    return { success: false, error: String(errorMsg) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Paytm] createTxnToken exception:", err);
    return { success: false, error: message };
  }
}

export interface PaymentStatusResult {
  success: boolean;
  orderId?: string;
  txnId?: string;
  bankTxnId?: string;
  status?: "TXN_SUCCESS" | "TXN_FAILURE" | "PENDING";
  amount?: string;
  txnDate?: string;
  error?: string;
}

/**
 * Get payment status for an order.
 */
export async function getPaytmPaymentStatus(
  orderId: string,
): Promise<PaymentStatusResult> {
  if (!isPaytmConfigured()) {
    return { success: false, error: "Paytm is not configured" };
  }
  initPaytm();

  try {
    const readTimeout = 80000;
    const paymentStatusDetailBuilder = new Paytm.PaymentStatusDetailBuilder(
      orderId,
    );
    const paymentStatusDetail = paymentStatusDetailBuilder
      .setReadTimeout(readTimeout)
      .build();
    const response = await Promise.resolve(
      Paytm.Payment.getPaymentStatus(paymentStatusDetail),
    );

    const body = response?.body?.body ?? response?.body;
    const resultInfo = body?.resultInfo ?? response?.body?.resultInfo;
    if (!body) {
      return {
        success: false,
        error: resultInfo?.resultMsg ?? "Invalid response",
      };
    }

    const resultStatus = resultInfo?.resultStatus ?? "";
    const status: PaymentStatusResult["status"] =
      resultStatus === "TXN_SUCCESS"
        ? "TXN_SUCCESS"
        : resultStatus === "TXN_FAILURE"
          ? "TXN_FAILURE"
          : "PENDING";

    return {
      success: true,
      orderId: body.orderId,
      txnId: body.txnId,
      bankTxnId: body.bankTxnId,
      status,
      amount: body.txnAmount?.value ?? body.txnAmount,
      txnDate: body.txnDate,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export interface PaytmTransactionStatusDetailsResult {
  success: boolean;
  /** Order status payload when Paytm returns a valid `body` (check `resultInfo.resultStatus`). */
  data?: PaytmTransactionStatusResponse["body"];
  error?: string;
}

/**
 * Fetch full transaction / order status via Paytm **Transaction Status API v3** (REST + checksum on `body`).
 * Same host family as Initiate Transaction (`secure*.paytmpayments.com`), path `/v3/order/status`.
 *
 * Use this when you need the raw JSON (`txnAmount`, `paymentMode`, `gatewayName`, `txnDate`, etc.).
 * The {@link getPaytmPaymentStatus} helper uses the Paytm Node SDK instead.
 *
 * Docs: https://business.paytm.com/docs/api/v3/transaction-status-api/
 */
export async function getPaytmTransactionStatusDetails(
  orderId: string,
  options?: { txnType?: string },
): Promise<PaytmTransactionStatusDetailsResult> {
  if (!isPaytmConfigured()) {
    return { success: false, error: "Paytm is not configured" };
  }
  const trimmedOrder = orderId?.trim();
  if (!trimmedOrder) {
    return { success: false, error: "orderId is required" };
  }

  const body: PaytmTransactionStatusRequest["body"] = {
    mid: paytmConfig.mid,
    orderId: trimmedOrder,
  };
  if (options?.txnType) {
    body.txnType = options.txnType;
  }

  const signature = await PaytmChecksum.generateSignature(
    JSON.stringify(body),
    paytmConfig.merchantKey,
  );

  const payload: PaytmTransactionStatusRequest = {
    head: {
      version: "v1",
      channelId: "WEB",
      requestTimestamp: String(Date.now()),
      clientId: getPaytmClientId(),
      signature,
    },
    body,
  };

  const hostname =
    paytmConfig.environment === "PRODUCTION"
      ? "secure.paytmpayments.com"
      : "securestage.paytmpayments.com";

  const url = `https://${hostname}/v3/order/status`;

  try {
    const response = await axios.post<unknown>(url, payload, {
      headers: { "Content-Type": "application/json" },
    });

    const data = response.data as {
      body?: PaytmTransactionStatusResponse["body"];
    };
    const apiBody = data?.body;
    if (!apiBody?.resultInfo) {
      return {
        success: false,
        error: "Invalid transaction status response from Paytm",
      };
    }

    return { success: true, data: apiBody };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const d = err.response.data as {
        body?: PaytmTransactionStatusResponse["body"];
        head?: { resultInfo?: { resultMsg?: string; resultCode?: string } };
        message?: string;
      };
      const apiBody = d?.body;
      const ri = apiBody?.resultInfo ?? d?.head?.resultInfo;
      const msg =
        ri?.resultMsg ??
        (typeof d?.message === "string" ? d.message : undefined) ??
        err.message;
      console.error("[Paytm] getPaytmTransactionStatusDetails HTTP error:", {
        status: err.response.status,
        resultMsg: ri?.resultMsg,
        resultCode: ri?.resultCode,
      });
      return { success: false, error: String(msg ?? "Paytm request failed") };
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Paytm] getPaytmTransactionStatusDetails exception:", err);
    return { success: false, error: message };
  }
}

export interface FetchPaytmCurrentDowntimeResult {
  success: boolean;
  states?: PaytmCurrentDowntimeStateItem[];
  raw?: PaytmFetchCurrentDowntimeResponseBody;
  error?: string;
}

/**
 * POST Fetch current downtime API (production host). Checksum on `body`; `head.tokenType` = CHECKSUM.
 * Paytm notes this API is not available on staging.
 *
 * Docs: https://www.paytmpayments.com/docs/api/fetch-current-downtime/
 */
export async function fetchPaytmCurrentDowntime(options?: {
  paymentModes?: string;
  /** Defaults: last 7 days → now (matches Paytm curl shape for `fetch-current-instrument-states`) */
  fromTime?: string;
  toTime?: string;
}): Promise<FetchPaytmCurrentDowntimeResult> {
  if (!isPaytmConfigured()) {
    return { success: false, error: "Paytm is not configured" };
  }
  if (paytmConfig.environment !== "PRODUCTION") {
    return {
      success: false,
      error:
        "Paytm Fetch current downtime API is not hosted on staging. Switch PAYTM_ENVIRONMENT=PRODUCTION.",
    };
  }

  const { fetchCurrentDowntimeUrl } = createDefaultPaytmDowntimeConfig();
  const toTime = options?.toTime ?? new Date().toISOString();
  const fromTime =
    options?.fromTime ??
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const body: Record<string, string> = {
    mid: paytmConfig.mid,
    fromTime,
    toTime,
  };
  if (options?.paymentModes?.trim()) {
    body.paymentModes = options.paymentModes.trim();
  }

  const signature = await PaytmChecksum.generateSignature(
    JSON.stringify(body),
    paytmConfig.merchantKey,
  );

  const head: Record<string, string> = {
    signature,
    tokenType: "CHECKSUM",
  };
  if (paytmConfig.clientId) {
    // Paytm downtime docs use `clientid` (lowercase d) for this API.
    head.clientid = paytmConfig.clientId;
  }

  const payload = { head, body };

  try {
    const response = await axios.post<unknown>(
      fetchCurrentDowntimeUrl,
      payload,
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    const data = response.data as {
      body?: PaytmFetchCurrentDowntimeResponseBody;
    };
    const apiBody =
      data?.body ?? (response.data as PaytmFetchCurrentDowntimeResponseBody);
    const ri = apiBody?.resultInfo;
    const ok =
      !ri ||
      ri.resultCode === "00000000" ||
      ri.resultStatus === "TXN_SUCCESS" ||
      ri.resultStatus === "S";

    if (ri && !ok) {
      return {
        success: false,
        error: ri.resultMsg ?? "Fetch current downtime failed",
        raw: apiBody,
      };
    }

    let states = apiBody?.currentDowntimeStates;
    if (typeof states === "string") {
      try {
        states = JSON.parse(states) as PaytmCurrentDowntimeStateItem[];
      } catch {
        states = [];
      }
    }
    if (!Array.isArray(states)) {
      states = [];
    }

    return { success: true, states, raw: apiBody };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      const rawData = err.response.data;
      const d = rawData as {
        body?: PaytmFetchCurrentDowntimeResponseBody;
        message?: string;
        resultMsg?: string;
        resultCode?: string;
      };
      const ri = d?.body?.resultInfo;
      const msg =
        ri?.resultMsg ??
        (typeof d?.message === "string" ? d.message : undefined) ??
        (typeof d?.resultMsg === "string" ? d.resultMsg : undefined) ??
        err.message;
      const payloadPreview =
        typeof rawData === "string"
          ? rawData.slice(0, 500)
          : JSON.stringify(rawData)?.slice(0, 800);
      console.error("[Paytm] fetchPaytmCurrentDowntime HTTP error:", {
        status: err.response.status,
        resultMsg: ri?.resultMsg,
        resultCode: ri?.resultCode ?? d?.resultCode,
        responseBody: payloadPreview,
      });
      return {
        success: false,
        error: String(msg ?? "Paytm downtime request failed"),
        raw: d?.body,
      };
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Paytm] fetchPaytmCurrentDowntime exception:", err);
    return { success: false, error: message };
  }
}

export type PaytmMerchantDetails =
  TmpPaytmPaymentOptionResponse["body"]["merchantDetails"];

export type PaytmAddMoneyMerchantDetails =
  TmpPaytmPaymentOptionResponse["body"]["addMoneyMerchantDetails"];

export interface PaytmMerchantDetailsResult {
  success: boolean;
  merchantDetails?: PaytmMerchantDetails;
  addMoneyMerchantDetails?: PaytmAddMoneyMerchantDetails;
  error?: string;
}

/**
 * Fetch merchant profile (VPA, name, logo, MCC) via Paytm Fetch Payment Options API v2.
 * Requires the same `txnToken` returned by Initiate Transaction for this `orderId`.
 *
 * Docs: https://developer.paytm.com/docs/api/v2/fetch-payment-options-api/
 */
export async function getPaytmMerchantDetails(
  orderId: string,
  txnToken: string,
  options?: { mid?: string },
): Promise<PaytmMerchantDetailsResult> {
  if (!isPaytmConfigured()) {
    return { success: false, error: "Paytm is not configured" };
  }
  const trimmedOrder = orderId?.trim();
  const trimmedToken = txnToken?.trim();
  if (!trimmedOrder || !trimmedToken) {
    return { success: false, error: "orderId and txnToken are required" };
  }

  const hostname =
    paytmConfig.environment === "PRODUCTION"
      ? "secure.paytmpayments.com"
      : "securestage.paytmpayments.com";

  const mid = options?.mid?.trim() || paytmConfig.mid;

  const url = `https://${hostname}/theia/api/v2/fetchPaymentOptions?mid=${encodeURIComponent(
    mid,
  )}&orderId=${encodeURIComponent(trimmedOrder)}`;

  const payload: PaytmPaymentOptionRequest = {
    head: {
      channelId: "WEB",
      tokenType: "TXN_TOKEN",
      token: trimmedToken,
      requestTimestamp: String(Date.now()),
    },
    body: {
      mid,
      orderId: trimmedOrder,
    },
  };

  try {
    const response = await axios.post<unknown>(url, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });

    const data = response.data as {
      body?: {
        resultInfo?: {
          resultStatus?: string;
          resultMsg?: string;
          resultCode?: string;
        };
        merchantDetails?: PaytmMerchantDetails;
        addMoneyMerchantDetails?: PaytmAddMoneyMerchantDetails;
      };
    };

    const apiBody = data?.body;
    const resultInfo = apiBody?.resultInfo;
    const resultStatus = resultInfo?.resultStatus;
    const msg =
      resultInfo?.resultMsg ?? "Failed to fetch merchant details from Paytm";

    if (resultStatus === "S") {
      return {
        success: true,
        merchantDetails: apiBody?.merchantDetails,
        addMoneyMerchantDetails: apiBody?.addMoneyMerchantDetails,
      };
    }

    return {
      success: false,
      error: String(msg),
    };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const d = err.response.data as {
        body?: {
          resultInfo?: { resultMsg?: string; resultCode?: string };
          merchantDetails?: PaytmMerchantDetails;
        };
        head?: { resultInfo?: { resultMsg?: string; resultCode?: string } };
        message?: string;
      };
      const apiBody = d?.body ?? d;
      const ri =
        (
          apiBody as {
            resultInfo?: { resultMsg?: string; resultCode?: string };
          }
        )?.resultInfo ?? d?.head?.resultInfo;
      const msg =
        ri?.resultMsg ??
        (typeof d?.message === "string" ? d.message : undefined) ??
        err.message;
      console.error("[Paytm] getPaytmMerchantDetails HTTP error:", {
        status: err.response.status,
        resultMsg: ri?.resultMsg,
        resultCode: ri?.resultCode,
      });
      return { success: false, error: String(msg ?? "Paytm request failed") };
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Paytm] getPaytmMerchantDetails exception:", err);
    return { success: false, error: message };
  }
}

export interface FetchPaytmPCFDetailsParams {
  orderId: string;
  txnToken: string;
  mid?: string;
  /** One or more pay modes to fetch convenience charges for (e.g. CREDIT_CARD + instId VISA). */
  payMethods: PaytmPCFDetailsRequest["body"]["payMethods"];
}

export interface PaytmPCFDetailsResult {
  success: boolean;
  /** Response `body` from Paytm when `resultStatus` is S. `consultDetails` may be keyed by pay mode. */
  data?: PaytmPCFDetailsResponse["body"];
  error?: string;
}

export interface PaytmBINDetailsResult {
  success: boolean;
  /** Response `body` from Paytm when `resultStatus` is S. */
  data?: PaytmBINDetailsResponse["body"];
  error?: string;
}

/**
 * Fetch BIN details for the first 9 digits of card/token.
 * Requires `txnToken` from Initiate Transaction for the same `orderId` when using `TXN_TOKEN`.
 *
 * Docs: https://business.paytm.com/docs/api/fetch-bin-details-api/
 */
export async function getPaytmBINDetails(params: {
  orderId: string;
  txnToken: string;
  bin: string;
  paymentMode?: "CREDIT_CARD" | "DEBIT_CARD";
  mid?: string;
}): Promise<PaytmBINDetailsResult> {
  if (!isPaytmConfigured()) {
    return { success: false, error: "Paytm is not configured" };
  }
  const orderId = params.orderId?.trim();
  const txnToken = params.txnToken?.trim();
  const bin = params.bin?.trim();
  if (!orderId || !txnToken || !bin) {
    return { success: false, error: "orderId, txnToken and bin are required" };
  }

  const hostname =
    paytmConfig.environment === "PRODUCTION"
      ? "secure.paytmpayments.com"
      : "securestage.paytmpayments.com";

  const mid = params.mid?.trim() || paytmConfig.mid;

  const url = `https://${hostname}/theia/api/v1/fetchBinDetail?mid=${encodeURIComponent(
    mid,
  )}&orderId=${encodeURIComponent(orderId)}`;

  const payload: PaytmBINDetailsRequest = {
    head: {
      version: "v1",
      requestTimestamp: String(Date.now()),
      channelId: "WEB",
      tokenType: "TXN_TOKEN",
      token: txnToken,
    },
    body: {
      bin,
      mid,
      txnType: "NONE",
      requestType: "NONE",
      ...(params.paymentMode ? { paymentMode: params.paymentMode } : {}),
    },
  };

  try {
    const response = await axios.post<unknown>(url, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });

    const data = response.data as { body?: PaytmBINDetailsResponse["body"] };
    const apiBody = data?.body;
    const resultInfo = apiBody?.resultInfo;
    const resultStatus = resultInfo?.resultStatus;
    const msg =
      resultInfo?.resultMsg ?? "Failed to fetch BIN details from Paytm";

    if (resultStatus === "S" && apiBody) {
      return { success: true, data: apiBody };
    }
    return { success: false, error: String(msg) };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const d = err.response.data as {
        body?: PaytmBINDetailsResponse["body"];
        head?: { resultInfo?: { resultMsg?: string; resultCode?: string } };
        message?: string;
      };
      const apiBody = d?.body;
      const ri = apiBody?.resultInfo ?? d?.head?.resultInfo;
      const msg =
        ri?.resultMsg ??
        (typeof d?.message === "string" ? d.message : undefined) ??
        err.message;
      console.error("[Paytm] getPaytmBINDetails HTTP error:", {
        status: err.response.status,
        resultMsg: ri?.resultMsg,
        resultCode: ri?.resultCode,
      });
      return { success: false, error: String(msg ?? "Paytm request failed") };
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Paytm] getPaytmBINDetails exception:", err);
    return { success: false, error: message };
  }
}

/**
 * Fetch Payment Convenience Fee (PCF) details for the transaction amount on this order.
 * Requires `txnToken` from Initiate Transaction for the same `orderId`.
 *
 * Docs: https://business.paytm.com/docs/api/fetch-pcf-details-api/
 */
export async function getPaytmPCFDetails(
  params: FetchPaytmPCFDetailsParams,
): Promise<PaytmPCFDetailsResult> {
  if (!isPaytmConfigured()) {
    return { success: false, error: "Paytm is not configured" };
  }
  const orderId = params.orderId?.trim();
  const txnToken = params.txnToken?.trim();
  const payMethods = params.payMethods;
  if (!orderId || !txnToken) {
    return { success: false, error: "orderId and txnToken are required" };
  }
  if (!Array.isArray(payMethods) || payMethods.length === 0) {
    return { success: false, error: "payMethods must be a non-empty array" };
  }

  const hostname =
    paytmConfig.environment === "PRODUCTION"
      ? "secure.paytmpayments.com"
      : "securestage.paytmpayments.com";

  const mid = params.mid?.trim() || paytmConfig.mid;

  // Paytm endpoint is case-sensitive: `fetchPcfDetails` (not `fetchPCFDetails`).
  const url = `https://${hostname}/theia/api/v1/fetchPcfDetails?mid=${encodeURIComponent(
    mid,
  )}&orderId=${encodeURIComponent(orderId)}`;

  const payload: PaytmPCFDetailsRequest = {
    head: {
      version: "v1",
      channelId: "WEB",
      requestTimestamp: String(Date.now()),
      txnToken,
    },
    body: {
      payMethods,
    },
  };

  try {
    const response = await axios.post<unknown>(url, payload, {
      headers: { "Content-Type": "application/json" },
    });

    const data = response.data as { body?: PaytmPCFDetailsResponse["body"] };
    const apiBody = data?.body;
    const resultInfo = apiBody?.resultInfo;
    const resultStatus = resultInfo?.resultStatus;
    const msg =
      resultInfo?.resultMsg ?? "Failed to fetch PCF details from Paytm";

    if (resultStatus === "S" && apiBody) {
      return { success: true, data: apiBody };
    }

    console.error("[Paytm] getPaytmPCFDetails non-success response:", {
      mid,
      orderId,
      url,
      resultStatus,
      resultMsg: resultInfo?.resultMsg,
      resultCode: resultInfo?.resultCode,
      responseBody: JSON.stringify(apiBody).slice(0, 800),
    });
    return {
      success: false,
      error: String(msg),
    };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const d = err.response.data as {
        body?: PaytmPCFDetailsResponse["body"];
        head?: { resultInfo?: { resultMsg?: string; resultCode?: string } };
        message?: string;
      };
      const apiBody = d?.body;
      const ri = apiBody?.resultInfo ?? d?.head?.resultInfo;
      const msg =
        ri?.resultMsg ??
        (typeof d?.message === "string" ? d.message : undefined) ??
        err.message;
      console.error("[Paytm] getPaytmPCFDetails HTTP error:", {
        status: err.response.status,
        mid,
        orderId,
        url,
        resultMsg: ri?.resultMsg,
        resultCode: ri?.resultCode,
        responseBody:
          typeof err.response.data === "string"
            ? err.response.data.slice(0, 500)
            : JSON.stringify(err.response.data).slice(0, 800),
      });
      return { success: false, error: String(msg ?? "Paytm request failed") };
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Paytm] getPaytmPCFDetails exception:", err);
    return { success: false, error: message };
  }
}

/** Production host; settlement order detail is not available on staging (per Paytm docs). */
const PAYTM_SETTLEMENT_ORDER_DETAIL_URL =
  "https://secure.paytmpayments.com/merchant-settlement/SettlementTransactionDetail";

function createPaytmSettlementJwt(): string {
  return jwt.sign(
    { email: paytmConfig.settlementJwtEmail },
    paytmConfig.settlementClientSecret,
    { algorithm: "HS256", issuer: "PAYTM" },
  );
}

function buildPaytmSettlementReqMsgId(): string {
  return `${randomUUID()}${paytmConfig.mid}`;
}

function unwrapPaytmSettlementEnvelope(data: unknown): {
  head?: { reqMsgId?: string; respTime?: string };
  body?: {
    resultInfo?: {
      resultCode?: string;
      resultStatus?: string;
      resultMsg?: string;
    };
    orders?: PaytmSettlementDetailsResponse["body"][];
  };
} | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const inner = (o.response ?? o) as Record<string, unknown>;
  if (!inner || typeof inner !== "object") return null;
  return {
    head: inner.head as { reqMsgId?: string; respTime?: string } | undefined,
    body: inner.body as
      | {
          resultInfo?: {
            resultCode?: string;
            resultStatus?: string;
            resultMsg?: string;
          };
          orders?: PaytmSettlementDetailsResponse["body"][];
        }
      | undefined,
  };
}

export interface PaytmSettlementOrderDetailResult {
  success: boolean;
  head?: { reqMsgId?: string; respTime?: string };
  resultInfo?: {
    resultCode?: string;
    resultStatus?: string;
    resultMsg?: string;
  };
  orders?: PaytmSettlementDetailsResponse["body"][];
  error?: string;
}

/**
 * Settlement **Order Detail** API — order-level settlement rows for a given `orderId` and order date.
 * Uses JWT auth (`PAYTM_SETTLEMENT_CLIENT_SECRET`) and `clientId` header per Paytm settlement onboarding.
 *
 * **Production only** (Paytm does not host this on staging).
 *
 * Docs: https://business.paytm.com/docs/api/settlement-order-detail-api/
 * Auth: https://business.paytm.com/docs/settlement-api-authentication-process/
 */
export async function getPaytmSettlementOrderDetail(params: {
  orderId: string;
  /** Order created date `YYYY-MM-DD` (mandatory per Paytm). */
  transactionDate: string;
}): Promise<PaytmSettlementOrderDetailResult> {
  if (!isPaytmSettlementConfigured()) {
    return {
      success: false,
      error:
        "Settlement API not configured: set PAYTM_SETTLEMENT_CLIENT_SECRET and PAYTM_MID (and PAYTM_SETTLEMENT_CLIENT_ID or PAYTM_CLIENT_ID)",
    };
  }

  const orderId = params.orderId?.trim();
  const transactionDate = params.transactionDate?.trim();
  if (!orderId || !transactionDate) {
    return {
      success: false,
      error: "orderId and transactionDate are required",
    };
  }

  const payload = {
    request: {
      head: {
        reqMsgId: buildPaytmSettlementReqMsgId(),
      },
      body: {
        mid: paytmConfig.mid,
        orderId,
        transactionDate,
      },
    },
  };

  try {
    const token = createPaytmSettlementJwt();
    const response = await axios.post<unknown>(
      PAYTM_SETTLEMENT_ORDER_DETAIL_URL,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          clientId: getPaytmSettlementClientId(),
          Authorization: `Bearer ${token}`,
        },
        timeout: 20000,
      },
    );

    const unwrapped = unwrapPaytmSettlementEnvelope(response.data);
    if (!unwrapped?.body) {
      return {
        success: false,
        error: "Invalid settlement order detail response from Paytm",
      };
    }

    const { head, body: respBody } = unwrapped;
    const resultInfo = respBody.resultInfo;
    if (!resultInfo) {
      return {
        success: false,
        error: "Settlement response missing resultInfo",
      };
    }

    if (resultInfo.resultStatus === "S") {
      return {
        success: true,
        head,
        resultInfo,
        orders: respBody.orders,
      };
    }

    return {
      success: false,
      head,
      resultInfo,
      error: resultInfo.resultMsg ?? "Settlement order detail request failed",
    };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const unwrapped = unwrapPaytmSettlementEnvelope(err.response.data);
      const ri = unwrapped?.body?.resultInfo;
      const msg =
        ri?.resultMsg ??
        (typeof (err.response.data as { message?: string })?.message ===
        "string"
          ? (err.response.data as { message: string }).message
          : undefined) ??
        err.message;
      console.error("[Paytm] getPaytmSettlementOrderDetail HTTP error:", {
        status: err.response.status,
        resultMsg: ri?.resultMsg,
        resultCode: ri?.resultCode,
      });
      return {
        success: false,
        head: unwrapped?.head,
        resultInfo: ri,
        error: String(msg ?? "Paytm settlement request failed"),
      };
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Paytm] getPaytmSettlementOrderDetail exception:", err);
    return { success: false, error: message };
  }
}
