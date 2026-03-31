import type { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/index.js";
import { z } from "zod";
import {
  loadFeePaymentMarkingByOrderId,
  loadFeePaymentMarkingByReceiptNumber,
  markOnlineFeePaymentSuccessManual,
  receiveCashFeePayment,
} from "../services/fee-payment-marking.service.js";

export const loadCashChallanHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const receiptNumber = String(req.query.receiptNumber ?? "");
    const parsed = z
      .object({ receiptNumber: z.string().min(1) })
      .safeParse({ receiptNumber });
    if (!parsed.success) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "receiptNumber is required"));
      return;
    }
    const result = await loadFeePaymentMarkingByReceiptNumber({
      receiptNumber: parsed.data.receiptNumber,
    });
    if (!result.success) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, result.error));
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", result.data, "Loaded challan"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const receiveCashChallanHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = z
      .object({
        receiptNumber: z.string().min(1),
        receiptDateIso: z.string().min(1),
        remarks: z.string().optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Invalid payload"));
      return;
    }

    const recordedByUserId = Number(
      (req.user as { id?: number } | undefined)?.id,
    );
    const result = await receiveCashFeePayment({
      ...parsed.data,
      recordedByUserId,
    });
    if (!result.success) {
      res.status(400).json(new ApiResponse(400, "ERROR", null, result.error));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", result.data, "Cash payment recorded"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const loadOnlineOrderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orderId = String(req.query.orderId ?? "");
    const parsed = z
      .object({ orderId: z.string().min(1) })
      .safeParse({ orderId });
    if (!parsed.success) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "orderId is required"));
      return;
    }
    const result = await loadFeePaymentMarkingByOrderId({
      orderId: parsed.data.orderId,
    });
    if (!result.success) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, result.error));
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", result.data, "Loaded payment"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const markOnlineSuccessManualHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = z
      .object({
        orderId: z.string().min(1),
        remarks: z.string().optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Invalid payload"));
      return;
    }
    const recordedByUserId = Number(
      (req.user as { id?: number } | undefined)?.id,
    );
    const result = await markOnlineFeePaymentSuccessManual({
      orderId: parsed.data.orderId,
      remarks: parsed.data.remarks,
      recordedByUserId,
    });
    if (!result.success) {
      res.status(400).json(new ApiResponse(400, "ERROR", null, result.error));
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", result.data, "Payment marked"));
  } catch (error) {
    handleError(error, res, next);
  }
};
