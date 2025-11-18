import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { getAcademicSetupStats } from "../services/academicsetup-stats.service.js";

type QueryValue =
  | string
  | string[]
  | undefined
  | Record<string, unknown>
  | Array<Record<string, unknown>>;

const normalizeQueryValue = (value: QueryValue): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return undefined;
};

export const getAcademicSetupStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const academicYearIdValue = normalizeQueryValue(
      req.query.academicYearId as QueryValue,
    );
    const academicYearValue =
      normalizeQueryValue(req.query.academicYear as QueryValue) ??
      normalizeQueryValue(req.query.year as QueryValue);

    const academicYearId =
      academicYearIdValue && academicYearIdValue.trim() !== ""
        ? Number(academicYearIdValue)
        : undefined;
    const academicYear =
      academicYearValue && academicYearValue.trim() !== ""
        ? academicYearValue.trim()
        : undefined;

    if (academicYearId !== undefined && Number.isNaN(academicYearId)) {
      return res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Invalid academicYearId"));
    }

    const stats = await getAcademicSetupStats({
      academicYearId,
      academicYear,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          stats,
          "Academic setup stats fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
