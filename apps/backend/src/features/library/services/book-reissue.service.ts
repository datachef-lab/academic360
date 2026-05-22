import { db } from "@/db/index.js";
import { BookReissue, bookReissueModel } from "@repo/db/schemas";
import { and, count, desc, eq } from "drizzle-orm";

type BookReissueListFilters = {
  page: number;
  limit: number;
};

export type BookReissueListResult = {
  rows: BookReissue[];
  total: number;
  page: number;
  limit: number;
};

export async function findBookReissueById(
  id: number,
): Promise<BookReissue | null> {
  const [bookReissue] = await db
    .select()
    .from(bookReissueModel)
    .where(eq(bookReissueModel.id, id));

  return bookReissue ?? null;
}

export async function findBookReissuesPaginated(
  filters: BookReissueListFilters,
): Promise<BookReissueListResult> {
  const { page, limit } = filters;
  const offset = (page - 1) * limit;

  const rows = await db
    .select()
    .from(bookReissueModel)
    .orderBy(desc(bookReissueModel.id))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(bookReissueModel);

  return {
    rows,
    total,
    page,
    limit,
  };
}

export async function createBookReissue(
  data: Omit<BookReissue, "id">,
): Promise<BookReissue> {
  const [created] = await db.insert(bookReissueModel).values(data).returning();
  return created;
}

export async function updateBookReissue(
  id: number,
  data: Partial<Omit<BookReissue, "id">>,
): Promise<BookReissue | null> {
  const [updated] = await db
    .update(bookReissueModel)
    .set(data)
    .where(eq(bookReissueModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteBookReissue(
  id: number,
): Promise<BookReissue | null> {
  const [deleted] = await db
    .delete(bookReissueModel)
    .where(eq(bookReissueModel.id, id))
    .returning();

  return deleted ?? null;
}
