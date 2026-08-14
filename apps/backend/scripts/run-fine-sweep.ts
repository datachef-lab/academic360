/**
 * Manually runs one library fine-accrual sweep (the same function the nightly
 * scheduler calls) and prints the result. Safe to run any number of times —
 * the sweep recomputes absolutely, it never increments.
 *
 * Run with: pnpm --filter backend sweep:library-fines
 */

import "dotenv/config";
import { pool } from "../src/db/index.js";
import { runFineAccrualSweep } from "../src/features/library/schedulers/library-fine-accrual.scheduler.js";

runFineAccrualSweep()
  .then((result) => {
    console.log("Fine accrual sweep result:", result);
  })
  .catch((err) => {
    console.error("Sweep failed:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    void pool.end();
    setTimeout(() => process.exit(process.exitCode ?? 0), 500).unref();
  });
