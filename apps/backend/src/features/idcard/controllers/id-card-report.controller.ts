import { NextFunction, Request, Response } from "express";

import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  buildExcelReport,
  listIssuanceDates,
  streamZipForRange,
} from "@/features/idcard/services/id-card-report.service.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Resolve a date range from the request query. Accepts either a single
 * `date=YYYY-MM-DD` (legacy / preset selection) or a custom `from`+`to`
 * range. Throws a 400 for malformed or reversed ranges.
 */
const resolveRange = (
  query: Request["query"],
): { from: string; to: string } => {
  const date = String(query.date ?? "");
  const from = String(query.from ?? "") || date;
  const to = String(query.to ?? "") || date;

  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    throw new ApiError(400, "date=YYYY-MM-DD or from/to range required.");
  }
  if (from > to) {
    throw new ApiError(400, "`from` date must not be after `to` date.");
  }
  return { from, to };
};

const rangeFileLabel = (from: string, to: string) =>
  from === to ? from : `${from}_to_${to}`;

export const listReportDatesController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dates = await listIssuanceDates();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", { dates }, "Dates fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const downloadExcelReportController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { from, to } = resolveRange(req.query);
    const buf = await buildExcelReport(from, to);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="id-cards-${rangeFileLabel(from, to)}.xlsx"`,
    );
    res.send(buf);
  } catch (e) {
    handleError(e, res, next);
  }
};

export const downloadZipReportController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { from, to } = resolveRange(req.query);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="id-cards-${rangeFileLabel(from, to)}.zip"`,
    );
    const stream = streamZipForRange(from, to);
    stream.on("error", (err) => {
      console.error("Zip stream error", err);
      if (!res.headersSent) res.status(500).end();
      else res.end();
    });
    stream.pipe(res);
  } catch (e) {
    handleError(e, res, next);
  }
};
