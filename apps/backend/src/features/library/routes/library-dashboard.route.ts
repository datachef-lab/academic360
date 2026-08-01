import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  getLibraryDashboardStatsController,
  getLibrarySeedStatusController,
  getLibraryConsistencyReportController,
  getLibraryLoadStatusController,
  listActivePatronsController,
  listBranchesWithZonesController,
  listCirculationPoliciesController,
  listItemCategoriesController,
  listCatalogueCountsController,
  getLibraryHolidaysReportController,
} from "@/features/library/controllers/library-dashboard.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.get("/stats", getLibraryDashboardStatsController);
// Seed status drives the amber "seeded defaults present" banner.
router.get("/seed-status", getLibrarySeedStatusController);
// Post-load sanity report — IRP counts vs new-DB counts + orphan/fine checks.
router.get("/consistency-check", getLibraryConsistencyReportController);
// In-memory snapshot of the current legacy load — lets a dashboard opening
// mid-load hydrate the banner immediately, without waiting for the next emit.
router.get("/load-status", getLibraryLoadStatusController);
// Read-only listings that back the new dashboard tabs.
router.get("/patrons", listActivePatronsController);
router.get("/item-categories", listItemCategoriesController);
router.get("/branches", listBranchesWithZonesController);
router.get("/policies", listCirculationPoliciesController);
// One roll-up of counts across every article/master/operational table — feeds
// the Holdings tab's comprehensive breakdown.
router.get("/catalogue-counts", listCatalogueCountsController);
// Holidays roll-up + program-course × class breakdown for the Holidays tab.
router.get("/holidays-report", getLibraryHolidaysReportController);
export default router;
