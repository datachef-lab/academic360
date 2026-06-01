import { db } from "@/db/index.js";
import { AuthorDetails, authorDetailsModel } from "@repo/db/schemas";
import { and, count, desc, eq } from "drizzle-orm";

type AuthorDetailListFilters = {
  page: number;
  limit: number;
};

export type AuthorDetailListResult = {
  rows: AuthorDetails[];
  total: number;
  page: number;
  limit: number;
};

export async function findAuthorDetailById(
  id: number,
): Promise<AuthorDetails | null> {
  const [authorDetail] = await db
    .select()
    .from(authorDetailsModel)
    .where(eq(authorDetailsModel.id, id));

  return authorDetail ?? null;
}

export async function findAuthorDetailsPaginated(
  filters: AuthorDetailListFilters,
): Promise<AuthorDetailListResult> {
  const { page, limit } = filters;
  const offset = (page - 1) * limit;

  const rows = await db
    .select()
    .from(authorDetailsModel)
    .orderBy(desc(authorDetailsModel.id))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(authorDetailsModel);

  return {
    rows,
    total,
    page,
    limit,
  };
}

export async function createAuthorDetail(
  data: Omit<AuthorDetails, "id">,
): Promise<AuthorDetails> {
  const [created] = await db
    .insert(authorDetailsModel)
    .values(data)
    .returning();
  return created;
}

export async function updateAuthorDetail(
  id: number,
  data: Partial<Omit<AuthorDetails, "id">>,
): Promise<AuthorDetails | null> {
  const [updated] = await db
    .update(authorDetailsModel)
    .set(data)
    .where(eq(authorDetailsModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteAuthorDetail(
  id: number,
): Promise<AuthorDetails | null> {
  const [deleted] = await db
    .delete(authorDetailsModel)
    .where(eq(authorDetailsModel.id, id))
    .returning();

  return deleted ?? null;
}
