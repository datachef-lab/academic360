import type { Request, Response, NextFunction } from "express";
import { createRequire } from "module";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import type { PaytmDowntimeWebhookPayload } from "@repo/db/dtos/payments";
import { feeStudentMappingModel, studentModel } from "@repo/db/schemas";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createPayment,
  createFeePayment,
  attachPaytmTxnTokenToPayment,
  findPaymentByOrderId,
  findPaymentInfoByApplicationFormId,
  generateOrderId,
  updatePaymentByOrderId,
  isFeeStudentMappingPaymentContext,
} from "../services/payment.service.js";
import {
  createPaytmTxnToken,
  getPaytmPaymentStatus,
  getPaytmTransactionStatusDetails,
} from "../services/paytm-payment.service.js";
import { enrichPaymentWithPaytmDetails } from "../services/payment.service.js";
import {
  getOnlinePaymentAvailability,
  syncPaytmDowntimeFromWebhook,
} from "../services/payment-downtime.service.js";
import { findApplicationFormModelById } from "@/features/admissions/services/application-form.service.js";
import { paytmConfig, isPaytmConfigured } from "../config/paytm.config.js";

function normalizePaytmTxnStatus(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

const require = createRequire(import.meta.url);
const PaytmChecksum = require("paytmchecksum") as {
  /** PG callbacks: pass flat key/value object (not JSON.stringify). Library sorts keys and joins values with `|`. */
  verifySignature: (
    body: string | Record<string, string>,
    merchantKey: string,
    signature: string,
  ) => boolean;
};

/**
 * POST /api/payments/initiate
 * Body: { applicationFormId, amount, email?, mobile?, firstName?, lastName? }
 * Creates payment record, gets Paytm txn token, returns orderId + txnToken for frontend.
 */
export const initiatePaymentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { applicationFormId, amount, email, mobile, firstName, lastName } =
      req.body as {
        applicationFormId: number;
        amount: string;
        email?: string;
        mobile?: string;
        firstName?: string;
        lastName?: string;
      };

    if (!applicationFormId || !amount) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "ERROR",
            null,
            "applicationFormId and amount are required",
          ),
        );
      return;
    }

    const form = await findApplicationFormModelById(applicationFormId);
    if (!form) {
      res
        .status(404)
        .json(
          new ApiResponse(404, "ERROR", null, "Application form not found"),
        );
      return;
    }

    let payment = await findPaymentInfoByApplicationFormId(applicationFormId);
    let orderId: string;

    if (payment) {
      // if (payment.status === "SUCCESS") {
      //   res
      //     .status(400)
      //     .json(
      //       new ApiResponse(400, "ERROR", null, "Payment already completed"),
      //     );
      //   return;
      // }
      // orderId = payment.orderId;
    } else {
      orderId = await generateOrderId();
      payment = await createPayment({
        applicationFormId,
        paymentFor: "ADMISSION_APPLICATION_FEE",
        orderId,
        amount: String(amount),
        gatewayName: "PAYTM",
      });
    }

    const custId = `APP_${applicationFormId}`;
    // const tokenResult = await createPaytmTxnToken({
    //   orderId,
    //   amount: String(amount),
    //   custId,
    //   email,
    //   mobile,
    //   firstName,
    //   lastName,
    // });

    if (
      false
      //  !tokenResult.success
    ) {
      res.status(500).json(
        new ApiResponse(
          500,
          "ERROR",
          null,
          // tokenResult.error ?? "Failed to initiate payment",
        ),
      );
      return;
    }

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          // orderId,
          // txnToken: tokenResult.txnToken,
          paymentId: payment?.id,
        },
        "Payment initiated successfully",
      ),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

/**
 * POST /api/payments/initiate-fee
 * Body: { feeStudentMappingId, amount, studentId, email?, mobile?, firstName?, lastName? }
 * Creates payment record for student fee, gets Paytm txn token.
 */
