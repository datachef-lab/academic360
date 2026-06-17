import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  unifiedSearch,
  type UnifiedSearchType,
} from "@/features/library/services/library-search.service.js";

const VALID_TYPES: UnifiedSearchType[] = ["BOOK", "JOURNAL", "COPY", "ARTICLE"];

const parseType = (v: unknown): UnifiedSearchType | undefined => {
  if (typeof v !== "string") return undefined;
  const upper = v.toUpperCase() as UnifiedSearchType;
  return VALID_TYPES.includes(upper) ? upper : undefined;
};

const parseBranchId = (v: unknown): number | undefined => {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

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
    const result = await unifiedSearch(q, {
      type: parseType(req.query.type),
      branchId: parseBranchId(req.query.branchId),
      limitPerType: safeLimit,
    });
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", result, "Library search completed."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
