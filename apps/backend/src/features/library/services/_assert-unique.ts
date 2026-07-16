import { and, ne, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";

/**
 * Throws 409 if another row with the same trimmed, lower-cased value already
 * exists in `nameColumn`. Used by all library master services to make sure
 * users can't create two "STAFF" / "JOURNAL" / etc. records.
 */
export async function assertUniqueLibraryName(args: {
  table: PgTable;
  nameColumn: AnyPgColumn;
  idColumn: AnyPgColumn;
  value: string;
  label: string;
  excludeId?: number | null;
}): Promise<void> {
  const trimmed = args.value.trim();
  if (!trimmed) return;
  const conditions: SQL[] = [
    sql`lower(trim(${args.nameColumn})) = ${trimmed.toLowerCase()}`,
  ];
  if (args.excludeId != null) {
    conditions.push(ne(args.idColumn, args.excludeId));
  }
  const [hit] = await db
    .select({ id: args.idColumn })
    .from(args.table)
    .where(conditions.length === 1 ? conditions[0] : and(...conditions))
    .limit(1);
  if (hit) {
    throw new ApiError(409, `${args.label} "${trimmed}" already exists.`);
  }
}

/**
 * Throws 409 if another row matches the given compound key. The `key`
 * conditions are combined with AND; pass an `excludeId` to allow re-saving the
 * same record. Used for masters like circulation-policy where uniqueness is on
 * a tuple, not a single name.
 */
export async function assertUniqueCompound(args: {
  table: PgTable;
  idColumn: AnyPgColumn;
  key: SQL[];
  label: string;
  excludeId?: number | null;
}): Promise<void> {
  const conditions: SQL[] = [...args.key];
  if (args.excludeId != null) {
    conditions.push(ne(args.idColumn, args.excludeId));
  }
  const [hit] = await db
    .select({ id: args.idColumn })
    .from(args.table)
    .where(conditions.length === 1 ? conditions[0] : and(...conditions))
    .limit(1);
  if (hit) {
    throw new ApiError(409, `${args.label} already exists.`);
  }
}
