import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  getFinesCollected,
  getFinesOutstanding,
  getHighDemandTitles,
  getOverdueList,
  getStockSummary,
  type ReportFilters,
} from "@/features/library/services/library-operational-reports.service.js";

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

const parseFilters = (req: Request): ReportFilters => ({
  branchId: optId(req.query.branchId),
  dateFrom: optDate(req.query.dateFrom),
  dateTo: optDate(req.query.dateTo),
});

const wrap =
  (fn: (req: Request) => Promise<unknown>, label: string) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = await fn(req);
      res.status(200).json(new ApiResponse(200, "SUCCESS", payload, label));
    } catch (error) {
      handleError(error, res, next);
    }
  };

export const overdueListController = wrap(
  (req) => getOverdueList(parseFilters(req)),
  "Overdue list fetched.",
);
export const finesOutstandingController = wrap(
  (req) => getFinesOutstanding(parseFilters(req)),
  "Fines outstanding fetched.",
);
export const finesCollectedController = wrap(
  (req) => getFinesCollected(parseFilters(req)),
  "Fines collected fetched.",
);
export const stockSummaryController = wrap(
  (req) => getStockSummary(parseFilters(req)),
  "Stock summary fetched.",
);
export const highDemandTitlesController = wrap((req) => {
  const limit = optId(req.query.limit) ?? 25;
  return getHighDemandTitles(parseFilters(req), Math.min(limit, 100));
}, "High-demand titles fetched.");
