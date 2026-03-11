/**
 * Paytm Payment Gateway service.
 * Uses raw Initiate Transaction API (docs format) for reliability.
 * Docs: https://business.paytm.com/docs/api/initiate-transaction-api/
 */

import { createRequire } from "module";
import { paytmConfig, isPaytmConfigured } from "../config/paytm.config.js";
import axios from "axios";

const require = createRequire(import.meta.url);
const PaytmChecksum = require("paytmchecksum");
const Paytm = require("paytm-pg-node-sdk");

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
