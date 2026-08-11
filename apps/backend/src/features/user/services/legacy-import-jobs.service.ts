import { randomUUID, createHash } from "node:crypto";
import os from "node:os";
import { sql } from "drizzle-orm";
import { db } from "@/db/index.js";

/**
 * Legacy Excel-UID import job registry.
 *
 * Mirrors the pattern in `reports/report-job.service.ts` (ADR 0019): job state
 * and the finished error-report XLSX bytes live in Postgres, NOT in per-process
 * memory or on local disk. Any backend instance can serve status / download
 * even when the import ran on a sibling instance — matters behind the ALB
 * (no sticky sessions).
 *
 * Table is created lazily via `CREATE TABLE IF NOT EXISTS` so this hotfix
 * ships without a Drizzle schema change.
 */

export type LegacyImportJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed";

export interface LegacyImportJob {
  jobId: string;
  status: LegacyImportJobStatus;
  uploaderUserId: number | null;
  uploaderName: string | null;
  fileName: string | null;
  fileHash: string;
  totalUids: number;
  processed: number;
  notFound: number;
  errorCount: number;
  summary: unknown; // final { processed, notFound, notFoundUids, errors[], … }
  errorReportName: string | null;
  hasErrorReport: boolean;
  instanceId: string;
  startedAt: string;
  updatedAt: string;
  finishedAt: string | null;
}

const INSTANCE_ID = `${os.hostname()}-${process.pid}`;

let tableEnsured: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!tableEnsured) {
    tableEnsured = db
      .execute(
        sql`
          CREATE TABLE IF NOT EXISTS legacy_import_jobs (
            job_id             uuid PRIMARY KEY,
            status             text NOT NULL DEFAULT 'queued',
            uploader_user_id   integer,
            uploader_name      text,
            file_name          text,
            file_hash          text NOT NULL,
            total_uids         integer NOT NULL DEFAULT 0,
            processed          integer NOT NULL DEFAULT 0,
            not_found          integer NOT NULL DEFAULT 0,
            error_count        integer NOT NULL DEFAULT 0,
            summary            jsonb,
            error_report_bytes bytea,
            error_report_name  text,
            instance_id        text NOT NULL,
            started_at         timestamptz NOT NULL DEFAULT now(),
            updated_at         timestamptz NOT NULL DEFAULT now(),
            finished_at        timestamptz
          )
        `,
      )
      .then(async () => {
        // UNIQUE partial index on (file_hash) restricted to in-flight rows —
        // makes the double-submit dedupe race-safe across instances. When two
        // instances receive the same file at the exact same moment both call
        // findActiveJobByFileHash → both see empty → both INSERT; without this
        // uniqueness the second INSERT would silently create a rival run.
        // With it, the second INSERT throws 23505; the controller catches it
        // and re-reads the winning row to return 409.
        await db
          .execute(
            sql`
              CREATE UNIQUE INDEX IF NOT EXISTS legacy_import_jobs_active_hash_uidx
              ON legacy_import_jobs (file_hash)
              WHERE status IN ('queued','running')
            `,
          )
          .catch(() => undefined);
      })
      .then(() => undefined)
      .catch((err) => {
        tableEnsured = null; // retry on next call
        throw err;
      });
  }
  return tableEnsured;
}

/**
 * Opportunistic cleanup on job creation — a setTimeout-based schedule would
 * die with the process that scheduled it. Same rationale as report_jobs.
 */
async function sweepExpired(): Promise<void> {
  await db
    .execute(
      sql`
        DELETE FROM legacy_import_jobs
        WHERE finished_at IS NOT NULL
          AND finished_at < NOW() - INTERVAL '7 days'
      `,
    )
    .catch(() => undefined);
}

export function computeFileHash(buffer: Buffer | Uint8Array): string {
  return createHash("sha256").update(buffer).digest("hex").slice(0, 32);
}

type LegacyImportJobRow = {
  job_id: string;
  status: LegacyImportJobStatus;
  uploader_user_id: number | null;
  uploader_name: string | null;
  file_name: string | null;
  file_hash: string;
  total_uids: number;
  processed: number;
  not_found: number;
  error_count: number;
  summary: unknown;
  error_report_name: string | null;
  has_error_report: boolean;
  instance_id: string;
  started_at: Date | string;
  updated_at: Date | string;
  finished_at: Date | string | null;
};

