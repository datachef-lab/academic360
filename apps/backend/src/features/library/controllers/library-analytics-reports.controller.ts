import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  getAccessionGrowth,
  getBatchUsage,
  getCopiesDistribution,
  getFootfallReport,
  getHoldingsReport,
  getPopularBooks,
  getPublicationUsage,
  type AnalyticsFilters,
  type BatchUsageMetric,
  type HoldingsGroupBy,
  type PublicationDimension,
} from "@/features/library/services/library-analytics-reports.service.js";
import {
  getBookDemandForecast,
  getFootfallForecast,
} from "@/features/library/services/library-prediction-reports.service.js";

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

const parseFilters = (req: Request): AnalyticsFilters => ({
  branchId: optId(req.query.branchId),
  dateFrom: optDate(req.query.dateFrom),
  dateTo: optDate(req.query.dateTo),
});

const wrap =
  (fn: (req: Request) => Promise<unknown>, label: string) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = await fn(req);
      res.status(200).json(new ApiResponse(200, "SUCCESS", payload, label));
    } catch (error) {
      handleError(error, res, next);
    }
  };

export const footfallReportController = wrap(
  (req) => getFootfallReport(parseFilters(req)),
  "Footfall report fetched.",
);

export const holdingsReportController = wrap((req) => {
  const allowed: HoldingsGroupBy[] = [
    "category",
    "status",
    "language",
    "publisher",
  ];
  const groupBy = allowed.includes(req.query.groupBy as HoldingsGroupBy)
    ? (req.query.groupBy as HoldingsGroupBy)
    : "category";
  return getHoldingsReport(
    parseFilters(req),
    groupBy,
    optId(req.query.page),
    optId(req.query.pageSize),
  );
}, "Holdings report fetched.");

export const accessionGrowthController = wrap(
  (req) => getAccessionGrowth(parseFilters(req)),
  "Accession growth fetched.",
);

export const copiesDistributionController = wrap(
  (req) => getCopiesDistribution(parseFilters(req)),
  "Copies distribution fetched.",
);

export const popularBooksController = wrap(
  (req) =>
    getPopularBooks(parseFilters(req), {
      itemCategoryId: optId(req.query.itemCategoryId),
      page: optId(req.query.page),
      pageSize: optId(req.query.pageSize),
    }),
  "Popular books fetched.",
);

export const publicationUsageController = wrap((req) => {
  const allowed: PublicationDimension[] = ["publisher", "journal", "series"];
  const dimension = allowed.includes(
    req.query.dimension as PublicationDimension,
  )
    ? (req.query.dimension as PublicationDimension)
    : "publisher";
  return getPublicationUsage(
    parseFilters(req),
    dimension,
    optId(req.query.page),
    optId(req.query.pageSize),
  );
}, "Publication usage fetched.");

export const batchUsageController = wrap((req) => {
  const metric: BatchUsageMetric =
    req.query.metric === "footfall" ? "footfall" : "circulation";
  return getBatchUsage(
    parseFilters(req),
    metric,
    optId(req.query.page),
    optId(req.query.pageSize),
  );
}, "Batch usage fetched.");

export const bookDemandForecastController = wrap(
  (req) =>
    getBookDemandForecast(
      { branchId: optId(req.query.branchId) },
      {
        horizonDays: optId(req.query.horizonDays),
        itemCategoryId: optId(req.query.itemCategoryId),
        limit: optId(req.query.limit),
      },
    ),
  "Book demand forecast fetched.",
);

export const footfallForecastController = wrap(
  (req) => getFootfallForecast({ branchId: optId(req.query.branchId) }),
  "Footfall forecast fetched.",
);
