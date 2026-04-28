import { db } from "@/db/index.js";
import { BorrowingType, borrowingTypeModel } from "@repo/db/schemas";
import { and, count, desc, eq, ilike, ne } from "drizzle-orm";

type BorrowingTypeListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type BorrowingTypeListResult = {
  rows: BorrowingType[];
  total: number;
  page: number;
  limit: number;
};

export async function findBorrowingTypeById(
  id: number,
): Promise<BorrowingType | null> {
  const [borrowingType] = await db
    .select()
    .from(borrowingTypeModel)
    .where(eq(borrowingTypeModel.id, id));

  return borrowingType ?? null;
}

export async function findBorrowingTypeByName(
  name: string,
  excludeId?: number,
): Promise<BorrowingType | null> {
  const whereClause =
    excludeId !== undefined
      ? and(
          ilike(borrowingTypeModel.name, name.trim()),
          ne(borrowingTypeModel.id, excludeId),
        )
      : ilike(borrowingTypeModel.name, name.trim());

  const [borrowingType] = await db
    .select()
    .from(borrowingTypeModel)
    .where(whereClause);
  return borrowingType ?? null;
}

export async function findBorrowingTypesPaginated(
  filters: BorrowingTypeListFilters,
): Promise<BorrowingTypeListResult> {
  const { page, limit, search } = filters;
  const offset = (page - 1) * limit;
  const whereClause =
    search && search.trim()
      ? ilike(borrowingTypeModel.name, `%${search.trim()}%`)
      : undefined;

  const rows = await db
    .select()
    .from(borrowingTypeModel)
    .where(whereClause)
    .orderBy(desc(borrowingTypeModel.id))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(borrowingTypeModel)
    .where(whereClause);

  return {
    rows,
    total,
    page,
    limit,
  };
}

export async function createBorrowingType(
  data: Omit<BorrowingType, "id">,
): Promise<BorrowingType> {
  const [created] = await db
    .insert(borrowingTypeModel)
    .values(data)
    .returning();
  return created;
}

export async function updateBorrowingType(
  id: number,
  data: Partial<Omit<BorrowingType, "id">>,
): Promise<BorrowingType | null> {
  const [updated] = await db
    .update(borrowingTypeModel)
    .set(data)
    .where(eq(borrowingTypeModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteBorrowingType(
  id: number,
): Promise<BorrowingType | null> {
  const [deleted] = await db
    .delete(borrowingTypeModel)
    .where(eq(borrowingTypeModel.id, id))
    .returning();

  return deleted ?? null;
}
