import { NextFunction, Request, Response } from "express";

import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  buildExcelReport,
  listIssuanceDates,
  streamZipForDate,
} from "@/features/idcard/services/id-card-report.service.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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
    const date = String(req.query.date ?? "");
    if (!DATE_RE.test(date))
      throw new ApiError(400, "date=YYYY-MM-DD required.");
    const buf = await buildExcelReport(date);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="id-cards-${date}.xlsx"`,
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
    const date = String(req.query.date ?? "");
    if (!DATE_RE.test(date))
      throw new ApiError(400, "date=YYYY-MM-DD required.");
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="id-cards-${date}.zip"`,
    );
    const stream = streamZipForDate(date);
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
