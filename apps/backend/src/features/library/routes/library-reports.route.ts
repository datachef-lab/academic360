import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  getAisheReport,
  getNaacReport,
  getNirfReport,
} from "@/features/library/controllers/library-reports.controller.js";
import {
  finesCollectedController,
  finesOutstandingController,
  highDemandTitlesController,
  overdueListController,
  stockSummaryController,
} from "@/features/library/controllers/library-operational-reports.controller.js";
import {
  accessionGrowthController,
  batchUsageController,
  bookDemandForecastController,
  copiesDistributionController,
  footfallForecastController,
  footfallReportController,
  holdingsReportController,
  popularBooksController,
  publicationUsageController,
} from "@/features/library/controllers/library-analytics-reports.controller.js";

const router = express.Router();
router.use(verifyJWT);

// Compliance
router.get("/naac", getNaacReport);
router.get("/nirf", getNirfReport);
router.get("/aishe", getAisheReport);

// Operational / Finance / Inventory
router.get("/overdue", overdueListController);
router.get("/fines-outstanding", finesOutstandingController);
router.get("/fines-collected", finesCollectedController);
router.get("/stock-summary", stockSummaryController);
router.get("/high-demand-titles", highDemandTitlesController);

// Analytics & predictions
router.get("/footfall", footfallReportController);
router.get("/holdings", holdingsReportController);
router.get("/accession-growth", accessionGrowthController);
router.get("/copies-distribution", copiesDistributionController);
router.get("/popular-books", popularBooksController);
router.get("/publication-usage", publicationUsageController);
router.get("/batch-usage", batchUsageController);
router.get("/predict/book-demand", bookDemandForecastController);
router.get("/predict/footfall", footfallForecastController);

export default router;
