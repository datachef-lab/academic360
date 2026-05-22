import { db } from "@/db/index.js";
import { AuthorType, authorTypeModel } from "@repo/db/schemas";
import { and, count, desc, eq, ilike, ne } from "drizzle-orm";

type AuthorTypeListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type AuthorTypeListResult = {
  rows: AuthorType[];
  total: number;
  page: number;
  limit: number;
};

export async function findAuthorTypeById(
  id: number,
): Promise<AuthorType | null> {
  const [authorType] = await db
    .select()
    .from(authorTypeModel)
    .where(eq(authorTypeModel.id, id));

  return authorType ?? null;
}

export async function findAuthorTypeByName(
  name: string,
  excludeId?: number,
): Promise<AuthorType | null> {
  const whereClause =
    excludeId !== undefined
      ? and(
          ilike(authorTypeModel.name, name.trim()),
          ne(authorTypeModel.id, excludeId),
        )
      : ilike(authorTypeModel.name, name.trim());

  const [authorType] = await db
    .select()
    .from(authorTypeModel)
    .where(whereClause);

  return authorType ?? null;
}

export async function findAuthorTypesPaginated(
  filters: AuthorTypeListFilters,
): Promise<AuthorTypeListResult> {
  const { page, limit, search } = filters;
  const offset = (page - 1) * limit;
  const whereClause =
    search && search.trim()
      ? ilike(authorTypeModel.name, `%${search.trim()}%`)
      : undefined;

  const rows = await db
    .select()
    .from(authorTypeModel)
    .where(whereClause)
    .orderBy(desc(authorTypeModel.id))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(authorTypeModel)
    .where(whereClause);

  return {
    rows,
    total,
    page,
    limit,
  };
}

export async function createAuthorType(
  data: Omit<AuthorType, "id">,
): Promise<AuthorType> {
  const [created] = await db.insert(authorTypeModel).values(data).returning();
  return created;
}

export async function updateAuthorType(
  id: number,
  data: Partial<Omit<AuthorType, "id">>,
): Promise<AuthorType | null> {
  const [updated] = await db
    .update(authorTypeModel)
    .set(data)
    .where(eq(authorTypeModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteAuthorType(id: number): Promise<AuthorType | null> {
  const [deleted] = await db
    .delete(authorTypeModel)
    .where(eq(authorTypeModel.id, id))
    .returning();

  return deleted ?? null;
}
