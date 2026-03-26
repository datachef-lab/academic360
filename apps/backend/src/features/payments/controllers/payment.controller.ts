import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { feeStudentMappingModel, studentModel } from "@repo/db/schemas";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createPayment,
  createFeePayment,
  findPaymentByOrderId,
  findPaymentInfoByApplicationFormId,
  generateOrderId,
  updatePaymentByOrderId,
} from "../services/payment.service.js";
import {
  createPaytmTxnToken,
  getPaytmPaymentStatus,
} from "../services/paytm-payment.service.js";
import { findApplicationFormModelById } from "@/features/admissions/services/application-form.service.js";
import { paytmConfig, isPaytmConfigured } from "../config/paytm.config.js";

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
      if (payment.status === "SUCCESS") {
        res
          .status(400)
          .json(
            new ApiResponse(400, "ERROR", null, "Payment already completed"),
          );
        return;
      }
      orderId = payment.orderId;
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
    const tokenResult = await createPaytmTxnToken({
      orderId,
      amount: String(amount),
      custId,
      email,
      mobile,
      firstName,
      lastName,
    });

    if (!tokenResult.success) {
      res
        .status(500)
        .json(
          new ApiResponse(
            500,
            "ERROR",
            null,
            tokenResult.error ?? "Failed to initiate payment",
          ),
        );
      return;
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
      orderId,
      amount: amountStr,
      gatewayName: "PAYTM",
      remarks: returnUrl || null,
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

    if (payment.status !== "SUCCESS" && statusResult.status === "TXN_SUCCESS") {
      await updatePaymentByOrderId(orderId, {
        status: "SUCCESS",
        transactionId: statusResult.txnId,
        bankTxnId: statusResult.bankTxnId,
        txnDate: statusResult.txnDate
          ? new Date(statusResult.txnDate)
          : undefined,
      });
    } else if (
      payment.status !== "FAILED" &&
      statusResult.status === "TXN_FAILURE"
    ) {
      await updatePaymentByOrderId(orderId, {
        status: "FAILED",
        transactionId: statusResult.txnId,
        bankTxnId: statusResult.bankTxnId,
      });
    }

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

    if (!orderId) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "ORDERID is required"));
      return;
    }

    const payment = await findPaymentByOrderId(orderId);
    if (!payment) {
      res
        .status(404)
        .json(new ApiResponse(404, "ERROR", null, "Payment not found"));
      return;
    }

    if (status === "TXN_SUCCESS") {
      await updatePaymentByOrderId(orderId, {
        status: "SUCCESS",
        transactionId: txnId,
        bankTxnId,
        txnDate: txnDate ? new Date(txnDate) : undefined,
        gatewayResponse: body,
      });
    } else if (status === "TXN_FAILURE") {
      await updatePaymentByOrderId(orderId, {
        status: "FAILED",
        transactionId: txnId,
        bankTxnId,
        gatewayResponse: body,
      });
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { orderId, status },
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

    if (!orderId) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "ORDERID is required"));
      return;
    }

    const payment = await findPaymentByOrderId(orderId);
    if (!payment) {
      res
        .status(404)
        .json(new ApiResponse(404, "ERROR", null, "Payment not found"));
      return;
    }

    try {
      if (status === "TXN_SUCCESS") {
        await updatePaymentByOrderId(orderId, {
          status: "SUCCESS",
          transactionId: txnId,
          bankTxnId,
          txnDate: txnDate ? new Date(txnDate) : undefined,
          gatewayResponse: body,
        });
      } else if (status === "TXN_FAILURE") {
        await updatePaymentByOrderId(orderId, {
          status: "FAILED",
          transactionId: txnId,
          bankTxnId,
          gatewayResponse: body,
        });
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
    const paymentResult = status === "TXN_SUCCESS" ? "success" : "failed";
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

    // For FEE payments: get student UID for search param
    if (payment.feeStudentMappingId) {
      try {
        const [mapping] = await db
          .select({ studentId: feeStudentMappingModel.studentId })
          .from(feeStudentMappingModel)
          .where(eq(feeStudentMappingModel.id, payment.feeStudentMappingId));

        if (mapping?.studentId) {
          const [student] = await db
            .select({ uid: studentModel.uid })
            .from(studentModel)
            .where(eq(studentModel.id, mapping.studentId));

          if (student?.uid) {
            studentUid = student.uid;
            redirect.searchParams.set("search", student.uid);
            redirectUrl = redirect.toString();
          }
        }
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
                payment: "${paymentResult}", 
                orderId: "${orderId}", 
                studentUid: "${studentUid}",
                respMsg: ${JSON.stringify(respMsg)}
              }, "${frontendUrl}"); 
            } catch(e) {}
            window.close();
          } else {
            window.location.href = "${redirectUrl}";
          }
        </script>
        <p>Processing payment...</p>
      </body></html>`,
    );
  } catch (error) {
    handleError(error, res, next);
  }
};
