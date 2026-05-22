import { db } from "@/db/index.js";
import { Author, authorModel } from "@repo/db/schemas";
import { and, count, desc, eq, ilike, ne } from "drizzle-orm";

type AuthorListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type AuthorListResult = {
  rows: Author[];
  total: number;
  page: number;
  limit: number;
};

export async function findAuthorById(id: number): Promise<Author | null> {
  const [author] = await db
    .select()
    .from(authorModel)
    .where(eq(authorModel.id, id));

  return author ?? null;
}

export async function findAuthorByName(
  name: string,
  excludeId?: number,
): Promise<Author | null> {
  const whereClause =
    excludeId !== undefined
      ? and(ilike(authorModel.name, name.trim()), ne(authorModel.id, excludeId))
      : ilike(authorModel.name, name.trim());

  const [author] = await db.select().from(authorModel).where(whereClause);
  return author ?? null;
}

export async function findAuthorsPaginated(
  filters: AuthorListFilters,
): Promise<AuthorListResult> {
  const { page, limit, search } = filters;
  const offset = (page - 1) * limit;
  const whereClause =
    search && search.trim()
      ? ilike(authorModel.name, `%${search.trim()}%`)
      : undefined;

  const rows = await db
    .select()
    .from(authorModel)
    .where(whereClause)
    .orderBy(desc(authorModel.id))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(authorModel)
    .where(whereClause);

  return {
    rows,
    total,
    page,
    limit,
  };
}

export async function createAuthor(data: Omit<Author, "id">): Promise<Author> {
  const [created] = await db.insert(authorModel).values(data).returning();
  return created;
}

export async function updateAuthor(
  id: number,
  data: Partial<Omit<Author, "id">>,
): Promise<Author | null> {
  const [updated] = await db
    .update(authorModel)
    .set(data)
    .where(eq(authorModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteAuthor(id: number): Promise<Author | null> {
  const [deleted] = await db
    .delete(authorModel)
    .where(eq(authorModel.id, id))
    .returning();

  return deleted ?? null;
}
