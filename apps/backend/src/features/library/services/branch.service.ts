import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { branchModel } from "@repo/db/schemas/models/library/branch.model.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { libraryEntryExitModel } from "@repo/db/schemas/models/library/library-entry-exit.model.js";
import { assertUniqueLibraryName } from "@/features/library/services/_assert-unique.js";

export type BranchListFilters = {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
};

export type BranchListRow = {
  id: number;
  legacyBranchId: number | null;
  name: string;
  code: string | null;
  openingDate: string | null;
  isActive: boolean;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BranchListResult = {
  rows: BranchListRow[];
  total: number;
  page: number;
  limit: number;
};

export type BranchUpsertInput = {
  name: string;
  code?: string | null;
  openingDate?: string | null;
  isActive?: boolean;
  remarks?: string | null;
};

const BRANCH_LIST_COLUMNS = {
  id: branchModel.id,
  legacyBranchId: branchModel.legacyBranchId,
  name: branchModel.name,
  code: branchModel.code,
  openingDate: branchModel.openingDate,
  isActive: branchModel.isActive,
  remarks: branchModel.remarks,
  createdAt: branchModel.createdAt,
  updatedAt: branchModel.updatedAt,
};

const buildListWhere = (
  filters: Omit<BranchListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    const orPart = or(
      ilike(branchModel.name, term),
      ilike(branchModel.code, term),
    );
    if (orPart) parts.push(orPart);
  }
  if (filters.isActive != null) {
    parts.push(eq(branchModel.isActive, filters.isActive));
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findBranchesPaginated(
  filters: BranchListFilters,
): Promise<BranchListResult> {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);

  const [{ total }] = await db
    .select({ total: count() })
    .from(branchModel)
    .where(whereClause);

  const rows = await db
    .select(BRANCH_LIST_COLUMNS)
    .from(branchModel)
    .where(whereClause)
    .orderBy(desc(branchModel.id))
    .limit(limit)
    .offset(offset);

  return { rows, total, page, limit };
}

export async function getBranchById(id: number): Promise<BranchListRow | null> {
  const [row] = await db
    .select(BRANCH_LIST_COLUMNS)
    .from(branchModel)
    .where(eq(branchModel.id, id))
    .limit(1);
  return row ?? null;
}

const normalizeUpsert = (input: BranchUpsertInput) => ({
  name: input.name.trim(),
  code: input.code?.trim() ? input.code.trim() : null,
  openingDate: input.openingDate || null,
  isActive: input.isActive ?? true,
  remarks: input.remarks?.trim() ? input.remarks.trim() : null,
});

export async function createBranch(input: BranchUpsertInput): Promise<number> {
  await assertUniqueLibraryName({
    table: branchModel,
    nameColumn: branchModel.name,
    idColumn: branchModel.id,
    value: input.name,
    label: "Branch",
  });
  const [inserted] = await db
    .insert(branchModel)
    .values(normalizeUpsert(input))
    .returning({ id: branchModel.id });
  return inserted.id;
}

export async function updateBranch(
  id: number,
  input: BranchUpsertInput,
): Promise<void> {
  await assertUniqueLibraryName({
    table: branchModel,
    nameColumn: branchModel.name,
    idColumn: branchModel.id,
    value: input.name,
    label: "Branch",
    excludeId: id,
  });
  await db
    .update(branchModel)
    .set({ ...normalizeUpsert(input), updatedAt: new Date() })
    .where(eq(branchModel.id, id));
}

export async function deleteBranch(id: number): Promise<void> {
  const checks: Array<{ label: string; promise: Promise<{ c: number }[]> }> = [
    {
      label: "books",
      promise: db
        .select({ c: count() })
        .from(bookModel)
        .where(eq(bookModel.branchId, id))
        .then((r) => r as { c: number }[]),
    },
    {
      label: "copy_details",
      promise: db
        .select({ c: count() })
        .from(copyDetailsModel)
        .where(eq(copyDetailsModel.branchId, id))
        .then((r) => r as { c: number }[]),
    },
    {
      label: "book_circulation",
      promise: db
        .select({ c: count() })
        .from(bookCirculationModel)
        .where(eq(bookCirculationModel.branchId, id))
        .then((r) => r as { c: number }[]),
    },
    {
      label: "library_entry_exit",
      promise: db
        .select({ c: count() })
        .from(libraryEntryExitModel)
        .where(eq(libraryEntryExitModel.branchId, id))
        .then((r) => r as { c: number }[]),
    },
  ];
  const results = await Promise.all(checks.map((c) => c.promise));
  for (let i = 0; i < checks.length; i++) {
    const linked = results[i][0]?.c ?? 0;
    if (linked > 0) {
      throw new ApiError(
        409,
        `This branch cannot be deleted because it is linked to ${linked} ${checks[i].label} record(s).`,
      );
    }
  }
  await db.delete(branchModel).where(eq(branchModel.id, id));
}
