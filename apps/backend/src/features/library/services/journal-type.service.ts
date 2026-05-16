import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, ilike, SQL } from "drizzle-orm";
import { journalTypeModel } from "@repo/db/schemas/models/library/journal-type.model.js";
import { journalModel } from "@repo/db/schemas/models/library/journal.model.js";

export type JournalTypeListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type JournalTypeListRow = {
  id: number;
  legacyJournalTypeId: number | null;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type JournalTypeListResult = {
  rows: JournalTypeListRow[];
  total: number;
  page: number;
  limit: number;
};

export type JournalTypeUpsertInput = {
  name: string;
};

const buildListWhere = (
  filters: Omit<JournalTypeListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.search?.trim()) {
    parts.push(ilike(journalTypeModel.name, `%${filters.search.trim()}%`));
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findJournalTypesPaginated(
  filters: JournalTypeListFilters,
): Promise<JournalTypeListResult> {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);

  const [{ total }] = await db
    .select({ total: count() })
    .from(journalTypeModel)
    .where(whereClause);

  const rows = await db
    .select({
      id: journalTypeModel.id,
      legacyJournalTypeId: journalTypeModel.legacyJournalTypeId,
      name: journalTypeModel.name,
      createdAt: journalTypeModel.createdAt,
      updatedAt: journalTypeModel.updatedAt,
    })
    .from(journalTypeModel)
    .where(whereClause)
    .orderBy(desc(journalTypeModel.id))
    .limit(limit)
    .offset(offset);

  return { rows, total, page, limit };
}

export async function getJournalTypeById(
  id: number,
): Promise<JournalTypeListRow | null> {
  const [row] = await db
    .select({
      id: journalTypeModel.id,
      legacyJournalTypeId: journalTypeModel.legacyJournalTypeId,
      name: journalTypeModel.name,
      createdAt: journalTypeModel.createdAt,
      updatedAt: journalTypeModel.updatedAt,
    })
    .from(journalTypeModel)
    .where(eq(journalTypeModel.id, id))
    .limit(1);
  return row ?? null;
}

export async function createJournalType(
  input: JournalTypeUpsertInput,
): Promise<number> {
  const [inserted] = await db
    .insert(journalTypeModel)
    .values({
      name: input.name.trim(),
    })
    .returning({ id: journalTypeModel.id });
  return inserted.id;
}

export async function updateJournalType(
  id: number,
  input: JournalTypeUpsertInput,
): Promise<void> {
  await db
    .update(journalTypeModel)
    .set({
      name: input.name.trim(),
      updatedAt: new Date(),
    })
    .where(eq(journalTypeModel.id, id));
}

export async function deleteJournalType(id: number): Promise<void> {
  const [{ linkedCount }] = await db
    .select({ linkedCount: count() })
    .from(journalModel)
    .where(eq(journalModel.type, id));

  if ((linkedCount ?? 0) > 0) {
    throw new ApiError(
      409,
      `This journal type cannot be deleted because it is linked to ${linkedCount} journal record(s).`,
    );
  }

  await db.delete(journalTypeModel).where(eq(journalTypeModel.id, id));
}
