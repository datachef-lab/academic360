import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { itemCategoryModel } from "@repo/db/schemas/models/library/item-category.model.js";
import { circulationPolicyModel } from "@repo/db/schemas/models/library/circulation-policy.model.js";
import { assertUniqueLibraryName } from "@/features/library/services/_assert-unique.js";

export type ItemCategoryListFilters = {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
};

export type ItemCategoryListRow = {
  id: number;
  legacyItemCategoryId: number | null;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ItemCategoryListResult = {
  rows: ItemCategoryListRow[];
  total: number;
  page: number;
  limit: number;
};

export type ItemCategoryUpsertInput = {
  name: string;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
};

const COLS = {
  id: itemCategoryModel.id,
  legacyItemCategoryId: itemCategoryModel.legacyItemCategoryId,
  name: itemCategoryModel.name,
  code: itemCategoryModel.code,
  description: itemCategoryModel.description,
  isActive: itemCategoryModel.isActive,
  createdAt: itemCategoryModel.createdAt,
  updatedAt: itemCategoryModel.updatedAt,
};

const buildListWhere = (
  filters: Omit<ItemCategoryListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    const orPart = or(
      ilike(itemCategoryModel.name, term),
      ilike(itemCategoryModel.code, term),
    );
    if (orPart) parts.push(orPart);
  }
  if (filters.isActive != null) {
    parts.push(eq(itemCategoryModel.isActive, filters.isActive));
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findItemCategoriesPaginated(
  filters: ItemCategoryListFilters,
): Promise<ItemCategoryListResult> {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);
  const [{ total }] = await db
    .select({ total: count() })
    .from(itemCategoryModel)
    .where(whereClause);
  const rows = await db
    .select(COLS)
    .from(itemCategoryModel)
    .where(whereClause)
    .orderBy(desc(itemCategoryModel.id))
    .limit(limit)
    .offset(offset);
  return { rows, total, page, limit };
}

export async function getItemCategoryById(
  id: number,
): Promise<ItemCategoryListRow | null> {
  const [row] = await db
    .select(COLS)
    .from(itemCategoryModel)
    .where(eq(itemCategoryModel.id, id))
    .limit(1);
  return row ?? null;
}

const normalize = (input: ItemCategoryUpsertInput) => ({
  name: input.name.trim(),
  code: input.code?.trim() ? input.code.trim() : null,
  description: input.description?.trim() ? input.description.trim() : null,
  isActive: input.isActive ?? true,
});

export async function createItemCategory(
  input: ItemCategoryUpsertInput,
): Promise<number> {
  await assertUniqueLibraryName({
    table: itemCategoryModel,
    nameColumn: itemCategoryModel.name,
    idColumn: itemCategoryModel.id,
    value: input.name,
    label: "Item category",
  });
  const [inserted] = await db
    .insert(itemCategoryModel)
    .values(normalize(input))
    .returning({ id: itemCategoryModel.id });
  return inserted.id;
}

export async function updateItemCategory(
  id: number,
  input: ItemCategoryUpsertInput,
): Promise<void> {
  await assertUniqueLibraryName({
    table: itemCategoryModel,
    nameColumn: itemCategoryModel.name,
    idColumn: itemCategoryModel.id,
    value: input.name,
    label: "Item category",
    excludeId: id,
  });
  await db
    .update(itemCategoryModel)
    .set({ ...normalize(input), updatedAt: new Date() })
    .where(eq(itemCategoryModel.id, id));
}

export async function deleteItemCategory(id: number): Promise<void> {
  const [{ linkedCount }] = await db
    .select({ linkedCount: count() })
    .from(circulationPolicyModel)
    .where(eq(circulationPolicyModel.itemCategoryId, id));
  if ((linkedCount ?? 0) > 0) {
    throw new ApiError(
      409,
      `Cannot delete: ${linkedCount} circulation policy entry/entries reference this item category.`,
    );
  }
  await db.delete(itemCategoryModel).where(eq(itemCategoryModel.id, id));
}
