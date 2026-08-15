import { ApiResponse, handleError } from "@/utils";
import { NextFunction, Request, Response } from "express";
import {
  getExamDashboardStats,
  type ExamDashboardFilters,
} from "../services/exam-dashboard.service";

function optId(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
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
      academicYearId: optId(req.query.academicYearId),
      examTypeId: optId(req.query.examTypeId),
      classId: optId(req.query.classId),
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
