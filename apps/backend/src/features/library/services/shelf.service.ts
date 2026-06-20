import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, ilike, SQL } from "drizzle-orm";
import { shelfModel } from "@repo/db/schemas/models/library/shelf.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { assertUniqueLibraryName } from "@/features/library/services/_assert-unique.js";

export type ShelfListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type ShelfListRow = {
  id: number;
  legacyShelfId: number | null;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ShelfListResult = {
  rows: ShelfListRow[];
  total: number;
  page: number;
  limit: number;
};

export type ShelfUpsertInput = {
  name: string;
};

const buildListWhere = (
  filters: Omit<ShelfListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.search?.trim()) {
    parts.push(ilike(shelfModel.name, `%${filters.search.trim()}%`));
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findShelvesPaginated(
  filters: ShelfListFilters,
): Promise<ShelfListResult> {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);

  const [{ total }] = await db
    .select({ total: count() })
    .from(shelfModel)
    .where(whereClause);

  const rows = await db
    .select({
      id: shelfModel.id,
      legacyShelfId: shelfModel.legacyShelfId,
      name: shelfModel.name,
      createdAt: shelfModel.createdAt,
      updatedAt: shelfModel.updatedAt,
    })
    .from(shelfModel)
    .where(whereClause)
    .orderBy(desc(shelfModel.id))
    .limit(limit)
    .offset(offset);

  return { rows, total, page, limit };
}

export async function getShelfById(id: number): Promise<ShelfListRow | null> {
  const [row] = await db
    .select({
      id: shelfModel.id,
      legacyShelfId: shelfModel.legacyShelfId,
      name: shelfModel.name,
      createdAt: shelfModel.createdAt,
      updatedAt: shelfModel.updatedAt,
    })
    .from(shelfModel)
    .where(eq(shelfModel.id, id))
    .limit(1);
  return row ?? null;
}

export async function createShelf(input: ShelfUpsertInput): Promise<number> {
  await assertUniqueLibraryName({
    table: shelfModel,
    nameColumn: shelfModel.name,
    idColumn: shelfModel.id,
    value: input.name,
    label: "Shelf",
  });
  const [inserted] = await db
    .insert(shelfModel)
    .values({
      name: input.name.trim(),
    })
    .returning({ id: shelfModel.id });
  return inserted.id;
}

export async function updateShelf(
  id: number,
  input: ShelfUpsertInput,
): Promise<void> {
  await assertUniqueLibraryName({
    table: shelfModel,
    nameColumn: shelfModel.name,
    idColumn: shelfModel.id,
    value: input.name,
    label: "Shelf",
    excludeId: id,
  });
  await db
    .update(shelfModel)
    .set({
      name: input.name.trim(),
      updatedAt: new Date(),
    })
    .where(eq(shelfModel.id, id));
}

export async function deleteShelf(id: number): Promise<void> {
  const [{ linkedCount }] = await db
    .select({ linkedCount: count() })
    .from(copyDetailsModel)
    .where(eq(copyDetailsModel.shelfId, id));

  if ((linkedCount ?? 0) > 0) {
    throw new ApiError(
      409,
      `This shelf cannot be deleted because it is linked to ${linkedCount} copy detail record(s).`,
    );
  }

  await db.delete(shelfModel).where(eq(shelfModel.id, id));
}
