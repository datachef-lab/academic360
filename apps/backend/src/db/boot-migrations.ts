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
import { runLibraryLegacyLoad } from "@/features/library/services/library-legacy-load.service.js";
import { runLibraryMastersSeed } from "@/features/library/services/library-masters-seed.service.js";
import { runSubjectGroupMnHeal } from "@/features/subject-selection/services/subject-group-mn-heal.service.js";

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
    // Consolidates BCom (H)/(G) Minor 3 (Sem III-VI) subject-based
    // selections into single SUBJECT_GROUP rows for students whose
    // registration academic year is 2023-24 or 2024-25. Picks were
    // synced from the old DB as per-semester per-subject rows before
    // SUBJECT_GROUP existed (ADR 0027). Runs AFTER stream-mismatch-heal
    // so the meta assignment is already correct. State-based (skips
    // students who already have an active SUBJECT_GROUP row for the
    // same meta); ambiguous / no-match cases log and skip.
    name: "subject-group-mn-heal",
    run: async () => runSubjectGroupMnHeal(),
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

export async function runBootMigrations(): Promise<void> {
  if ((process.env.BACKEND_BOOT_MIGRATIONS ?? "").toLowerCase() === "off") {
    log.info("BACKEND_BOOT_MIGRATIONS=off — skipping boot migrations");
    return;
  }
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
