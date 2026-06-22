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
  createIssueController,
  deleteIssueController,
  getIssueController,
  getMostRecentIssueForStudentController,
  getStudentIdCardValidityController,
  idCardIssueUpload,
  listIssuesController,
  streamIssueFrontImageController,
  streamIssuePhotoImageController,
} from "@/features/idcard/controllers/id-card-issue.controller.js";
import {
  downloadExcelReportController,
  downloadZipReportController,
  listReportDatesController,
} from "@/features/idcard/controllers/id-card-report.controller.js";

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
router.get("/issues/:id", getIssueController);
router.get("/issues/:id/front", streamIssueFrontImageController);
router.get("/issues/:id/photo", streamIssuePhotoImageController);
router.delete("/issues/:id", deleteIssueController);

router.get(
  "/students/:studentId/most-recent-issue",
  getMostRecentIssueForStudentController,
);

router.get("/students/:studentId/validity", getStudentIdCardValidityController);

// Reports
router.get("/reports/dates", listReportDatesController);
router.get("/reports/excel", downloadExcelReportController);
router.get("/reports/zip", downloadZipReportController);

export default router;
