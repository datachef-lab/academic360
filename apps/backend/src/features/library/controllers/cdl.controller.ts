import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { issueCdlAccess } from "@/features/library/services/cdl.service.js";

export const requestCdlAccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const bookId = Number(req.params.bookId);
    if (!bookId || Number.isNaN(bookId))
      throw new ApiError(400, "Invalid book id.");
    const result = await issueCdlAccess(bookId);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", result, "CDL access granted."));
  } catch (e) {
    handleError(e, res, next);
  }
};
