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
import { createLogger } from "@/config/logger.js";
import { pool } from "@/db/index.js";
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
    // Legacy fee-amount heal — reconciles fee_student_mappings /
    // payments.amount against IRP's `Installment Total Amount To Pay`
    // for every mapping outside the 2025-26 / 2026-27 Sem I fresh-admit
    // scope. Idempotent: a mapping already matching IRP is skipped.
    // See legacy-fees-amount-heal.service.ts for the exact rule.
    name: "legacy-fees-amount-heal",
    run: async () => runLegacyFeesAmountHeal({ commit: true, sampleLimit: 20 }),
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
