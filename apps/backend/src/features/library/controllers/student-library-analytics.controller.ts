import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  findAnalyticsPaginated,
  recomputeForUser,
} from "@/features/library/services/student-library-analytics.service.js";

const optId = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

export const listAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 15);
    const result = await findAnalyticsPaginated({
      page: Number.isNaN(page) || page < 1 ? 1 : page,
      limit: Number.isNaN(limit) || limit < 1 ? 15 : Math.min(limit, 100),
      userId: optId(req.query.userId) ?? undefined,
      academicYear:
        typeof req.query.academicYear === "string"
          ? req.query.academicYear
          : undefined,
    });
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", result, "Analytics fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const recomputeAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const b = req.body as Record<string, unknown>;
    const userId = optId(b.userId);
    const academicYear =
      typeof b.academicYear === "string" ? b.academicYear : "";
    if (!userId) throw new ApiError(400, "userId is required.");
    if (!academicYear) throw new ApiError(400, "academicYear is required.");
    const id = await recomputeForUser(userId, academicYear);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", { id }, "Analytics recomputed."));
  } catch (e) {
    handleError(e, res, next);
  }
};
