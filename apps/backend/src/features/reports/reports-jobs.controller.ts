import { NextFunction, Request, Response } from "express";
import { promises as fs } from "node:fs";
import { ApiError, ApiResponse, handleError } from "@/utils/index.js";
import { getReportDescriptor } from "./report-generators.js";
import {
  createReportJob,
  getReportJob,
  runReportJob,
  reportDownloadPath,
} from "./report-job.service.js";

function requestUserId(req: Request): string {
  const id = (req as any).user?.id;
  return id == null ? "" : String(id);
}

/**
 * POST /api/reports/:report/start
 * Validates the report + params, creates a background job, and responds
 * immediately with the jobId. Generation streams progress over the socket.
 */
export const startReportJobController = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const report = String(req.params.report);
    const descriptor = getReportDescriptor(report);
    if (!descriptor) {
      return res
        .status(404)
        .json(new ApiError(404, `Unknown report "${report}"`));
    }

    const userId = requestUserId(req);
    if (!userId) {
      return res
        .status(401)
        .json(new ApiError(401, "Authentication required to run a report"));
    }

    const job = createReportJob(userId, descriptor.key, descriptor.label);

    // Respond first; run in the background (mirrors the async student import).
    res
      .status(202)
      .json(
        new ApiResponse(
          202,
          "ACCEPTED",
          { jobId: job.jobId },
          `${descriptor.label} started`,
        ),
      );

    // runReportJob supplies the onProgress that actually emits over the socket;
    // hand it straight to the generator.
    void runReportJob(job, (onProgress) =>
      descriptor.generate({ req, userId, onProgress }),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

/**
 * GET /api/reports/jobs/:jobId/download
 * Streams the finished file. Guarded so only the job's owner can fetch it.
 */
export const downloadReportJobController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jobId = String(req.params.jobId);
    const job = getReportJob(jobId);
    if (!job) {
      return res
        .status(404)
        .json(new ApiError(404, "Report job not found or expired"));
    }

    const userId = requestUserId(req);
    if (userId && job.userId && userId !== job.userId) {
      return res.status(403).json(new ApiError(403, "Not your report"));
    }

    if (job.status === "error") {
      return res
        .status(500)
        .json(new ApiError(500, job.error || "Report generation failed"));
    }
    if (job.status !== "completed" || !job.filePath) {
      return res.status(409).json(new ApiError(409, "Report is not ready yet"));
    }

    const buffer = await fs.readFile(job.filePath);
    res.setHeader(
      "Content-Type",
      job.contentType ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${job.fileName || "report"}"`,
    );
    res.setHeader("Content-Length", buffer.length);
    res.status(200).send(buffer);
  } catch (error) {
    handleError(error, res, next);
  }
};

/**
 * GET /api/reports/jobs/:jobId
 * Status fallback for clients that miss the socket event.
 */
export const reportJobStatusController = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const job = getReportJob(String(req.params.jobId));
    if (!job) {
      return res
        .status(404)
        .json(new ApiError(404, "Report job not found or expired"));
    }
    return res.status(200).json(
      new ApiResponse(200, "SUCCESS", {
        jobId: job.jobId,
        report: job.report,
        status: job.status,
        progress: job.progress,
        message: job.message,
        fileName: job.fileName,
        error: job.error,
        downloadUrl:
          job.status === "completed"
            ? reportDownloadPath(job.jobId)
            : undefined,
      }),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};
