import { Request, Response, NextFunction } from "express";
import {
  getAcademicSetupQuickCounts,
  getAcademicSetupCountsGroupedByYear,
} from "../services/academic-setup-stats.service.js";
import { handleError } from "@/utils/handleError.js";

export async function getStatsByAcademicYear(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const academicYearId = Number(req.params.academicYearId);
    if (!Number.isInteger(academicYearId)) {
      return res.status(400).json({
        statusCode: 400,
        status: "ERROR",
        message: "Invalid academicYearId",
      });
    }
    const counts = await getAcademicSetupQuickCounts(academicYearId);
    res.status(200).json({
      statusCode: 200,
      status: "SUCCESS",
      data: counts,
      message: "Academic setup quick counts fetched successfully!",
    });
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getStatsGroupedByAcademicYear(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getAcademicSetupCountsGroupedByYear();
    res.status(200).json({
      statusCode: 200,
      status: "SUCCESS",
      data,
      message:
        "Academic setup counts grouped by academic year fetched successfully!",
    });
  } catch (error) {
    handleError(error, res, next);
  }
}
