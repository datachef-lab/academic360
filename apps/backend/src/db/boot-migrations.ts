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
import path from "path";
import { createLogger } from "@/config/logger.js";
import { runRegistrationYearDriftMigration } from "@/features/subject-selection/services/registration-year-drift-migration.service.js";
import { runCuAdmitCardSemVSemVILoader } from "@/features/subject-selection/services/cu-admitcard-loader.service.js";

const log = createLogger("boot-migrations");

type Migration = {
  name: string;
  run: () => Promise<Record<string, unknown>>;
};

// Anchor imports relative to the compiled backend directory; in dev tsx runs
// from source but the relative shape is the same.
const REPO_BACKEND = path.resolve(
  new URL(".", import.meta.url).pathname,
  "..",
  "..",
);
const CU_ADMITCARD_XLSX = path.join(
  REPO_BACKEND,
  "data",
  "imports",
  "cu_admitcard_2023.xlsx",
);
const CU_ADMITCARD_REPORT_DIR = path.join(
  REPO_BACKEND,
  "data",
  "imports",
  "reports",
);

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
    run: async () =>
      runCuAdmitCardSemVSemVILoader({
        filePath: CU_ADMITCARD_XLSX,
        commit: true,
        reportDir: CU_ADMITCARD_REPORT_DIR,
      }),
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
      log.warn(`[${m.name}] failed after ${ms}ms — continuing boot`, {
        error: err,
      });
    }
  }
}