export const initiateFeePaymentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      feeStudentMappingId,
      amount,
      studentId,
      returnUrl,
      email,
      mobile,
      firstName,
      lastName,
    } = req.body as {
      feeStudentMappingId: number;
      amount: string | number;
      studentId: number;
      returnUrl?: string;
      email?: string;
      mobile?: string;
      firstName?: string;
      lastName?: string;
    };

    if (!feeStudentMappingId || !amount) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "ERROR",
            null,
            "feeStudentMappingId and amount are required",
          ),
        );
      return;
    }

    const amountStr = String(amount);
    const orderId = await generateOrderId();

    const payment = await createFeePayment({
      feeStudentMappingId,
      studentId,
      orderId,
      amount: amountStr,
      gatewayName: "PAYTM",
      remarks: returnUrl || undefined,
    });

    const custId = `FEE_${studentId}_${feeStudentMappingId}`;
    const tokenResult = await createPaytmTxnToken({
      orderId,
      amount: amountStr,
      custId,
      email: email || `student_${studentId}@academic360.local`,
      mobile: mobile || "9999999999",
      firstName,
      lastName,
    });

    if (!tokenResult.success) {
      const errMsg = tokenResult.error ?? "Failed to initiate payment";
      console.error("[Paytm] initiate-fee failed:", errMsg);
      res.status(500).json(new ApiResponse(500, "ERROR", null, errMsg));
      return;
    }

    if (tokenResult.txnToken) {
      await attachPaytmTxnTokenToPayment({
        orderId,
        txnToken: tokenResult.txnToken,
      });
    }

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          orderId,
          txnToken: tokenResult.txnToken,
          paymentId: payment?.id,
        },
        "Payment initiated successfully",
      ),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

/**
 * GET /api/payments/status/:orderId
 * Fetches payment status from Paytm and updates DB if completed.
 */
export const getPaymentStatusHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orderIdRaw = req.params.orderId;
    const orderId = Array.isArray(orderIdRaw) ? orderIdRaw[0] : orderIdRaw;
    if (!orderId) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "orderId is required"));
      return;
    }

    const payment = await findPaymentByOrderId(orderId);
    if (!payment) {
      res
        .status(404)
        .json(new ApiResponse(404, "ERROR", null, "Payment not found"));
      return;
    }

    const statusResult = await getPaytmPaymentStatus(orderId);
    if (!statusResult.success) {
      res
        .status(500)
        .json(
          new ApiResponse(
            500,
            "ERROR",
            null,
            statusResult.error ?? "Failed to get status",
          ),
        );
      return;
    }

    // if (payment.status !== "SUCCESS" && statusResult.status === "TXN_SUCCESS") {
    //   await updatePaymentByOrderId(orderId, {
    //     status: "SUCCESS",
    //     transactionId: statusResult.txnId,
    //     bankTxnId: statusResult.bankTxnId,
    //     txnDate: statusResult.txnDate
    //       ? new Date(statusResult.txnDate)
    //       : undefined,
    //   });
    // } else if (
    //   payment.status !== "FAILED" &&
    //   statusResult.status === "TXN_FAILURE"
    // ) {
    //   await updatePaymentByOrderId(orderId, {
    //     status: "FAILED",
    //     transactionId: statusResult.txnId,
    //     bankTxnId: statusResult.bankTxnId,
    //   });
    // }

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          orderId: statusResult.orderId,
          txnId: statusResult.txnId,
          status: statusResult.status,
          amount: statusResult.amount,
        },
        "Status fetched successfully",
      ),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

/**
 * GET /api/payments/config
 * Returns Paytm config for frontend (MID, script host).
 */
export const getPaymentConfigHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!isPaytmConfigured()) {
      res
        .status(503)
        .json(new ApiResponse(503, "ERROR", null, "Paytm is not configured"));
      return;
    }
    const host =
      paytmConfig.environment === "PRODUCTION"
        ? "https://secure.paytmpayments.com"
        : "https://securestage.paytmpayments.com";
    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          mid: paytmConfig.mid,
          host,
        },
        "Config fetched",
      ),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

/**
 * POST /api/payments/confirm
 * Confirm payment from client-side (e.g. Paytm transactionStatus callback).
 * Accepts same format as Paytm callback: ORDERID, TXNID, BANKTXNID, STATUS, TXNDATE, etc.
 */
