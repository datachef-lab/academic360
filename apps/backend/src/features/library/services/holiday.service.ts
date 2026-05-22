import { db } from "@/db/index.js";
import { Holiday, holidayModel } from "@repo/db/schemas";
import { and, count, desc, eq, ilike, ne } from "drizzle-orm";

type HolidayListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type HolidayListResult = {
  rows: Holiday[];
  total: number;
  page: number;
  limit: number;
};

export async function findHolidayById(id: number): Promise<Holiday | null> {
  const [holiday] = await db
    .select()
    .from(holidayModel)
    .where(eq(holidayModel.id, id));

  return holiday ?? null;
}

export async function findHolidayByName(
  name: string,
  excludeId?: number,
): Promise<Holiday | null> {
  const whereClause =
    excludeId !== undefined
      ? and(
          ilike(holidayModel.name, name.trim()),
          ne(holidayModel.id, excludeId),
        )
      : ilike(holidayModel.name, name.trim());

  const [holiday] = await db.select().from(holidayModel).where(whereClause);
  return holiday ?? null;
}

export async function findHolidaysPaginated(
  filters: HolidayListFilters,
): Promise<HolidayListResult> {
  const { page, limit, search } = filters;
  const offset = (page - 1) * limit;
  const whereClause =
    search && search.trim()
      ? ilike(holidayModel.name, `%${search.trim()}%`)
      : undefined;

  const rows = await db
    .select()
    .from(holidayModel)
    .where(whereClause)
    .orderBy(desc(holidayModel.id))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(holidayModel)
    .where(whereClause);

  return {
    rows,
    total,
    page,
    limit,
  };
}

export async function createHoliday(
  data: Omit<Holiday, "id">,
): Promise<Holiday> {
  const [created] = await db.insert(holidayModel).values(data).returning();
  return created;
}

export async function updateHoliday(
  id: number,
  data: Partial<Omit<Holiday, "id">>,
): Promise<Holiday | null> {
  const [updated] = await db
    .update(holidayModel)
    .set(data)
    .where(eq(holidayModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteHoliday(id: number): Promise<Holiday | null> {
  const [deleted] = await db
    .delete(holidayModel)
    .where(eq(holidayModel.id, id))
    .returning();

  return deleted ?? null;
}
