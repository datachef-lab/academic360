import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  DashboardFilters,
  getLibraryDashboardStats,
} from "@/features/library/services/library-dashboard.service.js";
import { readLibrarySeedStatus } from "@/features/library/services/library-masters-seed.service.js";
import { readCurrentLoadSnapshot } from "@/features/library/services/library-realtime.service.js";
import { getLibrarySyncStatus } from "@/features/library/services/library-sync-status.service.js";
import { runLibraryConsistencyCheck } from "@/features/library/services/library-consistency-check.service.js";
import {
  listActivePatrons,
  listItemCategories,
  listBranchesWithZones,
  listCirculationPolicies,
} from "@/features/library/services/library-dashboard-extras.service.js";
import { readCatalogueCounts } from "@/features/library/services/library-catalogue-counts.service.js";
import { readLibraryHolidaysReport } from "@/features/library/services/library-holidays.service.js";

const optId = (v: unknown): number | undefined => {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

const optDate = (v: unknown): Date | undefined => {
  if (typeof v !== "string" || !v.trim()) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

export const getLibraryDashboardStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const filters: DashboardFilters = {
      branchId: optId(req.query.branchId),
      dateFrom: optDate(req.query.dateFrom),
      dateTo: optDate(req.query.dateTo),
    };
    const stats = await getLibraryDashboardStats(filters);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          stats,
          "Library dashboard stats fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// A small ok() so the four masters controllers below stay tidy.
const ok = (res: Response, payload: unknown, message = "OK") =>
  res.status(200).json(new ApiResponse(200, "SUCCESS", payload, message));

export const getLibrarySeedStatusController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    ok(res, await readLibrarySeedStatus());
  } catch (err) {
    handleError(err, res, next);
  }
};

export const getLibraryLoadStatusController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    ok(res, { snapshot: readCurrentLoadSnapshot() });
  } catch (err) {
    handleError(err, res, next);
  }
};

export const getLibrarySyncStatusController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    ok(res, await getLibrarySyncStatus());
  } catch (err) {
    handleError(err, res, next);
  }
};

export const getLibraryConsistencyReportController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    ok(res, await runLibraryConsistencyCheck());
  } catch (err) {
    handleError(err, res, next);
  }
};

export const listActivePatronsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
    ok(res, await listActivePatrons(limit));
  } catch (err) {
    handleError(err, res, next);
  }
};

export const listItemCategoriesController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    ok(res, await listItemCategories());
  } catch (err) {
    handleError(err, res, next);
  }
};

export const listBranchesWithZonesController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    ok(res, await listBranchesWithZones());
  } catch (err) {
    handleError(err, res, next);
  }
};

export const listCirculationPoliciesController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    ok(res, await listCirculationPolicies());
  } catch (err) {
    handleError(err, res, next);
  }
};

export const listCatalogueCountsController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    ok(res, { groups: await readCatalogueCounts() });
  } catch (err) {
    handleError(err, res, next);
  }
};

export const getLibraryHolidaysReportController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    ok(res, await readLibraryHolidaysReport());
  } catch (err) {
    handleError(err, res, next);
  }
};
