import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { authorModel } from "@repo/db/schemas/models/library/author.model.js";
import { authorTypeModel } from "@repo/db/schemas/models/library/author-type.model.js";
import { authorDetailsModel } from "@repo/db/schemas/models/library/author-detail.model.js";
import { nationalityModel } from "@repo/db/schemas/models/resources/nationality.model.js";

export type AuthorListFilters = {
  page: number;
  limit: number;
  search?: string;
  authorTypeId?: number;
  nationalityId?: number;
};

export type AuthorListRow = {
  id: number;
  legacyAuthorId: number | null;
  name: string;
  shortName: string | null;
  remarks: string | null;
  authorTypeId: number | null;
  authorTypeName: string | null;
  nationalityId: number | null;
  nationalityName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthorListResult = {
  rows: AuthorListRow[];
  total: number;
  page: number;
  limit: number;
};

export type AuthorUpsertInput = {
  name: string;
  shortName?: string | null;
  authorTypeId?: number | null;
  nationalityId?: number | null;
  remarks?: string | null;
};

const buildListWhere = (
  filters: Omit<AuthorListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    const orPart = or(
      ilike(authorModel.name, term),
      ilike(authorModel.shortName, term),
    );
    if (orPart) parts.push(orPart);
  }
  if (filters.authorTypeId != null) {
    parts.push(eq(authorModel.authorTypeId, filters.authorTypeId));
  }
  if (filters.nationalityId != null) {
    parts.push(eq(authorModel.nationalityId, filters.nationalityId));
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findAuthorsPaginated(
  filters: AuthorListFilters,
): Promise<AuthorListResult> {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);

  const [{ total }] = await db
    .select({ total: count() })
    .from(authorModel)
    .where(whereClause);

  const rows = await db
    .select({
      id: authorModel.id,
      legacyAuthorId: authorModel.legacyAuthorId,
      name: authorModel.name,
      shortName: authorModel.shortName,
      remarks: authorModel.remarks,
      authorTypeId: authorModel.authorTypeId,
      authorTypeName: authorTypeModel.name,
      nationalityId: authorModel.nationalityId,
      nationalityName: nationalityModel.name,
      createdAt: authorModel.createdAt,
      updatedAt: authorModel.updatedAt,
    })
    .from(authorModel)
    .leftJoin(authorTypeModel, eq(authorTypeModel.id, authorModel.authorTypeId))
    .leftJoin(
      nationalityModel,
      eq(nationalityModel.id, authorModel.nationalityId),
    )
    .where(whereClause)
    .orderBy(desc(authorModel.id))
    .limit(limit)
    .offset(offset);

  return { rows, total, page, limit };
}

export async function getAuthorById(id: number): Promise<AuthorListRow | null> {
  const [row] = await db
    .select({
      id: authorModel.id,
      legacyAuthorId: authorModel.legacyAuthorId,
      name: authorModel.name,
      shortName: authorModel.shortName,
      remarks: authorModel.remarks,
      authorTypeId: authorModel.authorTypeId,
      authorTypeName: authorTypeModel.name,
      nationalityId: authorModel.nationalityId,
      nationalityName: nationalityModel.name,
      createdAt: authorModel.createdAt,
      updatedAt: authorModel.updatedAt,
    })
    .from(authorModel)
    .leftJoin(authorTypeModel, eq(authorTypeModel.id, authorModel.authorTypeId))
    .leftJoin(
      nationalityModel,
      eq(nationalityModel.id, authorModel.nationalityId),
    )
    .where(eq(authorModel.id, id))
    .limit(1);
  return row ?? null;
}

const normalizeUpsert = (input: AuthorUpsertInput) => ({
  name: input.name.trim(),
  shortName: input.shortName?.trim() ? input.shortName.trim() : null,
  authorTypeId: input.authorTypeId ?? null,
  nationalityId: input.nationalityId ?? null,
  remarks: input.remarks?.trim() ? input.remarks.trim() : null,
});

export async function createAuthor(input: AuthorUpsertInput): Promise<number> {
  const [inserted] = await db
    .insert(authorModel)
    .values(normalizeUpsert(input))
    .returning({ id: authorModel.id });
  return inserted.id;
}

export async function updateAuthor(
  id: number,
  input: AuthorUpsertInput,
): Promise<void> {
  await db
    .update(authorModel)
    .set({ ...normalizeUpsert(input), updatedAt: new Date() })
    .where(eq(authorModel.id, id));
}

export async function deleteAuthor(id: number): Promise<void> {
  const [{ linkedCount }] = await db
    .select({ linkedCount: count() })
    .from(authorDetailsModel)
    .where(eq(authorDetailsModel.authorId, id));

  if ((linkedCount ?? 0) > 0) {
    throw new ApiError(
      409,
      `This author cannot be deleted because they are linked to ${linkedCount} book(s).`,
    );
  }

  await db.delete(authorModel).where(eq(authorModel.id, id));
}
