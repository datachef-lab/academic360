import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db/index.js";
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
 * MULTI-INSTANCE: the registry and the finished file bytes live in Postgres
 * (`report_jobs`), NOT in per-process memory or the local tmp dir. Behind a
 * round-robin load balancer the download GET routinely lands on a different
 * instance than the one that generated the file — the previous in-memory
 * registry produced intermittent 404s in production for exactly that reason.
 * Any instance can now serve any job's status or file. Progress events still
 * stream from the generating instance; the Socket.IO Redis adapter fans them
 * out to whichever instance holds the user's connection.
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
  contentType?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

/** Path the client fetches the finished file from. */
export function reportDownloadPath(jobId: string): string {
  return `/api/reports/jobs/${jobId}/download`;
}

let tableEnsured: Promise<void> | null = null;

function ensureReportJobsTable(): Promise<void> {
  if (!tableEnsured) {
    tableEnsured = db
      .execute(
        sql`
          CREATE TABLE IF NOT EXISTS report_jobs (
            job_id       uuid PRIMARY KEY,
            user_id      text NOT NULL,
            report       text NOT NULL,
            report_label text NOT NULL,
            status       text NOT NULL DEFAULT 'pending',
            progress     integer NOT NULL DEFAULT 0,
            message      text NOT NULL DEFAULT '',
            file_name    text,
            content_type text,
            file_bytes   bytea,
            error        text,
            created_at   timestamptz NOT NULL DEFAULT NOW(),
            completed_at timestamptz
          )
        `,
      )
      .then(() => undefined)
      .catch((err) => {
        tableEnsured = null; // retry on next call
        throw err;
      });
  }
  return tableEnsured;
}

/**
 * Drop expired jobs (and their file bytes). Runs opportunistically on job
 * creation so cleanup doesn't depend on any one instance staying alive —
 * a setTimeout-based cleanup dies with the process that scheduled it.
 */
async function sweepExpiredJobs(): Promise<void> {
  await db.execute(sql`
    DELETE FROM report_jobs
    WHERE created_at < NOW() - INTERVAL '60 minutes'
  `);
}

export async function createReportJob(
  userId: string,
  report: string,
  reportLabel: string,
): Promise<ReportJob> {
  await ensureReportJobsTable();
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
  await db.execute(sql`
    INSERT INTO report_jobs (job_id, user_id, report, report_label, status, progress, message)
    VALUES (${job.jobId}, ${userId}, ${report}, ${reportLabel}, 'pending', 0, ${job.message})
  `);
  void sweepExpiredJobs().catch(() => undefined);
  return job;
}

type ReportJobRow = {
  job_id: string;
  user_id: string;
  report: string;
  report_label: string;
  status: ReportJobStatus;
  progress: number;
  message: string;
  file_name: string | null;
  content_type: string | null;
  error: string | null;
  created_at: Date | string;
  completed_at: Date | string | null;
};

function rowToJob(r: ReportJobRow): ReportJob {
  return {
    jobId: r.job_id,
    userId: r.user_id,
    report: r.report,
    reportLabel: r.report_label,
    status: r.status,
    progress: Number(r.progress ?? 0),
    message: r.message ?? "",
    fileName: r.file_name ?? undefined,
    contentType: r.content_type ?? undefined,
    error: r.error ?? undefined,
    createdAt: new Date(r.created_at).getTime(),
    completedAt: r.completed_at
      ? new Date(r.completed_at).getTime()
      : undefined,
  };
}

/** Job metadata WITHOUT the file bytes — cheap for status checks. */
export async function getReportJob(
  jobId: string,
): Promise<ReportJob | undefined> {
  await ensureReportJobsTable();
  const res = await db.execute(sql`
    SELECT job_id, user_id, report, report_label, status, progress, message,
           file_name, content_type, error, created_at, completed_at
    FROM report_jobs
    WHERE job_id = ${jobId}
  `);
  const row = res.rows[0] as ReportJobRow | undefined;
  return row ? rowToJob(row) : undefined;
}

