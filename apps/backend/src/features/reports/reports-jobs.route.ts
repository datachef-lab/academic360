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
 * Jobs + finished file bytes live in Postgres (`report_jobs`), so `/jobs/:jobId`
 * and `/jobs/:jobId/download` can be served by ANY instance behind the load
 * balancer — no sticky sessions needed. (The previous in-memory registry gave
 * intermittent 404s in multi-instance prod when the download request landed on
 * a different instance than the one that generated the file.)
 */
const router = express.Router();

// Start a report → returns { jobId }; generation runs in the background.
router.post("/:report/start", verifyJWT, startReportJobController);

// Poll status (socket is the primary channel; this is a fallback).
router.get("/jobs/:jobId", verifyJWT, reportJobStatusController);

// Download the finished file.
router.get("/jobs/:jobId/download", verifyJWT, downloadReportJobController);

export default router;
