import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { authorTypeModel } from "@repo/db/schemas/models/library/author-type.model.js";
import { authorModel } from "@repo/db/schemas/models/library/author.model.js";
import { authorDetailsModel } from "@repo/db/schemas/models/library/author-detail.model.js";

export type AuthorTypeListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type AuthorTypeListRow = {
  id: number;
  legacyAuthorTypeId: number | null;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthorTypeListResult = {
  rows: AuthorTypeListRow[];
  total: number;
  page: number;
  limit: number;
};

export type AuthorTypeUpsertInput = {
  name: string;
};

const buildListWhere = (
  filters: Omit<AuthorTypeListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.search?.trim()) {
    parts.push(ilike(authorTypeModel.name, `%${filters.search.trim()}%`));
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findAuthorTypesPaginated(
  filters: AuthorTypeListFilters,
): Promise<AuthorTypeListResult> {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);

  const [{ total }] = await db
    .select({ total: count() })
    .from(authorTypeModel)
    .where(whereClause);

  const rows = await db
    .select({
      id: authorTypeModel.id,
      legacyAuthorTypeId: authorTypeModel.legacyAuthorTypeId,
      name: authorTypeModel.name,
      createdAt: authorTypeModel.createdAt,
      updatedAt: authorTypeModel.updatedAt,
    })
    .from(authorTypeModel)
    .where(whereClause)
    .orderBy(desc(authorTypeModel.id))
    .limit(limit)
    .offset(offset);

  return { rows, total, page, limit };
}

export async function getAuthorTypeById(
  id: number,
): Promise<AuthorTypeListRow | null> {
  const [row] = await db
    .select({
      id: authorTypeModel.id,
      legacyAuthorTypeId: authorTypeModel.legacyAuthorTypeId,
      name: authorTypeModel.name,
      createdAt: authorTypeModel.createdAt,
      updatedAt: authorTypeModel.updatedAt,
    })
    .from(authorTypeModel)
    .where(eq(authorTypeModel.id, id))
    .limit(1);
  return row ?? null;
}

export async function createAuthorType(
  input: AuthorTypeUpsertInput,
): Promise<number> {
  const [inserted] = await db
    .insert(authorTypeModel)
    .values({
      name: input.name.trim(),
    })
    .returning({ id: authorTypeModel.id });
  return inserted.id;
}

export async function updateAuthorType(
  id: number,
  input: AuthorTypeUpsertInput,
): Promise<void> {
  await db
    .update(authorTypeModel)
    .set({
      name: input.name.trim(),
      updatedAt: new Date(),
    })
    .where(eq(authorTypeModel.id, id));
}

export async function deleteAuthorType(id: number): Promise<void> {
  const [{ authorCount }] = await db
    .select({ authorCount: count() })
    .from(authorModel)
    .where(eq(authorModel.authorTypeId, id));

  if ((authorCount ?? 0) > 0) {
    throw new ApiError(
      409,
      `This author type cannot be deleted because it is linked to ${authorCount} author(s).`,
    );
  }

  const [{ detailCount }] = await db
    .select({ detailCount: count() })
    .from(authorDetailsModel)
    .where(eq(authorDetailsModel.authorTypeId, id));

  if ((detailCount ?? 0) > 0) {
    throw new ApiError(
      409,
      `This author type cannot be deleted because it is used in ${detailCount} book-author link(s).`,
    );
  }

  await db.delete(authorTypeModel).where(eq(authorTypeModel.id, id));
}
