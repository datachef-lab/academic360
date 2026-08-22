import { NextFunction, Request, Response } from "express";

import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  buildAuditReport,
  buildExcelReport,
  listIssuanceDates,
  streamAuditZip,
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
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="id-cards-${date}.xlsx"`,
    );
    // Streamed directly to `res` (see buildExcelReport) — Content-Length is
    // unknown up front and intentionally omitted.
    await buildExcelReport(date, res);
  } catch (e) {
    handleError(e, res, next);
  }
};

/** Parses optional from/to; validates format when present and range order. */
const parseRange = (
  req: Request,
): { from?: string; to?: string; label: string } => {
  const fromRaw = req.query.from ? String(req.query.from) : "";
  const toRaw = req.query.to ? String(req.query.to) : "";
  if (fromRaw && !DATE_RE.test(fromRaw))
    throw new ApiError(400, "from must be YYYY-MM-DD.");
  if (toRaw && !DATE_RE.test(toRaw))
    throw new ApiError(400, "to must be YYYY-MM-DD.");
  if (fromRaw && toRaw && fromRaw > toRaw)
    throw new ApiError(400, "`from` date must not be after `to` date.");
  const from = fromRaw || undefined;
  const to = toRaw || undefined;
  const label = from || to ? `${from ?? "start"}_to_${to ?? "latest"}` : "all";
  return { from, to, label };
};

export const downloadAuditReportController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { from, to, label } = parseRange(req);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="id-card-audit-${label}.xlsx"`,
    );
    await buildAuditReport(from, to, res);
  } catch (e) {
    handleError(e, res, next);
  }
};

export const downloadAuditZipController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { from, to, label } = parseRange(req);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="id-card-audit-images-${label}.zip"`,
    );
    const stream = streamAuditZip(from, to);
    stream.on("error", (err) => {
      console.error("Audit zip stream error", err);
      if (!res.headersSent) res.status(500).end();
      else res.end();
    });
    stream.pipe(res);
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
