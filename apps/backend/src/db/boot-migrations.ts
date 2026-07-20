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
import { runRegistrationYearDriftMigration } from "@/features/subject-selection/services/registration-year-drift-migration.service.js";
import { runCuAdmitCardSemVSemVILoader } from "@/features/subject-selection/services/cu-admitcard-loader.service.js";

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
