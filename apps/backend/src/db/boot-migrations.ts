// Boot-time data migrations orchestrator.
//
// Called from connectToDatabase() after the pool is ready. State-based (no
// marker table): each migration inspects the DB, no-ops if there's nothing
// to do, and heals what's there. Fire-and-forget so slow migrations don't
// block boot.
//
// Add new one-shot heals to `MIGRATIONS` below — each entry is a plain async
// function that returns a summary object; the runner logs it. Migrations run
// in order; a failure logs and continues (individual migrations own their own
// transactional guarantees).
//
// Env kill-switch: set BACKEND_BOOT_MIGRATIONS=off to skip everything.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "@/db/index.js";
import { createLogger } from "@/config/logger.js";
import { runRegistrationYearDriftMigration } from "@/features/subject-selection/services/registration-year-drift-migration.service.js";
import { runCuAdmitCardSemVSemVILoader } from "@/features/subject-selection/services/cu-admitcard-loader.service.js";
import { runStreamMismatchHeal } from "@/features/subject-selection/services/stream-mismatch-heal.service.js";
import { runLegacyFeesAmountHeal } from "@/features/fees/services/legacy-fees-amount-heal.service.js";
import {
  loadDefaultDocuments,
  loadDocumentTypesV2,
} from "@/features/academics/services/document.service.js";
import { runIdCardLedgerBackfill } from "@/features/documents/services/idcard-ledger-backfill.service.js";
import { runCuRegUploadLedgerBackfill } from "@/features/documents/services/cureg-upload-ledger-backfill.service.js";
import { runTempAdmitCardLedgerBackfill } from "@/features/documents/services/temp-admit-card-ledger-backfill.service.js";
import { runCuRegMissingUploadsBackfill } from "@/features/documents/services/cureg-missing-uploads-backfill.service.js";
import { runCuRegPdfLedgerBackfill } from "@/features/documents/services/cureg-pdf-ledger-backfill.service.js";
import { runLedgerTimestampHeal } from "@/features/documents/services/ledger-timestamp-heal.service.js";
import { runLibraryLegacyLoad } from "@/features/library/services/library-legacy-load.service.js";
import { runLibraryMastersSeed } from "@/features/library/services/library-masters-seed.service.js";
import { reconcileStaleLegacyImportJobs } from "@/features/user/services/legacy-import-jobs.service.js";

const log = createLogger("boot-migrations");

type Migration = {
  name: string;
  run: () => Promise<Record<string, unknown>>;
};

/**
 * Walk upward from this file's directory looking for a shipped-data file
 * (e.g. apps/backend/data/imports/foo.xlsx). Necessary because in dev
 * `import.meta.url` points into `apps/backend/src/db/…` (parent-of-parent
 * === `apps/backend`, data/ resolves), but in production the file lives at
 * `apps/backend/dist/apps/backend/src/db/…` — parent-of-parent points into
 * dist, which doesn't ship non-JS assets. The upward walk lands on the
 * source-tree `apps/backend/` in both layouts.
 */
