import { db } from "@/db/index.js";
import { ClassHoliday, classHolidayModel } from "@repo/db/schemas";
import { and, count, desc, eq } from "drizzle-orm";

type ClassHolidayListFilters = {
  page: number;
  limit: number;
};

export type ClassHolidayListResult = {
  rows: ClassHoliday[];
  total: number;
  page: number;
  limit: number;
};

export async function findClassHolidayById(
  id: number,
): Promise<ClassHoliday | null> {
  const [classHoliday] = await db
    .select()
    .from(classHolidayModel)
    .where(eq(classHolidayModel.id, id));

  return classHoliday ?? null;
}

export async function findClassHolidaysPaginated(
  filters: ClassHolidayListFilters,
): Promise<ClassHolidayListResult> {
  const { page, limit } = filters;
  const offset = (page - 1) * limit;

  const rows = await db
    .select()
    .from(classHolidayModel)
    .orderBy(desc(classHolidayModel.id))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(classHolidayModel);

  return {
    rows,
    total,
    page,
    limit,
  };
}

export async function createClassHoliday(
  data: Omit<ClassHoliday, "id">,
): Promise<ClassHoliday> {
  const [created] = await db.insert(classHolidayModel).values(data).returning();
  return created;
}

export async function updateClassHoliday(
  id: number,
  data: Partial<Omit<ClassHoliday, "id">>,
): Promise<ClassHoliday | null> {
  const [updated] = await db
    .update(classHolidayModel)
    .set(data)
    .where(eq(classHolidayModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteClassHoliday(
  id: number,
): Promise<ClassHoliday | null> {
  const [deleted] = await db
    .delete(classHolidayModel)
    .where(eq(classHolidayModel.id, id))
    .returning();

  return deleted ?? null;
}
