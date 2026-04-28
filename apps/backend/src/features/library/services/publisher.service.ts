import { db } from "@/db/index.js";
import { PublisherDto } from "@repo/db/dtos/library";
import { Publisher, publisherModel } from "@repo/db/schemas";
import { and, count, desc, eq, ilike, ne } from "drizzle-orm";

type PublisherListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type PublisherListResult = {
  rows: PublisherDto[];
  total: number;
  page: number;
  limit: number;
};

const modelToDto = (model: Publisher): PublisherDto => ({
  ...model,
  address: null,
});

export async function findPublisherById(
  id: number,
): Promise<PublisherDto | null> {
  const [publisher] = await db
    .select()
    .from(publisherModel)
    .where(eq(publisherModel.id, id));

  return publisher ? modelToDto(publisher) : null;
}

export async function findPublisherByName(
  name: string,
  excludeId?: number,
): Promise<Publisher | null> {
  const whereClause =
    excludeId !== undefined
      ? and(
          ilike(publisherModel.name, name.trim()),
          ne(publisherModel.id, excludeId),
        )
      : ilike(publisherModel.name, name.trim());

  const [publisher] = await db.select().from(publisherModel).where(whereClause);
  return publisher ?? null;
}

export async function findPublishersPaginated(
  filters: PublisherListFilters,
): Promise<PublisherListResult> {
  const { page, limit, search } = filters;
  const offset = (page - 1) * limit;
  const whereClause =
    search && search.trim()
      ? ilike(publisherModel.name, `%${search.trim()}%`)
      : undefined;

  const rows = await db
    .select()
    .from(publisherModel)
    .where(whereClause)
    .orderBy(desc(publisherModel.id))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(publisherModel)
    .where(whereClause);

  return {
    rows: rows.map(modelToDto),
    total,
    page,
    limit,
  };
}

export async function createPublisher(
  data: Omit<Publisher, "id">,
): Promise<PublisherDto> {
  const [created] = await db.insert(publisherModel).values(data).returning();
  return modelToDto(created);
}

export async function updatePublisher(
  id: number,
  data: Partial<Omit<Publisher, "id">>,
): Promise<PublisherDto | null> {
  const [updated] = await db
    .update(publisherModel)
    .set(data)
    .where(eq(publisherModel.id, id))
    .returning();

  return updated ? modelToDto(updated) : null;
}

export async function deletePublisher(
  id: number,
): Promise<PublisherDto | null> {
  const [deleted] = await db
    .delete(publisherModel)
    .where(eq(publisherModel.id, id))
    .returning();

  return deleted ? modelToDto(deleted) : null;
}
