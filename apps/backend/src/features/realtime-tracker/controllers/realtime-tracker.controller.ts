import type { Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { parseRealtimeTrackerFilters } from "@/utils/realtime-tracker-filters.js";
import {
  getAffiliationDisplayLabel,
  getAffiliationRegistrationDataCached,
  getExamFormDeclarationDataCached,
  getFeeMisDataCached,
} from "../services/realtime-tracker.service.js";

export async function getAffiliationRegistrationHandler(
  req: Request,
  res: Response,
) {
  try {
    const filters = parseRealtimeTrackerFilters(
      (req.query ?? {}) as Record<string, unknown>,
    );
    const payload = await getAffiliationRegistrationDataCached(filters);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          payload,
          "Affiliation registration loaded",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getExamFormDeclarationHandler(
  req: Request,
  res: Response,
) {
  try {
    const filters = parseRealtimeTrackerFilters(
      (req.query ?? {}) as Record<string, unknown>,
    );
    const payload = await getExamFormDeclarationDataCached(filters);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          payload,
          "Exam form upload & fee declarations loaded",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeMisHandler(req: Request, res: Response) {
  try {
    const filters = parseRealtimeTrackerFilters(
      (req.query ?? {}) as Record<string, unknown>,
    );
    const payload = await getFeeMisDataCached(filters);
    return res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", payload, "Fee MIS loaded"));
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getAffiliationTabLabelHandler(
  req: Request,
  res: Response,
) {
  try {
    const filters = parseRealtimeTrackerFilters(
      (req.query ?? {}) as Record<string, unknown>,
    );
    const label = await getAffiliationDisplayLabel(filters.affiliationIds);
    return res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", { label }, "Tab label"));
  } catch (error) {
    return handleError(error, res);
  }
}
