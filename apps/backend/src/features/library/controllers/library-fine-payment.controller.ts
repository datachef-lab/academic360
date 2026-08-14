import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  initiateLibraryFinePayment,
  recordLibraryFineCashPayment,
  settleLibraryFinePayment,
  waiveLibraryFine,
} from "@/features/library/services/library-fine-payment.service.js";

const actorId = (req: Request): number => {
  const u = req.user as { id?: number } | undefined;
  if (typeof u?.id !== "number" || Number.isNaN(u.id)) {
    throw new ApiError(401, "Authenticated user required.");
  }
  return u.id;
};

export const initiateLibraryFinePaymentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const circulationId = Number(req.params.circulationId);
    if (Number.isNaN(circulationId) || circulationId <= 0) {
      throw new ApiError(400, "Invalid circulation id.");
    }
    const sessionUser = req.user as { id?: number } | undefined;
    const userId = Number(
      (req.body as { userId?: number | string }).userId ?? sessionUser?.id,
    );
    if (Number.isNaN(userId) || userId <= 0) {
      throw new ApiError(400, "userId is required.");
    }
    const result = await initiateLibraryFinePayment(circulationId, userId);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Library fine payment initiated.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const settleLibraryFinePaymentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const paymentId = Number(req.params.paymentId);
    if (Number.isNaN(paymentId) || paymentId <= 0) {
      throw new ApiError(400, "Invalid payment id.");
    }
    const status = (req.body as { status?: "SUCCESS" | "FAILED" }).status;
    if (status !== "SUCCESS" && status !== "FAILED") {
      throw new ApiError(400, "status must be SUCCESS or FAILED.");
    }
    await settleLibraryFinePayment(paymentId, status);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Library fine payment settled."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const recordLibraryFineCashPaymentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const circulationId = Number(req.params.circulationId);
    if (Number.isNaN(circulationId) || circulationId <= 0) {
      throw new ApiError(400, "Invalid circulation id.");
    }
    const remarks = (req.body as { remarks?: string }).remarks;
    const result = await recordLibraryFineCashPayment(
      circulationId,
      actorId(req),
      remarks,
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Library fine cash payment recorded.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const waiveLibraryFineController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const circulationId = Number(req.params.circulationId);
    if (Number.isNaN(circulationId) || circulationId <= 0) {
      throw new ApiError(400, "Invalid circulation id.");
    }
    const body = req.body as { amount?: number | string; remarks?: string };
    const amount = Number(body.amount);
    if (Number.isNaN(amount)) {
      throw new ApiError(400, "amount is required.");
    }
    await waiveLibraryFine(circulationId, actorId(req), amount, body.remarks);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Library fine waived."));
  } catch (error) {
    handleError(error, res, next);
  }
};
