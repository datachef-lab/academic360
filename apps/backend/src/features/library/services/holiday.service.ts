import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, gte, ilike, lte, or, SQL } from "drizzle-orm";
import { holidayModel } from "@repo/db/schemas/models/library/holiday.model.js";
import { classHolidayModel } from "@repo/db/schemas/models/library/class-holiday.model.js";

export type HolidayListFilters = {
  page: number;
  limit: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
};

export type HolidayListRow = {
  id: number;
  legacyHolidayId: number | null;
  name: string;
  shortName: string | null;
  from: string;
  to: string;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type HolidayListResult = {
  rows: HolidayListRow[];
  total: number;
  page: number;
  limit: number;
};

export type HolidayUpsertInput = {
  name: string;
  shortName?: string | null;
  from: string;
  to: string;
  remarks?: string | null;
};

const buildListWhere = (
  filters: Omit<HolidayListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    const orPart = or(
      ilike(holidayModel.name, term),
      ilike(holidayModel.shortName, term),
    );
    if (orPart) parts.push(orPart);
  }
  if (filters.fromDate) {
    parts.push(gte(holidayModel.from, filters.fromDate));
  }
  if (filters.toDate) {
    parts.push(lte(holidayModel.to, filters.toDate));
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

const HOLIDAY_LIST_COLUMNS = {
  id: holidayModel.id,
  legacyHolidayId: holidayModel.legacyHolidayId,
  name: holidayModel.name,
  shortName: holidayModel.shortName,
  from: holidayModel.from,
  to: holidayModel.to,
  remarks: holidayModel.remarks,
  createdAt: holidayModel.createdAt,
  updatedAt: holidayModel.updatedAt,
};

export async function findHolidaysPaginated(
  filters: HolidayListFilters,
): Promise<HolidayListResult> {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);

  const [{ total }] = await db
    .select({ total: count() })
    .from(holidayModel)
    .where(whereClause);

  const rows = await db
    .select(HOLIDAY_LIST_COLUMNS)
    .from(holidayModel)
    .where(whereClause)
    .orderBy(desc(holidayModel.from))
    .limit(limit)
    .offset(offset);

  return { rows, total, page, limit };
}

export async function getHolidayById(
  id: number,
): Promise<HolidayListRow | null> {
  const [row] = await db
    .select(HOLIDAY_LIST_COLUMNS)
    .from(holidayModel)
    .where(eq(holidayModel.id, id))
    .limit(1);
  return row ?? null;
}

const normalizeUpsert = (input: HolidayUpsertInput) => {
  if (new Date(input.from) > new Date(input.to)) {
    throw new ApiError(400, "Holiday 'from' date cannot be after 'to' date.");
  }
  return {
    name: input.name.trim(),
    shortName: input.shortName?.trim() ? input.shortName.trim() : null,
    from: input.from,
    to: input.to,
    remarks: input.remarks?.trim() ? input.remarks.trim() : null,
  };
};

export async function createHoliday(
  input: HolidayUpsertInput,
): Promise<number> {
  const [inserted] = await db
    .insert(holidayModel)
    .values(normalizeUpsert(input))
    .returning({ id: holidayModel.id });
  return inserted.id;
}

export async function updateHoliday(
  id: number,
  input: HolidayUpsertInput,
): Promise<void> {
  await db
    .update(holidayModel)
    .set({ ...normalizeUpsert(input), updatedAt: new Date() })
    .where(eq(holidayModel.id, id));
}

export async function deleteHoliday(id: number): Promise<void> {
  const [{ linkedCount }] = await db
    .select({ linkedCount: count() })
    .from(classHolidayModel)
    .where(eq(classHolidayModel.holidayId, id));

  if ((linkedCount ?? 0) > 0) {
    throw new ApiError(
      409,
      `This holiday cannot be deleted because it is linked to ${linkedCount} class holiday record(s).`,
    );
  }

  await db.delete(holidayModel).where(eq(holidayModel.id, id));
}
