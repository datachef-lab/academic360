import { NextFunction, Request, Response } from "express";

import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  getIdCardDashboardStatsCached,
  type IdCardDashboardFilters,
} from "@/features/idcard/services/id-card-dashboard.service.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse a repeatable/CSV numeric query param (`ids=1&ids=2` or `ids=1,2`). */
const parseIntList = (v: unknown): number[] | undefined => {
  if (v == null) return undefined;
  const raw = Array.isArray(v) ? v : [v];
  const nums = raw
    .flatMap((x) => String(x).split(","))
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  return nums.length ? nums : undefined;
};

export const getIdCardDashboardStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;
    if (from && !DATE_RE.test(from))
      throw new ApiError(400, "from must be YYYY-MM-DD.");
    if (to && !DATE_RE.test(to))
      throw new ApiError(400, "to must be YYYY-MM-DD.");
    if (from && to && from > to)
      throw new ApiError(400, "`from` date must not be after `to` date.");

    const filters: IdCardDashboardFilters = {
      academicYearIds: parseIntList(req.query.academicYearIds),
      programCourseIds: parseIntList(req.query.programCourseIds),
      from,
      to,
    };

    const stats = await getIdCardDashboardStatsCached(filters);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", stats, "Dashboard stats fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};
