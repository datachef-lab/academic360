import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, ilike, SQL } from "drizzle-orm";
import { statusModel } from "@repo/db/schemas/models/library/status.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { assertUniqueLibraryName } from "@/features/library/services/_assert-unique.js";

export type StatusListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type StatusListRow = {
  id: number;
  legacyStatusId: number | null;
  name: string;
  isIssuable: boolean;
  issuedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type StatusListResult = {
  rows: StatusListRow[];
  total: number;
  page: number;
  limit: number;
};

export type StatusUpsertInput = {
  name: string;
  isIssuable?: boolean;
  issuedTo?: string | null;
};

const buildListWhere = (
  filters: Omit<StatusListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    parts.push(ilike(statusModel.name, term));
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findStatusesPaginated(
  filters: StatusListFilters,
): Promise<StatusListResult> {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);

  const [{ total }] = await db
    .select({ total: count() })
    .from(statusModel)
    .where(whereClause);

  const rows = await db
    .select({
      id: statusModel.id,
      legacyStatusId: statusModel.legacyStatusId,
      name: statusModel.name,
      isIssuable: statusModel.isIssuable,
      issuedTo: statusModel.issuedTo,
      createdAt: statusModel.createdAt,
      updatedAt: statusModel.updatedAt,
    })
    .from(statusModel)
    .where(whereClause)
    .orderBy(desc(statusModel.id))
    .limit(limit)
    .offset(offset);

  return { rows, total, page, limit };
}

export async function getStatusById(id: number): Promise<StatusListRow | null> {
  const [row] = await db
    .select({
      id: statusModel.id,
      legacyStatusId: statusModel.legacyStatusId,
      name: statusModel.name,
      isIssuable: statusModel.isIssuable,
      issuedTo: statusModel.issuedTo,
      createdAt: statusModel.createdAt,
      updatedAt: statusModel.updatedAt,
    })
    .from(statusModel)
    .where(eq(statusModel.id, id))
    .limit(1);
  return row ?? null;
}

export async function createStatus(input: StatusUpsertInput): Promise<number> {
  await assertUniqueLibraryName({
    table: statusModel,
    nameColumn: statusModel.name,
    idColumn: statusModel.id,
    value: input.name,
    label: "Status",
  });
  const [inserted] = await db
    .insert(statusModel)
    .values({
      name: input.name.trim(),
      isIssuable: input.isIssuable === true,
      issuedTo: input.issuedTo?.trim() || null,
    })
    .returning({ id: statusModel.id });
  return inserted.id;
}

export async function updateStatus(
  id: number,
  input: StatusUpsertInput,
): Promise<void> {
  await assertUniqueLibraryName({
    table: statusModel,
    nameColumn: statusModel.name,
    idColumn: statusModel.id,
    value: input.name,
    label: "Status",
    excludeId: id,
  });
  await db
    .update(statusModel)
    .set({
      name: input.name.trim(),
      isIssuable: input.isIssuable === true,
      issuedTo: input.issuedTo?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(statusModel.id, id));
}

export async function deleteStatus(id: number): Promise<void> {
  const [{ linkedCount }] = await db
    .select({ linkedCount: count() })
    .from(copyDetailsModel)
    .where(eq(copyDetailsModel.statusId, id));

  if ((linkedCount ?? 0) > 0) {
    throw new ApiError(
      409,
      `This status cannot be deleted because it is linked to ${linkedCount} copy detail record(s).`,
    );
  }

  await db.delete(statusModel).where(eq(statusModel.id, id));
}
