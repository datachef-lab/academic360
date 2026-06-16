import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { unifiedSearch } from "@/features/library/services/library-search.service.js";

export const unifiedSearchController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const limit = Number(req.query.limit ?? 15);
    const safeLimit =
      Number.isNaN(limit) || limit < 1 ? 15 : Math.min(limit, 50);
    const result = await unifiedSearch(q, safeLimit);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", result, "Library search completed."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
