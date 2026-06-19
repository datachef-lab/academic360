import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { patronCategoryModel } from "@repo/db/schemas/models/library/patron-category.model.js";
import { circulationPolicyModel } from "@repo/db/schemas/models/library/circulation-policy.model.js";
import { assertUniqueLibraryName } from "@/features/library/services/_assert-unique.js";

export type PatronCategoryListFilters = {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
};

export type PatronCategoryListRow = {
  id: number;
  legacyPatronCategoryId: number | null;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PatronCategoryListResult = {
  rows: PatronCategoryListRow[];
  total: number;
  page: number;
  limit: number;
};

export type PatronCategoryUpsertInput = {
  name: string;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
};

const COLS = {
  id: patronCategoryModel.id,
  legacyPatronCategoryId: patronCategoryModel.legacyPatronCategoryId,
  name: patronCategoryModel.name,
  code: patronCategoryModel.code,
  description: patronCategoryModel.description,
  isActive: patronCategoryModel.isActive,
  createdAt: patronCategoryModel.createdAt,
  updatedAt: patronCategoryModel.updatedAt,
};

const buildListWhere = (
  filters: Omit<PatronCategoryListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    const orPart = or(
      ilike(patronCategoryModel.name, term),
      ilike(patronCategoryModel.code, term),
    );
    if (orPart) parts.push(orPart);
  }
  if (filters.isActive != null) {
    parts.push(eq(patronCategoryModel.isActive, filters.isActive));
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findPatronCategoriesPaginated(
  filters: PatronCategoryListFilters,
): Promise<PatronCategoryListResult> {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);
  const [{ total }] = await db
    .select({ total: count() })
    .from(patronCategoryModel)
    .where(whereClause);
  const rows = await db
    .select(COLS)
    .from(patronCategoryModel)
    .where(whereClause)
    .orderBy(desc(patronCategoryModel.id))
    .limit(limit)
    .offset(offset);
  return { rows, total, page, limit };
}

export async function getPatronCategoryById(
  id: number,
): Promise<PatronCategoryListRow | null> {
  const [row] = await db
    .select(COLS)
    .from(patronCategoryModel)
    .where(eq(patronCategoryModel.id, id))
    .limit(1);
  return row ?? null;
}

const normalize = (input: PatronCategoryUpsertInput) => ({
  name: input.name.trim(),
  code: input.code?.trim() ? input.code.trim() : null,
  description: input.description?.trim() ? input.description.trim() : null,
  isActive: input.isActive ?? true,
});

export async function createPatronCategory(
  input: PatronCategoryUpsertInput,
): Promise<number> {
  await assertUniqueLibraryName({
    table: patronCategoryModel,
    nameColumn: patronCategoryModel.name,
    idColumn: patronCategoryModel.id,
    value: input.name,
    label: "Patron category",
  });
  const [inserted] = await db
    .insert(patronCategoryModel)
    .values(normalize(input))
    .returning({ id: patronCategoryModel.id });
  return inserted.id;
}

export async function updatePatronCategory(
  id: number,
  input: PatronCategoryUpsertInput,
): Promise<void> {
  await assertUniqueLibraryName({
    table: patronCategoryModel,
    nameColumn: patronCategoryModel.name,
    idColumn: patronCategoryModel.id,
    value: input.name,
    label: "Patron category",
    excludeId: id,
  });
  await db
    .update(patronCategoryModel)
    .set({ ...normalize(input), updatedAt: new Date() })
    .where(eq(patronCategoryModel.id, id));
}

export async function deletePatronCategory(id: number): Promise<void> {
  const [{ linkedCount }] = await db
    .select({ linkedCount: count() })
    .from(circulationPolicyModel)
    .where(eq(circulationPolicyModel.patronCategoryId, id));
  if ((linkedCount ?? 0) > 0) {
    throw new ApiError(
      409,
      `Cannot delete: ${linkedCount} circulation policy entry/entries reference this patron category.`,
    );
  }
  await db.delete(patronCategoryModel).where(eq(patronCategoryModel.id, id));
}
