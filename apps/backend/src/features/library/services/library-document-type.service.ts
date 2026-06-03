import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { libraryDocumentTypeModel } from "@academic/db/schemas/models/library/library-document-type.model.js";
import { libraryArticleModel } from "@academic/db/schemas/models/library/library-article.model.js";
import { bookModel } from "@academic/db/schemas/models/library/book.model.js";

export type LibraryDocumentTypeListFilters = {
  page: number;
  limit: number;
  search?: string;
  libraryArticleId?: number;
};

export type LibraryDocumentTypeListRow = {
  id: number;
  legacyLibraryDocumentTypeId: number | null;
  name: string;
  libraryArticleId: number | null;
  libraryArticleName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LibraryDocumentTypeListResult = {
  rows: LibraryDocumentTypeListRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryDocumentTypeUpsertInput = {
  name: string;
  libraryArticleId?: number | null;
};

const buildListWhere = (
  filters: Omit<LibraryDocumentTypeListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    parts.push(
      or(
        ilike(libraryDocumentTypeModel.name, term),
        ilike(libraryArticleModel.name, term),
      )!,
    );
  }
  if (
    filters.libraryArticleId != null &&
    !Number.isNaN(filters.libraryArticleId)
  ) {
    parts.push(
      eq(libraryDocumentTypeModel.libraryArticleId, filters.libraryArticleId),
    );
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findLibraryDocumentTypesPaginated(
  filters: LibraryDocumentTypeListFilters,
): Promise<LibraryDocumentTypeListResult> {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);

  const [{ total }] = await db
    .select({ total: count() })
    .from(libraryDocumentTypeModel)
    .leftJoin(
      libraryArticleModel,
      eq(libraryDocumentTypeModel.libraryArticleId, libraryArticleModel.id),
    )
    .where(whereClause);

  const rows = await db
    .select({
      id: libraryDocumentTypeModel.id,
      legacyLibraryDocumentTypeId:
        libraryDocumentTypeModel.legacyLibraryDocumentTypeId,
      name: libraryDocumentTypeModel.name,
      libraryArticleId: libraryDocumentTypeModel.libraryArticleId,
      libraryArticleName: libraryArticleModel.name,
      createdAt: libraryDocumentTypeModel.createdAt,
      updatedAt: libraryDocumentTypeModel.updatedAt,
    })
    .from(libraryDocumentTypeModel)
    .leftJoin(
      libraryArticleModel,
      eq(libraryDocumentTypeModel.libraryArticleId, libraryArticleModel.id),
    )
    .where(whereClause)
    .orderBy(desc(libraryDocumentTypeModel.id))
    .limit(limit)
    .offset(offset);

  return { rows, total, page, limit };
}

export async function getLibraryDocumentTypeById(
  id: number,
): Promise<LibraryDocumentTypeListRow | null> {
  const [row] = await db
    .select({
      id: libraryDocumentTypeModel.id,
      legacyLibraryDocumentTypeId:
        libraryDocumentTypeModel.legacyLibraryDocumentTypeId,
      name: libraryDocumentTypeModel.name,
      libraryArticleId: libraryDocumentTypeModel.libraryArticleId,
      libraryArticleName: libraryArticleModel.name,
      createdAt: libraryDocumentTypeModel.createdAt,
      updatedAt: libraryDocumentTypeModel.updatedAt,
    })
    .from(libraryDocumentTypeModel)
    .leftJoin(
      libraryArticleModel,
      eq(libraryDocumentTypeModel.libraryArticleId, libraryArticleModel.id),
    )
    .where(eq(libraryDocumentTypeModel.id, id))
    .limit(1);
  return row ?? null;
}

export async function createLibraryDocumentType(
  input: LibraryDocumentTypeUpsertInput,
): Promise<number> {
  const [inserted] = await db
    .insert(libraryDocumentTypeModel)
    .values({
      name: input.name.trim(),
      libraryArticleId: input.libraryArticleId ?? null,
    })
    .returning({ id: libraryDocumentTypeModel.id });
  return inserted.id;
}

export async function updateLibraryDocumentType(
  id: number,
  input: LibraryDocumentTypeUpsertInput,
): Promise<void> {
  await db
    .update(libraryDocumentTypeModel)
    .set({
      name: input.name.trim(),
      libraryArticleId: input.libraryArticleId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(libraryDocumentTypeModel.id, id));
}

export async function deleteLibraryDocumentType(id: number): Promise<void> {
  const [{ linkedCount }] = await db
    .select({ linkedCount: count() })
    .from(bookModel)
    .where(eq(bookModel.libraryDocumentTypeId, id));

  if ((linkedCount ?? 0) > 0) {
    throw new ApiError(
      409,
      `This library document type cannot be deleted because it is linked to ${linkedCount} book record(s).`,
    );
  }

  await db
    .delete(libraryDocumentTypeModel)
    .where(eq(libraryDocumentTypeModel.id, id));
}