function findRepoDataFile(relative: string): string | null {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 12; depth++) {
    const candidate = path.join(dir, relative);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const MIGRATIONS: Migration[] = [
  {
    // Heals historical rows where the meta_id points at the current-semester AY
    // instead of the student's registration AY. Second boot => 0 rows.
    name: "registration-year-drift-heal",
    run: async () => runRegistrationYearDriftMigration({ commit: true }),
  },
  {
    // Idempotent Sem V/VI Minor 3/4 backfill from the CU admit-card Excel.
    // Skips any (student, meta) pair that already has a row in ANY state.
    name: "cu-admitcard-2023-sem-v-vi",
    run: async () => {
      const excelPath = findRepoDataFile(
        path.join("data", "imports", "cu_admitcard_2023.xlsx"),
      );
      if (!excelPath) {
        return {
          skipped: true,
          reason:
            "Excel not found on disk — walk from import.meta.url did not locate apps/backend/data/imports/cu_admitcard_2023.xlsx. Confirm the file is committed and the deploy tree includes it.",
        };
      }
      const reportDir = path.join(path.dirname(excelPath), "reports");
      return runCuAdmitCardSemVSemVILoader({
        filePath: excelPath,
        commit: true,
        reportDir,
      });
    },
  },
  {
    // Rewires student_subject_selections filed under a meta whose stream-set
    // excludes the student's stream (legacy loader resolved metas without a
    // stream check — Commerce students' Minor picks landed on the
    // Arts/Sci/Mgmt meta). State-based: second boot => 0 rows. Runs AFTER the
    // registration-year drift heal so AY is already correct when stream is
    // checked.
    name: "stream-mismatch-heal",
    run: async () => runStreamMismatchHeal({ commit: true }),
  },
  {
    // Legacy fee-slab heal — re-points fee_student_mappings at the concession
    // slab IRP actually granted (resolved from studentfeesconcessiontab,
    // section-less, including students IRP has not billed yet) and reconciles
    // total_payable / payments.amount, for every mapping outside the 2025-26 /
    // 2026-27 Sem I fresh-admit scope. Idempotent: a matching mapping is
    // skipped, and an admin's MANUAL edit is never reverted. See
    // legacy-fees-amount-heal.service.ts for the exact rule.
    //
    // Multi-instance: a fleet-wide restart boots every instance at once. Take a
    // session-scoped advisory lock so exactly ONE instance runs the (full,
    // legacy-DB-scanning) heal; the rest skip. The winner writes the marker, so
    // once it completes no instance re-runs it on a later restart.
    name: "legacy-fees-slab-heal",
    run: async () => {
      const HEAL_LOCK_KEY = 918360007;
      const lockClient = await pool.connect();
      try {
        const { rows } = await lockClient.query<{ locked: boolean }>(
          "SELECT pg_try_advisory_lock($1) AS locked",
          [HEAL_LOCK_KEY],
        );
        if (rows[0]?.locked !== true) {
          return { skipped: "another instance holds the fee-slab heal lock" };
        }
        try {
          return await runLegacyFeesAmountHeal({
            commit: true,
            sampleLimit: 20,
          });
        } finally {
          await lockClient.query("SELECT pg_advisory_unlock($1)", [
            HEAL_LOCK_KEY,
          ]);
        }
      } finally {
        lockClient.release();
      }
    },
  },
  {
    // Seeds document_types and back-fills the classification columns on the
    // six upload rows that predate the documents module. Marker-guarded, so
    // unlike the state-based migrations above it runs on exactly one boot —
    // a type an admin later renames, edits or deletes must stay that way.
    name: "document-types-seed",
    run: async () => loadDefaultDocuments(),
  },
  {
    // Second document-types step: the three university-issued types
    // (marksheet / degree / registration certificate) and the "Exam Admit Card"
    // -> "University Admit Card" rename. Separate marker because the seed above
    // has already run everywhere and returns on its own marker before it ever
    // reads the list. Matches on `code`, so an admin-renamed row is still found,
    // and the rename only touches a name still reading the original.
    name: "document-types-seed-v2",
    run: async () => loadDocumentTypesV2(),
  },
  {
    // Gives every existing ID card issue its document_ledger entry. Runs after
    // the seed above, which is what creates the ID_CARD document type. State-based
    // (the work item is "issues with a NULL ledger FK"), so a second boot does
    // nothing and it self-heals as the legacy sync adds rows.
    name: "idcard-ledger-backfill",
    run: async () => runIdCardLedgerBackfill(),
  },
  {
    // Same treatment for the documents students upload during CU registration.
    // State-based for the same reason: the rows are derived from
    // cu_registration_document_uploads, so re-deriving them is always correct.
    name: "cureg-upload-ledger-backfill",
    run: async () => runCuRegUploadLedgerBackfill(),
  },
  {
    // Projects `temp_admit_card_distributions` into `document_batch_receipts` +
    // `document_ledger` — the exam admit card flow was the last of the five
    // documents (per decisions/models/documents.md) still keeping its own
    // private record. State-based via a new document_ledger_id_fk back-link
    // column on temp; live writes on either side keep both tables in step.
    name: "temp-admit-card-ledger-backfill",
    run: async () => runTempAdmitCardLedgerBackfill(),
  },
  {
    // Adds PENDING document_ledger rows for CU-registration uploads a student
    // was REQUIRED to submit but hasn't — so the passbook shows the omission
    // instead of a silent gap. Real uploads (already handled by
    // cureg-upload-ledger-backfill) block a duplicate PENDING insert via a
    // NOT EXISTS on (promotion, docType, isSelfSourced=true, batch IS NULL).
    // Scoped to the two most recent academic years to keep mutable-field
    // evaluation (EWS status, family membership) point-in-time-honest.
    name: "cureg-missing-uploads-backfill",
    run: async () => runCuRegMissingUploadsBackfill(),
  },
  {
    // Backfills CU_REGISTRATION_PDF upload + ledger rows for correction
    // requests that reached ONLINE_REGISTRATION_DONE BEFORE the
    // `recordGeneratedCuRegPdf` helper shipped. Those PDFs were generated,
    // uploaded to S3 and emailed to students, but were never written to
    // cu_registration_document_uploads (so cureg-upload-ledger-backfill
    // above had nothing to project). Reconstructs the canonical S3 URL
    // from the deterministic path helper — no re-upload. State-based:
    // skips any request whose upload row is already present.
    name: "cureg-pdf-ledger-backfill",
    run: async () => runCuRegPdfLedgerBackfill(),
  },
  {
    // Reconciles document_ledger.created_at / collected_at with the source
    // table's back-link timestamps. Earlier versions of the three backfills
    // above wrote NOW() at insert-time; the document_ledger_id_fk back-link
    // then blocked a re-write. This heal is state-based (only UPDATEs rows
    // where the two timestamps still diverge), so a second boot after
    // everything reconciles is a zero-row no-op. Also pulls synthetic
    // "University Admit Card Distribution" batches back to their earliest
    // child ledger row's clock.
    name: "ledger-timestamp-heal",
    run: async () => runLedgerTimestampHeal(),
  },
  {
    // Seeds the library masters — branch, patron & item categories, zones,
    // circulation policies — on a fresh database, once. Marker-guarded,
    // advisory-locked, and matches on `code` so staff edits are never
    // clobbered. MUST stay ahead of library-legacy-load: the runner awaits
    // each entry, and the load is a multi-hour walk that would otherwise
    // starve this fast seed (and the dashboard's seed banner) until it ends.
    name: "library-masters-seed",
    run: async () => runLibraryMastersSeed(),
  },
  {
    // Time-based reconcile of stale legacy-import jobs. Any row still marked
    // queued/running whose updated_at is older than 15 min is dead (a healthy
    // job's persistProgress bumps updated_at every ~1s). Safe under a rolling
    // deploy — an actively-running peer's row is never stale, so this cannot
    // kill a live job. See legacy-import-jobs.service.ts for the query.
    name: "legacy-import-boot-reconcile",
    run: async () => reconcileStaleLegacyImportJobs(),
  },
  {
    // Loads the library data from IRP. Unlike everything above it is a long
    // walk (~200k legacy rows), so it takes its OWN advisory lock: the
    // resolvers are find-or-create, which makes a sequential re-run safe but
    // not two instances running at once, and no legacy id column carries a
    // unique constraint to catch the collision. Marker-guarded once it
    // completes; LIBRARY_LEGACY_LOAD=off disables it.
    name: "library-legacy-load",
    run: async () => runLibraryLegacyLoad(),
  },
];

/**
 * Advisory-lock key for the whole boot-migration run.
 *
 * Production runs MULTIPLE backend instances, and every one of them calls this
 * on startup. Without a lock they interleave: two instances both see the same
 * "work item" (a NULL FK, a missing marker), both act on it, and the loser's
 * write is duplicated or orphaned. That is not theoretical — it produced 2,412
 * orphaned document_ledger rows on dev when a manual backfill overlapped a boot.
 *
 * `pg_try_advisory_lock` returns immediately rather than queueing: the instance
 * that wins runs the migrations, the others skip and move on with their startup.
 * Nothing is lost — every migration here is state-based or marker-guarded, so
 * whatever the winner does not finish is picked up on the next boot.
 *
 * The lock is session-scoped, so it is released automatically if an instance
 * crashes mid-run. Arbitrary but fixed constant; do not reuse it elsewhere.
 */
const BOOT_MIGRATION_ADVISORY_LOCK_KEY = 918360001;

export async function runBootMigrations(): Promise<void> {
  if ((process.env.BACKEND_BOOT_MIGRATIONS ?? "").toLowerCase() === "off") {
    log.info("BACKEND_BOOT_MIGRATIONS=off — skipping boot migrations");
    return;
  }

  // Held on a dedicated connection for the whole run — advisory locks belong to
  // a session, so it must be the same client that unlocks.
  const lockClient = await pool.connect();
  let holdsLock = false;
  try {
    const res = await lockClient.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock($1) AS locked",
      [BOOT_MIGRATION_ADVISORY_LOCK_KEY],
    );
    holdsLock = res.rows[0]?.locked === true;

    if (!holdsLock) {
      log.info(
        "another instance is running boot migrations — skipping (they are state-based; the next boot picks up anything unfinished)",
      );
      return;
    }

    await runMigrationList();
  } finally {
    if (holdsLock) {
      await lockClient
        .query("SELECT pg_advisory_unlock($1)", [
          BOOT_MIGRATION_ADVISORY_LOCK_KEY,
        ])
        .catch((err) =>
          log.warn(
            `failed to release the boot-migration advisory lock: ${err instanceof Error ? err.message : String(err)}`,
          ),
        );
    }
    lockClient.release();
  }
}

async function runMigrationList(): Promise<void> {
  for (const m of MIGRATIONS) {
    const started = Date.now();
    try {
      const result = await m.run();
      const ms = Date.now() - started;
      log.info(`[${m.name}] done in ${ms}ms`, result);
    } catch (err) {
      const ms = Date.now() - started;
      // Serialize the actual error so the pm2 log carries the message +
      // stack. The old { error: err } shape stringified to "[object Object]"
      // which made the ENOENT this fix addresses invisible.
      const errMsg = err instanceof Error ? err.message : String(err);
      const errStack = err instanceof Error ? err.stack : undefined;
      log.warn(
        `[${m.name}] failed after ${ms}ms — continuing boot: ${errMsg}`,
        { stack: errStack },
      );
    }
  }
}