function rowToJob(r: LegacyImportJobRow): LegacyImportJob {
  return {
    jobId: r.job_id,
    status: r.status,
    uploaderUserId: r.uploader_user_id,
    uploaderName: r.uploader_name,
    fileName: r.file_name,
    fileHash: r.file_hash,
    totalUids: Number(r.total_uids ?? 0),
    processed: Number(r.processed ?? 0),
    notFound: Number(r.not_found ?? 0),
    errorCount: Number(r.error_count ?? 0),
    summary: r.summary ?? null,
    errorReportName: r.error_report_name,
    hasErrorReport: Boolean(r.has_error_report),
    instanceId: r.instance_id,
    startedAt: new Date(r.started_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
    finishedAt: r.finished_at ? new Date(r.finished_at).toISOString() : null,
  };
}

/** Thrown when a rival instance already inserted an active job for this file
 *  hash between our findActiveJobByFileHash check and INSERT. The controller
 *  catches this to return 409 with the winner's details, so two instances
 *  receiving the SAME file at the SAME moment never both spawn a run. */
export class LegacyImportJobDuplicateError extends Error {
  readonly winner: LegacyImportJob;
  constructor(winner: LegacyImportJob) {
    super("Another instance is already running this file hash");
    this.name = "LegacyImportJobDuplicateError";
    this.winner = winner;
  }
}

export async function createLegacyImportJob(input: {
  uploaderUserId: number | null;
  uploaderName: string | null;
  fileName: string | null;
  fileHash: string;
  totalUids: number;
}): Promise<LegacyImportJob> {
  await ensureTable();
  const jobId = randomUUID();
  try {
    await db.execute(sql`
      INSERT INTO legacy_import_jobs
        (job_id, status, uploader_user_id, uploader_name, file_name, file_hash,
         total_uids, instance_id)
      VALUES
        (${jobId}, 'queued', ${input.uploaderUserId}, ${input.uploaderName},
         ${input.fileName}, ${input.fileHash}, ${input.totalUids}, ${INSTANCE_ID})
    `);
  } catch (err) {
    // 23505 = unique_violation. The partial UNIQUE index on file_hash catches
    // the case where a rival instance inserted an active row between our
    // pre-check and INSERT. Return the winner so the controller can 409.
    const pgCode = (err as { code?: string } | null)?.code;
    if (pgCode === "23505") {
      const winner = await findActiveJobByFileHash(input.fileHash);
      if (winner) throw new LegacyImportJobDuplicateError(winner);
    }
    throw err;
  }
  void sweepExpired();
  const job = await getLegacyImportJob(jobId);
  if (!job)
    throw new Error("createLegacyImportJob: row not found after insert");
  return job;
}

export async function markLegacyImportJobRunning(jobId: string): Promise<void> {
  await db
    .execute(
      sql`
        UPDATE legacy_import_jobs
        SET status = 'running', updated_at = NOW(), instance_id = ${INSTANCE_ID}
        WHERE job_id = ${jobId}
      `,
    )
    .catch(() => undefined);
}

export async function setLegacyImportJobTotal(
  jobId: string,
  totalUids: number,
): Promise<void> {
  await db
    .execute(
      sql`
        UPDATE legacy_import_jobs
        SET total_uids = ${totalUids}, updated_at = NOW()
        WHERE job_id = ${jobId}
      `,
    )
    .catch(() => undefined);
}

export async function updateLegacyImportJobProgress(
  jobId: string,
  p: { processed: number; notFound: number; errorCount: number },
): Promise<void> {
  await db
    .execute(
      sql`
        UPDATE legacy_import_jobs
        SET processed = ${p.processed},
            not_found = ${p.notFound},
            error_count = ${p.errorCount},
            updated_at = NOW()
        WHERE job_id = ${jobId}
      `,
    )
    .catch(() => undefined);
}

export async function completeLegacyImportJob(
  jobId: string,
  summary: unknown,
  errorReport: { name: string; bytes: Buffer } | null,
): Promise<void> {
  const summaryJson = JSON.stringify(summary ?? null);
  await db.execute(sql`
    UPDATE legacy_import_jobs
    SET status             = 'completed',
        summary            = ${summaryJson}::jsonb,
        error_report_name  = ${errorReport?.name ?? null},
        error_report_bytes = ${errorReport?.bytes ?? null},
        updated_at         = NOW(),
        finished_at        = NOW()
    WHERE job_id = ${jobId}
  `);
}

export async function failLegacyImportJob(
  jobId: string,
  message: string,
): Promise<void> {
  const summaryJson = JSON.stringify({ error: message });
  await db
    .execute(
      sql`
        UPDATE legacy_import_jobs
        SET status      = 'failed',
            summary     = ${summaryJson}::jsonb,
            updated_at  = NOW(),
            finished_at = NOW()
        WHERE job_id = ${jobId}
      `,
    )
    .catch(() => undefined);
}

export async function getLegacyImportJob(
  jobId: string,
): Promise<LegacyImportJob | null> {
  await ensureTable();
  const res = await db.execute(sql`
    SELECT job_id, status, uploader_user_id, uploader_name, file_name, file_hash,
           total_uids, processed, not_found, error_count, summary,
           error_report_name, (error_report_bytes IS NOT NULL) AS has_error_report,
           instance_id, started_at, updated_at, finished_at
    FROM legacy_import_jobs
    WHERE job_id = ${jobId}
  `);
  const row = res.rows[0] as LegacyImportJobRow | undefined;
  return row ? rowToJob(row) : null;
}

export async function getLegacyImportJobFile(
  jobId: string,
): Promise<{ name: string | null; bytes: Buffer } | null> {
  await ensureTable();
  const res = await db.execute(sql`
    SELECT error_report_name, error_report_bytes
    FROM legacy_import_jobs
    WHERE job_id = ${jobId}
  `);
  const row = res.rows[0] as
    | {
        error_report_name: string | null;
        error_report_bytes: Buffer | Uint8Array | null;
      }
    | undefined;
  if (!row?.error_report_bytes) return null;
  const bytes =
    row.error_report_bytes instanceof Buffer
      ? row.error_report_bytes
      : Buffer.from(row.error_report_bytes as Uint8Array);
  return { name: row.error_report_name, bytes };
}

/**
 * Any job in `queued` / `running` for the same file — used by the controller
 * to reject a double-submit / accidental double-click on the Import button
 * with a 409 (multi-instance safe because the row is in Postgres).
 */
export async function findActiveJobByFileHash(
  fileHash: string,
): Promise<LegacyImportJob | null> {
  await ensureTable();
  const res = await db.execute(sql`
    SELECT job_id, status, uploader_user_id, uploader_name, file_name, file_hash,
           total_uids, processed, not_found, error_count, summary,
           error_report_name, (error_report_bytes IS NOT NULL) AS has_error_report,
           instance_id, started_at, updated_at, finished_at
    FROM legacy_import_jobs
    WHERE file_hash = ${fileHash}
      AND status IN ('queued','running')
    ORDER BY started_at DESC
    LIMIT 1
  `);
  const row = res.rows[0] as LegacyImportJobRow | undefined;
  return row ? rowToJob(row) : null;
}

/**
 * Boot-time reconcile — TIME-BASED, instance-agnostic. Marks any job stuck
 * in `queued`/`running` with a stale `updated_at` as `failed`.
 *
 * Why time-based, not instance-scoped: `instance_id` is `hostname-pid`, so a
 * PM2 restart on the same host gets a new PID and would ORPHAN the previous
 * run's rows forever (the new PID wouldn't recognize them). A time cutoff
 * heals across PM2 restarts, EC2 host recycles, and hostname changes.
 *
 * Safe under a rolling deploy: `persistProgress` in the orchestrator bumps
 * `updated_at` every ~1s during a run, so an actively-running peer's row is
 * NEVER older than a few seconds — the cutoff cannot mark a live job dead.
 *
 * The 15-minute cutoff is well above the slowest observed single-instance
 * import; anything older than that IS dead (crashed process, hung DB, network
 * partition) and needs a terminal state so the UI's status poll can render.
 */
export async function reconcileStaleLegacyImportJobs(): Promise<{
  reconciled: number;
}> {
  await ensureTable();
  const summaryJson = JSON.stringify({
    error:
      "job appeared abandoned (no progress updates for 15+ minutes) — reconciled at backend boot",
  });
  const res = await db.execute(sql`
    UPDATE legacy_import_jobs
    SET status      = 'failed',
        summary     = ${summaryJson}::jsonb,
        updated_at  = NOW(),
        finished_at = NOW()
    WHERE status IN ('queued','running')
      AND updated_at < NOW() - INTERVAL '15 minutes'
    RETURNING job_id
  `);
  return { reconciled: res.rows.length };
}

export function downloadPathForJob(jobId: string): string {
  return `/api/students/import-legacy-students/error-report/${jobId}`;
}
