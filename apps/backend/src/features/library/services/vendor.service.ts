import { db } from "@/db";
import { Vendor, vendorModel } from "@repo/db/schemas";

import { and, count, desc, eq, ilike, ne } from "drizzle-orm";

type vendorListFilters = {
  page: number | undefined;
  limit: number | undefined;
  search?: string;
};

export type vendorListResult = {
  rows: Vendor[];
  total: number;
  page: number;
  limit: number;
};

export const findVendorById = async (id: number): Promise<Vendor | null> => {
  const [vendor] = await db
    .select()
    .from(vendorModel)
    .where(eq(vendorModel.id, id));
  return vendor || null;
};

export async function findVendorByName(
  name: string,
  excludeId?: number,
): Promise<Vendor | null> {
  const whereClause =
    excludeId !== undefined
      ? and(ilike(vendorModel.name, name.trim()), ne(vendorModel.id, excludeId))
      : ilike(vendorModel.name, name.trim());

  const [vendor] = await db.select().from(vendorModel).where(whereClause);
  return vendor ?? null;
}

export const CreateVendor = async (
  data: Omit<Vendor, "id">,
): Promise<Vendor> => {
  const [created] = await db.insert(vendorModel).values(data).returning();
  return created;
};

export const findVendorsPaginated = async (
  filters: vendorListFilters,
): Promise<vendorListResult> => {
  const { page, limit, search } = filters;

  const whereClause =
    search && search.trim()
      ? ilike(vendorModel.name, `%${search.trim()}%`)
      : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(vendorModel)
    .where(whereClause);

  if (limit === undefined) {
    const rows = await db
      .select()
      .from(vendorModel)
      .where(whereClause)
      .orderBy(desc(vendorModel.id));

    return {
      rows,
      total,
      page: 1,
      limit: total,
    };
  }

  const safePage =
    page === undefined || Number.isNaN(page) || page < 1 ? 1 : page;
  const safeLimit =
    Number.isNaN(limit) || limit < 1 ? 10 : Math.min(limit, 100);

  const rows = await db
    .select()
    .from(vendorModel)
    .where(whereClause)
    .orderBy(desc(vendorModel.id))
    .limit(safeLimit)
    .offset((safePage - 1) * safeLimit);

  return {
    rows,
    total,
    page: safePage,
    limit: safeLimit,
  };
};

export const updateVendor = async (
  id: number,
  data: Partial<Omit<Vendor, "id">>,
): Promise<Vendor | null> => {
  const [updated] = await db
    .update(vendorModel)
    .set(data)
    .where(eq(vendorModel.id, id))
    .returning();
  return updated || null;
};

export const deleteVendor = async (id: number): Promise<Vendor | null> => {
  const [deleted] = await db
    .delete(vendorModel)
    .where(eq(vendorModel.id, id))
    .returning();

  return deleted ?? null;
};
