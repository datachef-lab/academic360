// Tiny "did this boot-migration ever run to completion" tracker, backed by a
// self-created table so no separate Drizzle migration is needed.
//
// Purpose: guard heals whose second run could destroy legitimate later edits.
// The subject-selection heals are state-based (a wrong row IS wrong; nothing
// else legitimately looks like it) so they don't need a marker. The fees
// amount heal is NOT — a mapping whose amount differs from IRP could be a
// legitimate admin correction, not the initial loader bug. So it must run
// exactly once by default, with an explicit override for re-runs.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";

type MarkerRow = { name: string; ran_at: Date; details: unknown };

async function ensureTable(): Promise<void> {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS system_boot_migrations (
       name TEXT PRIMARY KEY,
       ran_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       details JSONB
     )`,
  );
}

export async function getBootMigrationMarker(
  name: string,
): Promise<MarkerRow | null> {
  await ensureTable();
  const res = await db.execute(
    `SELECT name, ran_at, details FROM system_boot_migrations WHERE name = '${name.replace(/'/g, "''")}'`,
  );
  const row = ((res as any).rows ?? (res as any))[0];
  if (!row) return null;
  return {
    name: row.name,
    ran_at: new Date(row.ran_at),
    details: row.details,
  };
}

export async function setBootMigrationMarker(
  name: string,
  details: unknown = null,
): Promise<void> {
  await ensureTable();
  const safeName = name.replace(/'/g, "''");
  const safeDetails = JSON.stringify(details ?? null).replace(/'/g, "''");
  await db.execute(
    `INSERT INTO system_boot_migrations (name, ran_at, details)
     VALUES ('${safeName}', NOW(), '${safeDetails}'::jsonb)
     ON CONFLICT (name) DO UPDATE
       SET ran_at = NOW(),
           details = EXCLUDED.details`,
  );
}
