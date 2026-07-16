import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { getLibraryClearance } from "@/features/library/services/library-clearance.service.js";

export const getLibraryClearanceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = Number(req.params.userId);
    if (Number.isNaN(userId) || userId <= 0) {
      throw new ApiError(400, "Invalid user id.");
    }
    const result = await getLibraryClearance(userId);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Library clearance fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
