import { db } from "@/db/index.js";
import { Series, seriesModel } from "@repo/db/schemas";
import { and, count, desc, eq, ilike, ne } from "drizzle-orm";

type SeriesListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type SeriesListResult = {
  rows: Series[];
  total: number;
  page: number;
  limit: number;
};

export async function findSeriesById(id: number): Promise<Series | null> {
  const [series] = await db
    .select()
    .from(seriesModel)
    .where(eq(seriesModel.id, id));
  return series ?? null;
}

export async function findSeriesByName(
  name: string,
  excludeId?: number,
): Promise<Series | null> {
  const whereClause =
    excludeId !== undefined
      ? and(ilike(seriesModel.name, name.trim()), ne(seriesModel.id, excludeId))
      : ilike(seriesModel.name, name.trim());

  const [series] = await db.select().from(seriesModel).where(whereClause);
  return series ?? null;
}

export async function findSeriesPaginated(
  filters: SeriesListFilters,
): Promise<SeriesListResult> {
  const { page, limit, search } = filters;
  const offset = (page - 1) * limit;
  const whereClause =
    search && search.trim()
      ? ilike(seriesModel.name, `%${search.trim()}%`)
      : undefined;

  const rows = await db
    .select()
    .from(seriesModel)
    .where(whereClause)
    .orderBy(desc(seriesModel.id))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(seriesModel)
    .where(whereClause);

  return { rows, total, page, limit };
}

export async function createSeries(data: Omit<Series, "id">): Promise<Series> {
  const [created] = await db.insert(seriesModel).values(data).returning();
  return created;
}

export async function updateSeries(
  id: number,
  data: Partial<Omit<Series, "id">>,
): Promise<Series | null> {
  const [updated] = await db
    .update(seriesModel)
    .set(data)
    .where(eq(seriesModel.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteSeries(id: number): Promise<Series | null> {
  const [deleted] = await db
    .delete(seriesModel)
    .where(eq(seriesModel.id, id))
    .returning();
  return deleted ?? null;
}
