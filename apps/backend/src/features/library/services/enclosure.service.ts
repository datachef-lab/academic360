import { db } from "@/db/index.js";
import { Enclosure, enclosureModel } from "@repo/db/schemas";
import { and, count, desc, eq, ilike, ne } from "drizzle-orm";

type EnclosureListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type EnclosureListResult = {
  rows: Enclosure[];
  total: number;
  page: number;
  limit: number;
};

export async function findEnclosureById(id: number): Promise<Enclosure | null> {
  const [enclosure] = await db
    .select()
    .from(enclosureModel)
    .where(eq(enclosureModel.id, id));

  return enclosure ?? null;
}

export async function findEnclosureByName(
  name: string,
  excludeId?: number,
): Promise<Enclosure | null> {
  const whereClause =
    excludeId !== undefined
      ? and(
          ilike(enclosureModel.name, name.trim()),
          ne(enclosureModel.id, excludeId),
        )
      : ilike(enclosureModel.name, name.trim());

  const [enclosure] = await db.select().from(enclosureModel).where(whereClause);
  return enclosure ?? null;
}

export async function findEnclosuresPaginated(
  filters: EnclosureListFilters,
): Promise<EnclosureListResult> {
  const { page, limit, search } = filters;
  const offset = (page - 1) * limit;
  const whereClause =
    search && search.trim()
      ? ilike(enclosureModel.name, `%${search.trim()}%`)
      : undefined;

  const rows = await db
    .select()
    .from(enclosureModel)
    .where(whereClause)
    .orderBy(desc(enclosureModel.id))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(enclosureModel)
    .where(whereClause);

  return {
    rows,
    total,
    page,
    limit,
  };
}

export async function createEnclosure(
  data: Omit<Enclosure, "id">,
): Promise<Enclosure> {
  const [created] = await db.insert(enclosureModel).values(data).returning();
  return created;
}

export async function updateEnclosure(
  id: number,
  data: Partial<Omit<Enclosure, "id">>,
): Promise<Enclosure | null> {
  const [updated] = await db
    .update(enclosureModel)
    .set(data)
    .where(eq(enclosureModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteEnclosure(id: number): Promise<Enclosure | null> {
  const [deleted] = await db
    .delete(enclosureModel)
    .where(eq(enclosureModel.id, id))
    .returning();

  return deleted ?? null;
}