/** Finished file bytes for the download endpoint. */
export async function getReportJobFile(jobId: string): Promise<Buffer | null> {
  await ensureReportJobsTable();
  const res = await db.execute(sql`
    SELECT file_bytes FROM report_jobs WHERE job_id = ${jobId}
  `);
  const bytes = (res.rows[0] as { file_bytes?: Buffer | null } | undefined)
    ?.file_bytes;
  return bytes instanceof Buffer ? bytes : bytes ? Buffer.from(bytes) : null;
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

/**
 * Persist progress so the HTTP status fallback (served by ANY instance) shows
 * live numbers even when the socket event was missed. Fire-and-forget — a lost
 * progress write only staleness-lags the fallback, never the socket stream.
 */
function persistProgress(job: ReportJob): void {
  void db
    .execute(
      sql`
        UPDATE report_jobs
        SET status = ${job.status}, progress = ${job.progress}, message = ${job.message}
        WHERE job_id = ${job.jobId}
      `,
    )
    .catch(() => undefined);
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

/**
 * Run a report generator in the background: emit progress, write the result to
 * the report_jobs row, then emit completion carrying the download URL. Never
 * throws — failures are reported to the client as an "error" progress event.
 */
export async function runReportJob(
  job: ReportJob,
  generate: (onProgress: ReportProgress) => Promise<GeneratedReport>,
): Promise<void> {
  job.status = "running";
  job.progress = 5;
  job.message = `Preparing ${job.reportLabel}…`;
  emit(job);
  persistProgress(job);

  // Most generators are opaque (one big query → a Buffer) and report no
  // intermediate progress, which left the bar frozen at 5% for the whole run.
  // A heartbeat creeps the bar forward while generation is in flight so it reads
  // as "working", capped at 85% so real completion still jumps to 100%. If a
  // generator DOES report real progress via onProgress, it cancels the heartbeat
  // and drives the bar itself. (During a synchronous ExcelJS build the event
  // loop is blocked and the timer pauses — that's fine; the long part is the
  // awaited DB query, where it ticks.)
  let heartbeat = 5;
  let usingRealProgress = false;
  const timer: ReturnType<typeof setInterval> = setInterval(() => {
    if (usingRealProgress) return;
    if (heartbeat < 85) {
      heartbeat = Math.min(85, heartbeat + 4);
      job.progress = heartbeat;
      job.message = `Generating ${job.reportLabel}…`;
      emit(job);
      persistProgress(job);
    }
  }, 1200);
  timer.unref?.();

  try {
    const onProgress: ReportProgress = (pct, message) => {
      usingRealProgress = true;
      job.progress = Math.max(5, Math.min(90, Math.round(pct)));
      job.message = message;
      emit(job);
      persistProgress(job);
    };

    const { buffer, fileName, contentType } = await generate(onProgress);
    clearInterval(timer);

    job.progress = 92;
    job.message = "Finalizing file…";
    emit(job);

    job.fileName = fileName;
    job.contentType = contentType;
    job.status = "completed";
    job.progress = 100;
    job.completedAt = Date.now();
    job.message = `${job.reportLabel} is ready`;
    await db.execute(sql`
      UPDATE report_jobs
      SET status = 'completed', progress = 100, message = ${job.message},
          file_name = ${fileName}, content_type = ${contentType},
          file_bytes = ${buffer}, error = NULL, completed_at = NOW()
      WHERE job_id = ${job.jobId}
    `);
    emit(job, reportDownloadPath(job.jobId));
    console.log(
      `[report-job] ${job.report} (${job.jobId}) completed in ${
        job.completedAt - job.createdAt
      }ms → ${fileName} (${buffer.length}b)`,
    );
  } catch (err) {
    clearInterval(timer);
    console.error(`[report-job] ${job.report} (${job.jobId}) failed`, err);
    job.status = "error";
    job.progress = 100;
    job.error = err instanceof Error ? err.message : "Report generation failed";
    job.message = `Failed to generate ${job.reportLabel}`;
    await db
      .execute(
        sql`
          UPDATE report_jobs
          SET status = 'error', progress = 100, message = ${job.message},
              error = ${job.error}, completed_at = NOW()
          WHERE job_id = ${job.jobId}
        `,
      )
      .catch(() => undefined);
    emit(job);
  }
}
