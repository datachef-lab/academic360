import { db } from "@/db/index.js";
import { EntryMode, entryModeModel } from "@repo/db/schemas";
import { and, count, desc, eq, ilike, ne } from "drizzle-orm";
import { assertUniqueLibraryName } from "@/features/library/services/_assert-unique.js";

type EntryModeListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type EntryModeListResult = {
  rows: EntryMode[];
  total: number;
  page: number;
  limit: number;
};

export async function findEntryModeById(id: number): Promise<EntryMode | null> {
  const [entryMode] = await db
    .select()
    .from(entryModeModel)
    .where(eq(entryModeModel.id, id));

  return entryMode ?? null;
}

export async function findEntryModeByName(
  name: string,
  excludeId?: number,
): Promise<EntryMode | null> {
  const whereClause =
    excludeId !== undefined
      ? and(
          ilike(entryModeModel.name, name.trim()),
          ne(entryModeModel.id, excludeId),
        )
      : ilike(entryModeModel.name, name.trim());

  const [entryMode] = await db.select().from(entryModeModel).where(whereClause);
  return entryMode ?? null;
}

export async function findEntryModesPaginated(
  filters: EntryModeListFilters,
): Promise<EntryModeListResult> {
  const { page, limit, search } = filters;
  const offset = (page - 1) * limit;
  const whereClause =
    search && search.trim()
      ? ilike(entryModeModel.name, `%${search.trim()}%`)
      : undefined;

  const rows = await db
    .select()
    .from(entryModeModel)
    .where(whereClause)
    .orderBy(desc(entryModeModel.id))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(entryModeModel)
    .where(whereClause);

  return {
    rows,
    total,
    page,
    limit,
  };
}

export async function createEntryMode(
  data: Omit<EntryMode, "id">,
): Promise<EntryMode> {
  await assertUniqueLibraryName({
    table: entryModeModel,
    nameColumn: entryModeModel.name,
    idColumn: entryModeModel.id,
    value: data.name,
    label: "Entry mode",
  });
  const [created] = await db.insert(entryModeModel).values(data).returning();
  return created;
}

export async function updateEntryMode(
  id: number,
  data: Partial<Omit<EntryMode, "id">>,
): Promise<EntryMode | null> {
  if (data.name != null) {
    await assertUniqueLibraryName({
      table: entryModeModel,
      nameColumn: entryModeModel.name,
      idColumn: entryModeModel.id,
      value: data.name,
      label: "Entry mode",
      excludeId: id,
    });
  }
  const [updated] = await db
    .update(entryModeModel)
    .set(data)
    .where(eq(entryModeModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteEntryMode(id: number): Promise<EntryMode | null> {
  const [deleted] = await db
    .delete(entryModeModel)
    .where(eq(entryModeModel.id, id))
    .returning();

  return deleted ?? null;
}
