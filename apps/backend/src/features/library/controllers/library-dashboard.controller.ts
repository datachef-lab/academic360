import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  DashboardFilters,
  getLibraryDashboardStats,
} from "@/features/library/services/library-dashboard.service.js";

const optId = (v: unknown): number | undefined => {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

const optDate = (v: unknown): Date | undefined => {
  if (typeof v !== "string" || !v.trim()) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

export const getLibraryDashboardStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const filters: DashboardFilters = {
      branchId: optId(req.query.branchId),
      dateFrom: optDate(req.query.dateFrom),
      dateTo: optDate(req.query.dateTo),
    };
    const stats = await getLibraryDashboardStats(filters);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          stats,
          "Library dashboard stats fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
