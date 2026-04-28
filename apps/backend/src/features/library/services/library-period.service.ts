import { db } from "@/db/index.js";
import { LibraryPeriod, libraryPeriodModel } from "@repo/db/schemas";
import { and, count, desc, eq, ilike, ne } from "drizzle-orm";

type LibraryPeriodListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type LibraryPeriodListResult = {
  rows: LibraryPeriod[];
  total: number;
  page: number;
  limit: number;
};

export async function findLibraryPeriodById(
  id: number,
): Promise<LibraryPeriod | null> {
  const [period] = await db
    .select()
    .from(libraryPeriodModel)
    .where(eq(libraryPeriodModel.id, id));

  return period ?? null;
}

export async function findLibraryPeriodByName(
  name: string,
  excludeId?: number,
): Promise<LibraryPeriod | null> {
  const whereClause =
    excludeId !== undefined
      ? and(
          ilike(libraryPeriodModel.name, name.trim()),
          ne(libraryPeriodModel.id, excludeId),
        )
      : ilike(libraryPeriodModel.name, name.trim());

  const [period] = await db
    .select()
    .from(libraryPeriodModel)
    .where(whereClause);
  return period ?? null;
}

export async function findLibraryPeriodsPaginated(
  filters: LibraryPeriodListFilters,
): Promise<LibraryPeriodListResult> {
  const { page, limit, search } = filters;
  const offset = (page - 1) * limit;
  const whereClause =
    search && search.trim()
      ? ilike(libraryPeriodModel.name, `%${search.trim()}%`)
      : undefined;

  const rows = await db
    .select()
    .from(libraryPeriodModel)
    .where(whereClause)
    .orderBy(desc(libraryPeriodModel.id))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(libraryPeriodModel)
    .where(whereClause);

  return {
    rows,
    total,
    page,
    limit,
  };
}

export async function createLibraryPeriod(
  data: Omit<LibraryPeriod, "id">,
): Promise<LibraryPeriod> {
  const [created] = await db
    .insert(libraryPeriodModel)
    .values(data)
    .returning();
  return created;
}

export async function updateLibraryPeriod(
  id: number,
  data: Partial<Omit<LibraryPeriod, "id">>,
): Promise<LibraryPeriod | null> {
  const [updated] = await db
    .update(libraryPeriodModel)
    .set(data)
    .where(eq(libraryPeriodModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteLibraryPeriod(
  id: number,
): Promise<LibraryPeriod | null> {
  const [deleted] = await db
    .delete(libraryPeriodModel)
    .where(eq(libraryPeriodModel.id, id))
    .returning();

  return deleted ?? null;
}
