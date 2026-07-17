import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { socketService } from "@/services/socketService.js";

/**
 * Background report jobs.
 *
 * Every report download used to build its whole Excel/ZIP inside the HTTP
 * request and return one blob — which blocks past the ALB ~60s idle cut on big
 * exports and gives the client no honest progress. Instead the client POSTs to
 * start a job (returns instantly with a jobId), generation runs in the
 * background emitting real progress to the user's socket room tagged with the
 * jobId, and the finished file is fetched from a tokenized download endpoint.
 *
 * The registry is in-memory: jobs and their temp files live for JOB_TTL_MS.
 * That is fine for a single backend process; if the API is ever run as multiple
 * workers, the download request must land on the worker that produced the file
 * (or move the file to shared storage) — see reports.route notes.
 */

export type ReportJobStatus = "pending" | "running" | "completed" | "error";

export interface ReportJob {
  jobId: string;
  /** Socket room owner — String(user.id). */
  userId: string;
  /** Report key (e.g. "student-detailed-report"). */
  report: string;
  reportLabel: string;
  status: ReportJobStatus;
  progress: number;
  message: string;
  fileName?: string;
  filePath?: string;
  contentType?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

const jobs = new Map<string, ReportJob>();

const TMP_DIR = path.join(os.tmpdir(), "academic360-reports");
const JOB_TTL_MS = 30 * 60 * 1000; // keep a finished file downloadable for 30 min

/** Path the client fetches the finished file from. */
export function reportDownloadPath(jobId: string): string {
  return `/api/reports/jobs/${jobId}/download`;
}

export function createReportJob(
  userId: string,
  report: string,
  reportLabel: string,
): ReportJob {
  const job: ReportJob = {
    jobId: randomUUID(),
    userId,
    report,
    reportLabel,
    status: "pending",
    progress: 0,
    message: "Queued…",
    createdAt: Date.now(),
  };
  jobs.set(job.jobId, job);
  return job;
}

export function getReportJob(jobId: string): ReportJob | undefined {
  return jobs.get(jobId);
}

function statusForSocket(
  status: ReportJobStatus,
): "started" | "in_progress" | "completed" | "error" {
  if (status === "pending") return "started";
  if (status === "running") return "in_progress";
  return status;
}

/** Emit the job's current state to the owner's socket room, tagged with jobId. */
function emit(job: ReportJob, downloadUrl?: string): void {
  if (!job.userId) return; // no room to target; nothing to do
  try {
    socketService.sendProgressUpdate(
      job.userId,
      socketService.createExportProgressUpdate(
        job.userId,
        job.message,
        job.progress,
        statusForSocket(job.status),
        job.fileName,
        downloadUrl,
        job.error,
        {
          jobId: job.jobId,
          report: job.report,
          operation: `report_${job.report}`,
        },
      ),
    );
  } catch (err) {
    console.error(`[report-job] failed to emit progress for ${job.jobId}`, err);
  }
}

/** What a report generator produces. */
export interface GeneratedReport {
  buffer: Buffer;
  fileName: string;
  contentType: string;
}

/** Progress callback handed to generators. pct is clamped to the 5–90 band so
 * "queued" (0–5) and "finalizing/writing" (90–100) stay reserved. */
export type ReportProgress = (pct: number, message: string) => void;

function sanitizeFileName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 180) || "report";
}

/**
 * Run a report generator in the background: emit progress, write the result to
 * a temp file, then emit completion carrying the download URL. Never throws —
 * failures are reported to the client as an "error" progress event.
 */
export async function runReportJob(
  job: ReportJob,
  generate: (onProgress: ReportProgress) => Promise<GeneratedReport>,
): Promise<void> {
  job.status = "running";
  job.progress = 5;
  job.message = `Preparing ${job.reportLabel}…`;
  emit(job);

  try {
    const onProgress: ReportProgress = (pct, message) => {
      job.progress = Math.max(5, Math.min(90, Math.round(pct)));
      job.message = message;
      emit(job);
    };

    const { buffer, fileName, contentType } = await generate(onProgress);

    job.progress = 92;
    job.message = "Finalizing file…";
    emit(job);

    await fs.mkdir(TMP_DIR, { recursive: true });
    const filePath = path.join(
      TMP_DIR,
      `${job.jobId}-${sanitizeFileName(fileName)}`,
    );
    await fs.writeFile(filePath, buffer);

    job.fileName = fileName;
    job.filePath = filePath;
    job.contentType = contentType;
    job.status = "completed";
    job.progress = 100;
    job.completedAt = Date.now();
    job.message = `${job.reportLabel} is ready`;
    emit(job, reportDownloadPath(job.jobId));

    scheduleCleanup(job.jobId);
  } catch (err) {
    console.error(`[report-job] ${job.report} (${job.jobId}) failed`, err);
    job.status = "error";
    job.progress = 100;
    job.error = err instanceof Error ? err.message : "Report generation failed";
    job.message = `Failed to generate ${job.reportLabel}`;
    emit(job);
    scheduleCleanup(job.jobId);
  }
}

/** Delete the temp file and drop the job after the TTL. */
function scheduleCleanup(jobId: string): void {
  setTimeout(() => {
    void cleanupJob(jobId);
  }, JOB_TTL_MS).unref?.();
}

export async function cleanupJob(jobId: string): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return;
  if (job.filePath) {
    await fs.rm(job.filePath, { force: true }).catch(() => {});
  }
  jobs.delete(jobId);
}
