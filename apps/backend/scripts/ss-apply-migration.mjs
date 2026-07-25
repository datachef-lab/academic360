import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(
  "/Users/harsh/Developer/tech-sahyogi-innoventures/academic360/apps/backend/",
);
const { Pool } = require("pg");
const env = fs.readFileSync(
  "/Users/harsh/Developer/tech-sahyogi-innoventures/academic360/apps/backend/.env",
  "utf8",
);
const url = (env.match(/^DATABASE_URL=(.+)$/m) || [])[1]
  ?.trim()
  .replace(/^["']|["']$/g, "");
const sql = fs.readFileSync(
  "/Users/harsh/Developer/tech-sahyogi-innoventures/academic360/apps/backend/drizzle/0169_furry_ultron.sql",
  "utf8",
);
const pool = new Pool({ connectionString: url });
for (const stmt of sql
  .split("--> statement-breakpoint")
  .map((s) => s.trim())
  .filter(Boolean)) {
  try {
    await pool.query(stmt);
    console.log("  ok  " + stmt.split("\n")[0].slice(0, 72));
  } catch (e) {
    console.log(
      (/already exists|duplicate/i.test(e.message) ? "  skip" : "  FAIL") +
        " " +
        stmt.split("\n")[0].slice(0, 60) +
        " :: " +
        e.message.slice(0, 70),
    );
  }
}
await pool.end();
