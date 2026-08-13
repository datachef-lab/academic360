// Post-migrate guard against drizzle-kit's silent-skip (ADR 0028).
//
// `drizzle-kit migrate` tracks ONE high-water timestamp (the max created_at in
// drizzle.__drizzle_migrations) and applies only journal entries whose `when`
// is greater. Restoring a DB from a prod backup moves that mark past entries
// prod never had (prod's journal re-scheduled 0179/0185 with future
// timestamps), so migrate then reports success while skipping them forever.
//
// This script runs right after `drizzle-kit migrate` in CD. For every journal
// entry with idx >= FLOOR_IDX it checks that a tracking row with created_at ==
// entry.when exists; any missing entry is applied in a transaction and
// recorded. An "already exists" failure (duplicate table/column/object) means
// the entry's changes reached this DB under a different timestamp (renumbered
// or re-scheduled history) — it is recorded as applied and logged. Any other
// failure exits 1 and fails the deploy: a silent skip must never look green.
//
// Usage: DATABASE_URL=... node scripts/verify-migrations.cjs
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Client } = require("pg");

// Entries below this idx predate per-entry tracking; their changes are part of
// every prod backup already. Everything from the documents module (0187) on is
// verified individually.
const FLOOR_IDX = 187;

// Postgres codes meaning "this change is already there".
const ALREADY_THERE = new Set([
  "42P07", // duplicate_table (also raised for indexes/constraints' relations)
  "42701", // duplicate_column
  "42710", // duplicate_object
  "42P06", // duplicate_schema
  "42723", // duplicate_function
]);

(async () => {
  const drizzleDir = path.join(__dirname, "..", "drizzle");
  const journal = JSON.parse(
    fs.readFileSync(path.join(drizzleDir, "meta", "_journal.json"), "utf8"),
  );
  const tracked = journal.entries.filter((e) => e.idx >= FLOOR_IDX);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { rows } = await client.query(
    "SELECT created_at FROM drizzle.__drizzle_migrations",
  );
  const applied = new Set(rows.map((r) => String(r.created_at)));
  const missing = tracked.filter((e) => !applied.has(String(e.when)));

  if (missing.length === 0) {
    console.log(
      `[verify-migrations] OK — all ${tracked.length} tracked entries (idx >= ${FLOOR_IDX}) are recorded in __drizzle_migrations.`,
    );
    await client.end();
    return;
  }

  console.log(
    `[verify-migrations] ${missing.length} tracked entr${missing.length === 1 ? "y is" : "ies are"} NOT recorded — drizzle-kit silently skipped them (high-water mark moved past their timestamps, typically after a prod-backup restore). Healing:`,
  );

  for (const entry of missing) {
    const sql = fs.readFileSync(
      path.join(drizzleDir, `${entry.tag}.sql`),
      "utf8",
    );
    const hash = crypto.createHash("sha256").update(sql).digest("hex");
    const record = () =>
      client.query(
        "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)",
        [hash, entry.when],
      );
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await record();
      await client.query("COMMIT");
      console.log(`  applied ${entry.tag}`);
    } catch (err) {
      await client.query("ROLLBACK");
      if (ALREADY_THERE.has(err.code)) {
        await record();
        console.log(
          `  ${entry.tag}: changes already present (${err.code}) — recorded as applied`,
        );
      } else {
        console.error(`  FAILED ${entry.tag}: ${err.message}`);
        process.exit(1);
      }
    }
  }

  await client.end();
  console.log("[verify-migrations] heal complete.");
})().catch((err) => {
  console.error(`[verify-migrations] ${err.message}`);
  process.exit(1);
});
