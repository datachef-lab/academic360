import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  buildLibraryReport,
  formatAishe,
  formatNaac,
  formatNirf,
} from "@/features/library/services/library-reports.service.js";

const yearFromQuery = (req: Request) => {
  const y = req.query.year ?? req.query.academicYear;
  if (typeof y !== "string" || !y.trim())
    throw new ApiError(
      400,
      "Query param 'year' is required (YYYY or YYYY-YY).",
    );
  return y.trim();
};

export const getNaacReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const year = yearFromQuery(req);
    const p = await buildLibraryReport(year);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", formatNaac(p), "NAAC report ready."),
      );
  } catch (e) {
    handleError(e, res, next);
  }
};

export const getNirfReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const year = yearFromQuery(req);
    const p = await buildLibraryReport(year);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", formatNirf(p), "NIRF report ready."),
      );
  } catch (e) {
    handleError(e, res, next);
  }
};

export const getAisheReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const year = yearFromQuery(req);
    const p = await buildLibraryReport(year);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", formatAishe(p), "AISHE report ready."),
      );
  } catch (e) {
    handleError(e, res, next);
  }
};
