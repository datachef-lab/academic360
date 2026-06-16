import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  initiateLibraryFinePayment,
  settleLibraryFinePayment,
} from "@/features/library/services/library-fine-payment.service.js";

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
    const userId = Number(
      (req.body as { userId?: number | string }).userId ?? req.user?.id,
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
