import express from "express";

import { verifyJWT } from "@/middlewares/index.js";
import {
  createTemplateController,
  deleteTemplateController,
  getTemplateController,
  idCardTemplateUpload,
  listTemplatesController,
  streamTemplateBacksideController,
  streamTemplateImageController,
  updateTemplateController,
} from "@/features/idcard/controllers/id-card-template.controller.js";
import {
  listFieldsController,
  upsertFieldsController,
} from "@/features/idcard/controllers/id-card-template-field.controller.js";
import {
  checkRfidController,
  createIssueController,
  deleteIssueController,
  finalizeIssueController,
  getIssueController,
  getMostRecentIssueForStudentController,
  getStudentIdCardValidityController,
  idCardIssueUpload,
  listIssuesController,
  runLegacyIdCardSyncController,
  streamIssueFrontImageController,
  streamIssuePhotoImageController,
} from "@/features/idcard/controllers/id-card-issue.controller.js";
import {
  downloadAuditReportController,
  downloadAuditZipController,
  downloadExcelReportController,
  downloadZipReportController,
  listReportDatesController,
} from "@/features/idcard/controllers/id-card-report.controller.js";
import { getIdCardDashboardStatsController } from "@/features/idcard/controllers/id-card-dashboard.controller.js";

const router = express.Router();
router.use(verifyJWT);

// Templates
router.get("/templates", listTemplatesController);
router.post("/templates", idCardTemplateUpload, createTemplateController);
router.get("/templates/:id", getTemplateController);
router.get("/templates/:id/image", streamTemplateImageController);
router.get("/templates/:id/backside", streamTemplateBacksideController);
router.put("/templates/:id", idCardTemplateUpload, updateTemplateController);
router.delete("/templates/:id", deleteTemplateController);

// Template fields
router.get("/templates/:id/fields", listFieldsController);
router.put("/templates/:id/fields", upsertFieldsController);

// Issues
router.get("/issues", listIssuesController);
router.post("/issues", idCardIssueUpload, createIssueController);
// RFID uniqueness check for the finalize dialog (before the :id routes below).
router.get("/rfid/check", checkRfidController);
router.get("/issues/:id", getIssueController);
router.get("/issues/:id/front", streamIssueFrontImageController);
router.get("/issues/:id/photo", streamIssuePhotoImageController);
// Finalize a DRAFT into a real issue (sets type, rfid, saved_at).
router.patch("/issues/:id/finalize", finalizeIssueController);
router.delete("/issues/:id", deleteIssueController);

// One-time legacy backfill — manual trigger (idempotent via legacyIssueId).
router.post("/legacy-sync", runLegacyIdCardSyncController);

router.get(
  "/students/:studentId/most-recent-issue",
  getMostRecentIssueForStudentController,
);

router.get("/students/:studentId/validity", getStudentIdCardValidityController);

// Realtime dashboard aggregates (Redis epoch-cached; live via broadcast middleware).
router.get("/dashboard/stats", getIdCardDashboardStatsController);

// Reports
router.get("/reports/dates", listReportDatesController);
router.get("/reports/excel", downloadExcelReportController);
router.get("/reports/zip", downloadZipReportController);
// Audit report over an optional issue-date range (0043-style joins).
router.get("/reports/audit", downloadAuditReportController);
router.get("/reports/audit-zip", downloadAuditZipController);

export default router;
