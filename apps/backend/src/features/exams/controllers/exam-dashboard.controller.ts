import { ApiResponse, handleError } from "@/utils";
import { NextFunction, Request, Response } from "express";
import {
  getExamDashboardStats,
  type ExamDashboardFilters,
} from "../services/exam-dashboard.service";

/** Parse a repeated or CSV query param into a positive-int array. */
function optIds(v: unknown): number[] | undefined {
  const raw = Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : [];
  const nums = raw
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n > 0);
  return nums.length ? nums : undefined;
}

function optDate(v: unknown): Date | undefined {
  if (typeof v !== "string" || !v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export const getExamDashboardStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const filters: ExamDashboardFilters = {
      academicYearIds: optIds(req.query.academicYearIds),
      examTypeIds: optIds(req.query.examTypeIds),
      classIds: optIds(req.query.classIds),
      shiftIds: optIds(req.query.shiftIds),
      programCourseIds: optIds(req.query.programCourseIds),
      subjectTypeIds: optIds(req.query.subjectTypeIds),
      dateFrom: optDate(req.query.dateFrom),
      dateTo: optDate(req.query.dateTo),
    };
    const stats = await getExamDashboardStats(filters);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          stats,
          "Exam dashboard stats fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
