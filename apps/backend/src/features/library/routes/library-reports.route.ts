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

export default router;
