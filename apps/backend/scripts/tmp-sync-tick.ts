import "dotenv/config";
import { pool } from "../src/db/index.js";
import { runLibrarySyncTick } from "../src/features/library/services/library-legacy-sync.service.js";

runLibrarySyncTick()
  .then((r) => console.log("TICK RESULT:", JSON.stringify(r)))
  .catch((e) => { console.error("TICK FAILED:", e?.message ?? e); process.exitCode = 1; })
  .finally(() => { void pool.end(); setTimeout(() => process.exit(process.exitCode ?? 0), 1000).unref(); });
