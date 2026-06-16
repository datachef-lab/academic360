import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, SQL } from "drizzle-orm";
import { circulationPolicyModel } from "@repo/db/schemas/models/library/circulation-policy.model.js";
import { patronCategoryModel } from "@repo/db/schemas/models/library/patron-category.model.js";
import { itemCategoryModel } from "@repo/db/schemas/models/library/item-category.model.js";

export type CirculationPolicyListFilters = {
  page: number;
  limit: number;
  patronCategoryId?: number;
  itemCategoryId?: number;
  isActive?: boolean;
};

export type CirculationPolicyListRow = {
  id: number;
  patronCategoryId: number;
  patronCategoryName: string;
  itemCategoryId: number;
  itemCategoryName: string;
  loanDays: number;
  finePerDay: number;
  renewalLimit: number;
  graceDays: number;
  maxCopiesAtOnce: number;
  skipHolidaysInFine: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CirculationPolicyListResult = {
  rows: CirculationPolicyListRow[];
  total: number;
  page: number;
  limit: number;
};

export type CirculationPolicyUpsertInput = {
  patronCategoryId: number;
  itemCategoryId: number;
  loanDays: number;
  finePerDay: number;
  renewalLimit: number;
  graceDays: number;
  maxCopiesAtOnce: number;
  skipHolidaysInFine: boolean;
  isActive?: boolean;
};

const COLS = {
  id: circulationPolicyModel.id,
  patronCategoryId: circulationPolicyModel.patronCategoryId,
  patronCategoryName: patronCategoryModel.name,
  itemCategoryId: circulationPolicyModel.itemCategoryId,
  itemCategoryName: itemCategoryModel.name,
  loanDays: circulationPolicyModel.loanDays,
  finePerDay: circulationPolicyModel.finePerDay,
  renewalLimit: circulationPolicyModel.renewalLimit,
  graceDays: circulationPolicyModel.graceDays,
  maxCopiesAtOnce: circulationPolicyModel.maxCopiesAtOnce,
  skipHolidaysInFine: circulationPolicyModel.skipHolidaysInFine,
  isActive: circulationPolicyModel.isActive,
  createdAt: circulationPolicyModel.createdAt,
  updatedAt: circulationPolicyModel.updatedAt,
};

const buildListWhere = (
  filters: Omit<CirculationPolicyListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.patronCategoryId != null) {
    parts.push(
      eq(circulationPolicyModel.patronCategoryId, filters.patronCategoryId),
    );
  }
  if (filters.itemCategoryId != null) {
    parts.push(
      eq(circulationPolicyModel.itemCategoryId, filters.itemCategoryId),
    );
  }
  if (filters.isActive != null) {
    parts.push(eq(circulationPolicyModel.isActive, filters.isActive));
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findCirculationPoliciesPaginated(
  filters: CirculationPolicyListFilters,
): Promise<CirculationPolicyListResult> {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);
  const [{ total }] = await db
    .select({ total: count() })
    .from(circulationPolicyModel)
    .where(whereClause);
  const rows = await db
    .select(COLS)
    .from(circulationPolicyModel)
    .innerJoin(
      patronCategoryModel,
      eq(patronCategoryModel.id, circulationPolicyModel.patronCategoryId),
    )
    .innerJoin(
      itemCategoryModel,
      eq(itemCategoryModel.id, circulationPolicyModel.itemCategoryId),
    )
    .where(whereClause)
    .orderBy(desc(circulationPolicyModel.id))
    .limit(limit)
    .offset(offset);
  return { rows, total, page, limit };
}

export async function getCirculationPolicyById(
  id: number,
): Promise<CirculationPolicyListRow | null> {
  const [row] = await db
    .select(COLS)
    .from(circulationPolicyModel)
    .innerJoin(
      patronCategoryModel,
      eq(patronCategoryModel.id, circulationPolicyModel.patronCategoryId),
    )
    .innerJoin(
      itemCategoryModel,
      eq(itemCategoryModel.id, circulationPolicyModel.itemCategoryId),
    )
    .where(eq(circulationPolicyModel.id, id))
    .limit(1);
  return row ?? null;
}

export async function resolveCirculationPolicy(
  patronCategoryId: number,
  itemCategoryId: number,
): Promise<CirculationPolicyListRow | null> {
  const [row] = await db
    .select(COLS)
    .from(circulationPolicyModel)
    .innerJoin(
      patronCategoryModel,
      eq(patronCategoryModel.id, circulationPolicyModel.patronCategoryId),
    )
    .innerJoin(
      itemCategoryModel,
      eq(itemCategoryModel.id, circulationPolicyModel.itemCategoryId),
    )
    .where(
      and(
        eq(circulationPolicyModel.patronCategoryId, patronCategoryId),
        eq(circulationPolicyModel.itemCategoryId, itemCategoryId),
        eq(circulationPolicyModel.isActive, true),
      ),
    )
    .limit(1);
  return row ?? null;
}

const validate = (input: CirculationPolicyUpsertInput) => {
  if (!input.patronCategoryId)
    throw new ApiError(400, "patronCategoryId is required.");
  if (!input.itemCategoryId)
    throw new ApiError(400, "itemCategoryId is required.");
  if (input.loanDays < 0)
    throw new ApiError(400, "loanDays must be non-negative.");
  if (input.finePerDay < 0)
    throw new ApiError(400, "finePerDay must be non-negative.");
  if (input.renewalLimit < 0)
    throw new ApiError(400, "renewalLimit must be non-negative.");
  if (input.graceDays < 0)
    throw new ApiError(400, "graceDays must be non-negative.");
  if (input.maxCopiesAtOnce < 1)
    throw new ApiError(400, "maxCopiesAtOnce must be at least 1.");
};

export async function createCirculationPolicy(
  input: CirculationPolicyUpsertInput,
): Promise<number> {
  validate(input);
  try {
    const [inserted] = await db
      .insert(circulationPolicyModel)
      .values({
        patronCategoryId: input.patronCategoryId,
        itemCategoryId: input.itemCategoryId,
        loanDays: input.loanDays,
        finePerDay: input.finePerDay,
        renewalLimit: input.renewalLimit,
        graceDays: input.graceDays,
        maxCopiesAtOnce: input.maxCopiesAtOnce,
        skipHolidaysInFine: input.skipHolidaysInFine,
        isActive: input.isActive ?? true,
      })
      .returning({ id: circulationPolicyModel.id });
    return inserted.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique") || msg.toLowerCase().includes("duplicate")) {
      throw new ApiError(
        409,
        "A policy already exists for this patron × item category combination.",
      );
    }
    throw err;
  }
}

export async function updateCirculationPolicy(
  id: number,
  input: CirculationPolicyUpsertInput,
): Promise<void> {
  validate(input);
  await db
    .update(circulationPolicyModel)
    .set({
      patronCategoryId: input.patronCategoryId,
      itemCategoryId: input.itemCategoryId,
      loanDays: input.loanDays,
      finePerDay: input.finePerDay,
      renewalLimit: input.renewalLimit,
      graceDays: input.graceDays,
      maxCopiesAtOnce: input.maxCopiesAtOnce,
      skipHolidaysInFine: input.skipHolidaysInFine,
      isActive: input.isActive ?? true,
      updatedAt: new Date(),
    })
    .where(eq(circulationPolicyModel.id, id));
}

export async function deleteCirculationPolicy(id: number): Promise<void> {
  await db
    .delete(circulationPolicyModel)
    .where(eq(circulationPolicyModel.id, id));
}