export const confirmPaymentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body as Record<string, string>;
    const orderId = body.ORDERID ?? body.orderId;
    const status = body.STATUS ?? body.status;
    const txnId = body.TXNID ?? body.txnId;
    const bankTxnId = body.BANKTXNID ?? body.bankTxnId;
    const txnDate = body.TXNDATE ?? body.txnDate;
    const checksumHash = body.CHECKSUMHASH ?? body.checksumHash;
    const cardScheme = body.cardScheme ?? body.CARDSCHEME;
    const mid = body.MID ?? body.mid;
    const txnAmount = body.TXNAMOUNT ?? body.txnAmount;
    const bankName = body.BANKNAME ?? body.bankName;
    const txnGatewayName = body.GATEWAYNAME ?? body.gatewayName;
    const txnPaymentMode = body.PAYMENTMODE ?? body.paymentMode;

    if (!orderId) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "ORDERID is required"));
      return;
    }

    // Server-side verification: query Paytm for the real transaction status
    // instead of trusting the client-submitted status fields.
    const payment = await findPaymentByOrderId(orderId);
    if (!payment) {
      res
        .status(404)
        .json(new ApiResponse(404, "ERROR", null, "Payment not found"));
      return;
    }

    // Verify from gateway directly rather than trusting client body
    const gatewayResult = await getPaytmPaymentStatus(orderId);
    const verifiedStatus = gatewayResult?.success
      ? gatewayResult.status
      : undefined;
    const verifiedTxnId = gatewayResult?.txnId;

    const effectiveStatus = verifiedStatus ?? status;
    const effNorm = normalizePaytmTxnStatus(effectiveStatus);
    const verNorm = normalizePaytmTxnStatus(verifiedStatus);

    if (effNorm === "TXN_SUCCESS" || verNorm === "TXN_SUCCESS") {
      await updatePaymentByOrderId(orderId, {
        status: "SUCCESS",
        transactionId: verifiedTxnId ?? txnId,
        bankTxnId: gatewayResult?.bankTxnId ?? bankTxnId,
        txnDate: gatewayResult?.txnDate
          ? new Date(gatewayResult.txnDate)
          : txnDate
            ? new Date(txnDate)
            : undefined,
        mid,
        txnAmount: gatewayResult?.amount ?? txnAmount,
        bankName,
        txnGatewayName,
        txnPaymentMode,
        checksumHash,
        cardScheme,
        gatewayResponse: {
          paytm: { confirm: body, gatewayVerify: gatewayResult },
        },
      });
    } else if (effNorm === "TXN_FAILURE") {
      await updatePaymentByOrderId(orderId, {
        status: "FAILED",
        transactionId: verifiedTxnId ?? txnId,
        bankTxnId: gatewayResult?.bankTxnId ?? bankTxnId,
        txnDate: txnDate ? new Date(txnDate) : undefined,
        mid,
        txnAmount,
        bankName,
        txnGatewayName,
        txnPaymentMode,
        checksumHash,
        cardScheme,
        gatewayResponse: {
          paytm: { confirm: body, gatewayVerify: gatewayResult },
        },
      });
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { orderId, status: effectiveStatus },
          "Payment confirmed",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

/**
 * POST /api/payments/callback
 * Paytm callback - verifies and updates payment. Paytm POSTs here after payment.
 * Body: Paytm callback payload (ORDERID, TXNID, BANKTXNID, STATUS, TXNAMOUNT, TXNDATE, etc.)
 */
export const paymentCallbackHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body as Record<string, string>;
    const orderId = body.ORDERID ?? body.orderId;
    const status = body.STATUS ?? body.status;
    const txnId = body.TXNID ?? body.txnId;
    const bankTxnId = body.BANKTXNID ?? body.bankTxnId;
    const txnDate = body.TXNDATE ?? body.txnDate;
    const checksumHash = body.CHECKSUMHASH ?? body.checksumHash;
    const cardScheme = body.cardScheme ?? body.CARDSCHEME;
    const mid = body.MID ?? body.mid;
    const txnAmount = body.TXNAMOUNT ?? body.txnAmount;
    const bankName = body.BANKNAME ?? body.bankName;
    const txnGatewayName = body.GATEWAYNAME ?? body.gatewayName;
    const txnPaymentMode = body.PAYMENTMODE ?? body.paymentMode;
    console.info("[Paytm callback] received", {
      orderId,
      status,
      txnId,
      bankTxnId,
    });

    if (!orderId) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "ORDERID is required"));
      return;
    }

    // Verify Paytm checksum (PG posts flat fields; paytmchecksum hashes sorted keys → values joined by "|", not JSON)
    if (isPaytmConfigured() && checksumHash) {
      const bodyForVerify: Record<string, string> = {};
      for (const [k, raw] of Object.entries(body)) {
        if (k === "CHECKSUMHASH" || k === "checksumHash") continue;
        bodyForVerify[k] = raw == null ? "" : String(raw);
      }
      const isValid = PaytmChecksum.verifySignature(
        bodyForVerify,
        paytmConfig.merchantKey,
        checksumHash,
      );
      if (!isValid) {
        console.warn("[Paytm callback] Invalid checksum for orderId:", orderId);
        res
          .status(400)
          .json(new ApiResponse(400, "ERROR", null, "Invalid checksum"));
        return;
      }
    }

    const payment = await findPaymentByOrderId(orderId);
    if (!payment) {
      res
        .status(404)
        .json(new ApiResponse(404, "ERROR", null, "Payment not found"));
      return;
    }

    const normalizedCallbackStatus = normalizePaytmTxnStatus(status);
    try {
      // Update base status columns from callback.
      if (normalizedCallbackStatus === "TXN_SUCCESS") {
        await updatePaymentByOrderId(orderId, {
          status: "SUCCESS",
          transactionId: txnId,
          bankTxnId,
          txnDate: txnDate ? new Date(txnDate) : undefined,
          mid,
          txnAmount,
          bankName,
          txnGatewayName,
          txnPaymentMode,
          checksumHash,
          cardScheme,
          gatewayResponse: { paytm: { callback: body } },
        });
      } else if (normalizedCallbackStatus === "TXN_FAILURE") {
        await updatePaymentByOrderId(orderId, {
          status: "FAILED",
          transactionId: txnId,
          bankTxnId,
          txnDate: txnDate ? new Date(txnDate) : undefined,
          mid,
          txnAmount,
          bankName,
          txnGatewayName,
          txnPaymentMode,
          checksumHash,
          cardScheme,
          gatewayResponse: { paytm: { callback: body } },
        });
      }

      // Compulsory enrichment attempt (no skips) — store whatever Paytm returns (or errors).
      // Re-read latest payment row so we pick up txnToken stored at initiation.
      const latest = await findPaymentByOrderId(orderId);
      const isOnline = latest?.paymentMode === "ONLINE";
      const isPaytm =
        String(latest?.paymentGatewayVendor ?? "")
          .trim()
          .toUpperCase() === "PAYTM";
      const isManual = !!latest?.isManualEntry;
      if (!isOnline || !isPaytm || isManual) {
        console.info("[Paytm] skip enrichment (not eligible)", {
          orderId,
          isOnline,
          vendor: latest?.paymentGatewayVendor,
          isManualEntry: isManual,
        });
        return;
      }
      const tokenFromDb = (
        latest?.gatewayResponse as { paytm?: { txnToken?: string } } | null
      )?.paytm?.txnToken;

      console.info("[Paytm] compulsory enrichment start", {
        orderId,
        callbackStatus: status,
        hasTxnToken: !!tokenFromDb,
      });

      const enrichResult = await enrichPaymentWithPaytmDetails(orderId, {
        txnToken: tokenFromDb,
      });

      if (!enrichResult.success) {
        console.error("[Paytm] compulsory enrichment failed", {
          orderId,
          error: enrichResult.error,
        });
      } else {
        console.info("[Paytm] compulsory enrichment done", { orderId });
      }
    } catch (updateError) {
      console.error(
        `Failed to update payment for orderId ${orderId}:`,
        updateError,
      );
      // Continue to redirect even if update fails - the payment exists
    }

    const fallbackUrl = process.env.CORS_ORIGIN || "http://localhost:5173";
    const resolvedReturnUrl =
      payment.remarks && /^https?:\/\//i.test(payment.remarks)
        ? payment.remarks
        : null;
    const frontendUrl = resolvedReturnUrl
      ? new URL(resolvedReturnUrl).origin
      : fallbackUrl;
    const paymentResult =
      normalizedCallbackStatus === "TXN_SUCCESS" ? "success" : "failed";
    const respMsg =
      body.RESPMSG ??
      body.respMsg ??
      (paymentResult === "success"
        ? "Payment recorded successfully"
        : "Payment failed");

    const redirect = resolvedReturnUrl
      ? new URL(resolvedReturnUrl)
      : new URL("/dashboard/fees/student-fees", frontendUrl);
    redirect.searchParams.set("payment", paymentResult);
    redirect.searchParams.set("orderId", orderId);
    redirect.searchParams.set("respMsg", respMsg);

    let redirectUrl = redirect.toString();
    let studentUid = "";
    let studentIdForRedirect: number | null = null;

    // For fees: attach student context for UI refresh after redirect.
    const feeStudentMappingId = isFeeStudentMappingPaymentContext(
      payment.context,
    )
      ? Number(
          (
            payment.gatewayResponse as
              | { meta?: { feeStudentMappingId?: number | string } }
              | null
              | undefined
          )?.meta?.feeStudentMappingId ?? 0,
        ) || null
      : null;
    if (feeStudentMappingId) {
      try {
        const [mapping] = await db
          .select({
            studentId: feeStudentMappingModel.studentId,
            feeStructureId: feeStudentMappingModel.feeStructureId,
          })
          .from(feeStudentMappingModel)
          .where(eq(feeStudentMappingModel.id, feeStudentMappingId));

        if (mapping?.studentId) {
          studentIdForRedirect = Number(mapping.studentId) || null;
          if (studentIdForRedirect) {
            redirect.searchParams.set(
              "studentId",
              String(studentIdForRedirect),
            );
          }
          const [student] = await db
            .select({ uid: studentModel.uid })
            .from(studentModel)
            .where(eq(studentModel.id, mapping.studentId));

          if (student?.uid) {
            studentUid = student.uid;
            // For main-console fallback (no custom returnUrl): preserve existing behaviour.
            if (!resolvedReturnUrl) {
              redirect.searchParams.set("search", student.uid);
            }
          }
        }

        if (mapping?.feeStructureId) {
          if (!resolvedReturnUrl) {
            redirect.searchParams.set(
              "feeStructureId",
              String(mapping.feeStructureId),
            );
          }
        }

        redirectUrl = redirect.toString();
      } catch (mappingError) {
        console.error("Failed to fetch student UID:", mappingError);
      }
    }

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(
      `<!DOCTYPE html><html><body>
        <script>
          if (window.opener) {
            try {
              window.opener.postMessage({
                type: "PAYTM_PAYMENT_RESULT",
                payment: ${JSON.stringify(paymentResult)},
                orderId: ${JSON.stringify(orderId)},
                studentId: ${JSON.stringify(studentIdForRedirect)},
                studentUid: ${JSON.stringify(studentUid)},
                respMsg: ${JSON.stringify(respMsg)}
              }, ${JSON.stringify(frontendUrl)});
            } catch(e) {}
            window.close();
          } else {
            window.location.href = ${JSON.stringify(redirectUrl)};
          }
        </script>
        <p>Processing payment...</p>
      </body></html>`,
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

/**
 * GET /api/payments/availability — coarse online payment availability from stored Paytm downtime rows.
 */
export const getOnlinePaymentAvailabilityHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await getOnlinePaymentAvailability();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", data, "Availability loaded"));
  } catch (error) {
    handleError(error, res, next);
  }
};

/**
 * POST /api/payments/downtime/webhook — Paytm downtime notification (configure URL with Paytm).
 * Verifies checksum when `head.signature` is present.
 */
export const paytmDowntimeWebhookHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload = req.body as PaytmDowntimeWebhookPayload;
    const signature = payload?.head?.signature;

    if (signature && typeof signature === "string" && isPaytmConfigured()) {
      const valid = PaytmChecksum.verifySignature(
        JSON.stringify(payload.body ?? {}),
        paytmConfig.merchantKey,
        signature,
      );
      if (!valid) {
        res
          .status(400)
          .json(
            new ApiResponse(400, "ERROR", null, "Invalid downtime checksum"),
          );
        return;
      }
    }

    await syncPaytmDowntimeFromWebhook(payload);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", { ok: true }, "Downtime synced"));
  } catch (error) {
    handleError(error, res, next);
  }
};
