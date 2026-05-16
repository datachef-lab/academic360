import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, ilike, SQL } from "drizzle-orm";
import { rackModel } from "@repo/db/schemas/models/library/rack.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";

export type RackListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type RackListRow = {
  id: number;
  legacyRackId: number | null;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RackListResult = {
  rows: RackListRow[];
  total: number;
  page: number;
  limit: number;
};

export type RackUpsertInput = {
  name: string;
};

const buildListWhere = (
  filters: Omit<RackListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.search?.trim()) {
    parts.push(ilike(rackModel.name, `%${filters.search.trim()}%`));
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findRacksPaginated(
  filters: RackListFilters,
): Promise<RackListResult> {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);

  const [{ total }] = await db
    .select({ total: count() })
    .from(rackModel)
    .where(whereClause);

  const rows = await db
    .select({
      id: rackModel.id,
      legacyRackId: rackModel.legacyRackId,
      name: rackModel.name,
      createdAt: rackModel.createdAt,
      updatedAt: rackModel.updatedAt,
    })
    .from(rackModel)
    .where(whereClause)
    .orderBy(desc(rackModel.id))
    .limit(limit)
    .offset(offset);

  return { rows, total, page, limit };
}

export async function getRackById(id: number): Promise<RackListRow | null> {
  const [row] = await db
    .select({
      id: rackModel.id,
      legacyRackId: rackModel.legacyRackId,
      name: rackModel.name,
      createdAt: rackModel.createdAt,
      updatedAt: rackModel.updatedAt,
    })
    .from(rackModel)
    .where(eq(rackModel.id, id))
    .limit(1);
  return row ?? null;
}

export async function createRack(input: RackUpsertInput): Promise<number> {
  const [inserted] = await db
    .insert(rackModel)
    .values({
      name: input.name.trim(),
    })
    .returning({ id: rackModel.id });
  return inserted.id;
}

export async function updateRack(
  id: number,
  input: RackUpsertInput,
): Promise<void> {
  await db
    .update(rackModel)
    .set({
      name: input.name.trim(),
      updatedAt: new Date(),
    })
    .where(eq(rackModel.id, id));
}

export async function deleteRack(id: number): Promise<void> {
  const [{ linkedCount }] = await db
    .select({ linkedCount: count() })
    .from(copyDetailsModel)
    .where(eq(copyDetailsModel.rackId, id));

  if ((linkedCount ?? 0) > 0) {
    throw new ApiError(
      409,
      `This rack cannot be deleted because it is linked to ${linkedCount} copy detail record(s).`,
    );
  }

  await db.delete(rackModel).where(eq(rackModel.id, id));
}
