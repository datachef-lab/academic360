import { NextFunction, Request, Response } from "express";
import { ApiResponse, handleError } from "@/utils/index.js";
import {
  getPromotionRosterPage,
  type PromotionRosterBucket,
  type PromotionRosterSort,
} from "../services/promotion-roster.service.js";

function parseIntQ(v: unknown, fallback: number): number {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function optPositiveInt(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export async function getPromotionRosterHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const q = req.query;
    const academicYearId = parseIntQ(q.academicYearId, NaN);
    const fromSessionId = parseIntQ(q.fromSessionId, NaN);
    const fromClassId = parseIntQ(q.fromClassId, NaN);
    const toSessionId = parseIntQ(q.toSessionId, NaN);
    const toClassId = parseIntQ(q.toClassId, NaN);

    if (
      [academicYearId, fromSessionId, fromClassId, toSessionId, toClassId].some(
        (n) => !Number.isFinite(n) || n < 1,
      )
    ) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "academicYearId, fromSessionId, fromClassId, toSessionId, and toClassId are required positive integers",
          ),
        );
      return;
    }

    const bucket =
      (String(q.bucket || "all") as PromotionRosterBucket) || "all";
    const allowed: PromotionRosterBucket[] = [
      "all",
      "eligible",
      "ineligible",
      "inactive",
      "promoted",
    ];
    if (!allowed.includes(bucket)) {
      res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid bucket"));
      return;
    }

    const sortBy = (String(q.sortBy || "uid") as PromotionRosterSort) || "uid";
    const sortAllowed: PromotionRosterSort[] = [
      "uid",
      "rollNumber",
      "registrationNumber",
    ];
    if (!sortAllowed.includes(sortBy)) {
      res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid sortBy"));
      return;
    }

    const sortDir = String(q.sortDir || "asc") === "desc" ? "desc" : "asc";
    const page = parseIntQ(q.page, 1);
    const pageSize = parseIntQ(q.pageSize, 20);

    const data = await getPromotionRosterPage({
      academicYearId,
      fromSessionId,
      fromClassId,
      toSessionId,
      toClassId,
      affiliationId: optPositiveInt(q.affiliationId),
      regulationTypeId: optPositiveInt(q.regulationTypeId),
      programCourseId: optPositiveInt(q.programCourseId),
      shiftId: optPositiveInt(q.shiftId),
      bucket,
      sortBy,
      sortDir,
      page,
      pageSize,
      q: typeof q.q === "string" ? q.q : undefined,
    });

    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", data, "Promotion roster"));
  } catch (error) {
    handleError(error, res, next);
  }
}
