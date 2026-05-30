import { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse";
import { handleError } from "@/utils";
import {
  getFeesDashboardData,
  type FeesDashboardFilters,
} from "../services/fees-dashboard.service.js";

function parseIntList(value: unknown): number[] | undefined {
  if (value == null || value === "") return undefined;
  const raw = Array.isArray(value) ? value : String(value).split(",");
  const nums = raw.map((v) => Number(v)).filter((n) => Number.isFinite(n));
  return nums.length ? nums : undefined;
}

function parseStringList(value: unknown): string[] | undefined {
  if (value == null || value === "") return undefined;
  const raw = Array.isArray(value) ? value : String(value).split(",");
  const items = raw.map((v) => String(v).trim()).filter(Boolean);
  return items.length ? items : undefined;
}

function parseOptionalString(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  const s = String(value).trim();
  return s || undefined;
}

export async function getFeesDashboardHandler(req: Request, res: Response) {
  try {
    const q = req.query ?? {};
    const filters: FeesDashboardFilters = {
      academicYearIds: parseIntList(q.academicYearIds ?? q.academicYearId),
      programCourseIds: parseIntList(q.programCourseIds ?? q.programCourseId),
      classIds: parseIntList(q.classIds ?? q.classId),
      shiftIds: parseIntList(q.shiftIds ?? q.shiftId),
      streamIds: parseIntList(q.streamIds),
      courseLevelIds: parseIntList(q.courseLevelIds),
      regulationTypeIds: parseIntList(q.regulationTypeIds),
      affiliationIds: parseIntList(q.affiliationIds),
      categoryIds: parseIntList(q.categoryIds),
      religionIds: parseIntList(q.religionIds),
      genders: parseStringList(q.genders),
      paymentStatuses: parseStringList(q.paymentStatuses),
      paymentModes: parseStringList(q.paymentModes),
      transactionStatuses: parseStringList(q.transactionStatuses),
      dateFrom: parseOptionalString(q.dateFrom),
      dateTo: parseOptionalString(q.dateTo),
      studentSearch: parseOptionalString(q.studentSearch),
    };

    const payload = await getFeesDashboardData(filters);
    return res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", payload, "Fees dashboard loaded"));
  } catch (error) {
    if (error instanceof Error) {
      console.error("[fees-dashboard]", error.stack ?? error.message);
    }
    return handleError(error, res);
  }
}
