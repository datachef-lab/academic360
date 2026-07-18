import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  startReportJobController,
  downloadReportJobController,
  reportJobStatusController,
} from "./reports-jobs.controller.js";

/**
 * Background report jobs. Mounted at /api/reports.
 *
 * NOTE: jobs + their temp files live in the process that created them
 * (report-job.service is in-memory). If the API is scaled to multiple workers,
 * the `/jobs/:jobId/download` request must be sticky to the producing worker,
 * or the file must move to shared storage. Single worker: no issue.
 */
const router = express.Router();

// Start a report → returns { jobId }; generation runs in the background.
router.post("/:report/start", verifyJWT, startReportJobController);

// Poll status (socket is the primary channel; this is a fallback).
router.get("/jobs/:jobId", verifyJWT, reportJobStatusController);

// Download the finished file.
router.get("/jobs/:jobId/download", verifyJWT, downloadReportJobController);

export default router;
