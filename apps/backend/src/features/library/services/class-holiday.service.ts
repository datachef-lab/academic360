import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, SQL } from "drizzle-orm";
import { classHolidayModel } from "@repo/db/schemas/models/library/class-holiday.model.js";
import { holidayModel } from "@repo/db/schemas/models/library/holiday.model.js";
import { programCourseModel } from "@repo/db/schemas/models/course-design/program-course.model.js";
import { classModel } from "@repo/db/schemas/models/academics/class.model.js";

export type ClassHolidayListFilters = {
  page: number;
  limit: number;
  holidayId?: number;
  programCourseId?: number;
  classId?: number;
};

export type ClassHolidayListRow = {
  id: number;
  legacyHolidayStudentMappingId: number | null;
  holidayId: number;
  holidayName: string;
  holidayFrom: string;
  holidayTo: string;
  programCourseId: number;
  programCourseName: string | null;
  classId: number;
  className: string;
  isHoliday: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ClassHolidayListResult = {
  rows: ClassHolidayListRow[];
  total: number;
  page: number;
  limit: number;
};

export type ClassHolidayUpsertInput = {
  holidayId: number;
  programCourseId: number;
  classId: number;
  isHoliday: boolean;
};

const buildListWhere = (
  filters: Omit<ClassHolidayListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.holidayId != null) {
    parts.push(eq(classHolidayModel.holidayId, filters.holidayId));
  }
  if (filters.programCourseId != null) {
    parts.push(eq(classHolidayModel.programCourseId, filters.programCourseId));
  }
  if (filters.classId != null) {
    parts.push(eq(classHolidayModel.classId, filters.classId));
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

const CLASS_HOLIDAY_LIST_COLUMNS = {
  id: classHolidayModel.id,
  legacyHolidayStudentMappingId:
    classHolidayModel.legacyHolidayStudentMappingId,
  holidayId: classHolidayModel.holidayId,
  holidayName: holidayModel.name,
  holidayFrom: holidayModel.from,
  holidayTo: holidayModel.to,
  programCourseId: classHolidayModel.programCourseId,
  programCourseName: programCourseModel.name,
  classId: classHolidayModel.classId,
  className: classModel.name,
  isHoliday: classHolidayModel.isHoliday,
  createdAt: classHolidayModel.createdAt,
  updatedAt: classHolidayModel.updatedAt,
};

export async function findClassHolidaysPaginated(
  filters: ClassHolidayListFilters,
): Promise<ClassHolidayListResult> {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);

  const [{ total }] = await db
    .select({ total: count() })
    .from(classHolidayModel)
    .where(whereClause);

  const rows = await db
    .select(CLASS_HOLIDAY_LIST_COLUMNS)
    .from(classHolidayModel)
    .innerJoin(holidayModel, eq(holidayModel.id, classHolidayModel.holidayId))
    .innerJoin(
      programCourseModel,
      eq(programCourseModel.id, classHolidayModel.programCourseId),
    )
    .innerJoin(classModel, eq(classModel.id, classHolidayModel.classId))
    .where(whereClause)
    .orderBy(desc(classHolidayModel.id))
    .limit(limit)
    .offset(offset);

  return { rows, total, page, limit };
}

export async function getClassHolidayById(
  id: number,
): Promise<ClassHolidayListRow | null> {
  const [row] = await db
    .select(CLASS_HOLIDAY_LIST_COLUMNS)
    .from(classHolidayModel)
    .innerJoin(holidayModel, eq(holidayModel.id, classHolidayModel.holidayId))
    .innerJoin(
      programCourseModel,
      eq(programCourseModel.id, classHolidayModel.programCourseId),
    )
    .innerJoin(classModel, eq(classModel.id, classHolidayModel.classId))
    .where(eq(classHolidayModel.id, id))
    .limit(1);
  return row ?? null;
}

export async function createClassHoliday(
  input: ClassHolidayUpsertInput,
): Promise<number> {
  const [inserted] = await db
    .insert(classHolidayModel)
    .values({
      holidayId: input.holidayId,
      programCourseId: input.programCourseId,
      classId: input.classId,
      isHoliday: input.isHoliday,
    })
    .returning({ id: classHolidayModel.id });
  return inserted.id;
}

export async function updateClassHoliday(
  id: number,
  input: ClassHolidayUpsertInput,
): Promise<void> {
  await db
    .update(classHolidayModel)
    .set({
      holidayId: input.holidayId,
      programCourseId: input.programCourseId,
      classId: input.classId,
      isHoliday: input.isHoliday,
      updatedAt: new Date(),
    })
    .where(eq(classHolidayModel.id, id));
}

export async function deleteClassHoliday(id: number): Promise<void> {
  await db.delete(classHolidayModel).where(eq(classHolidayModel.id, id));
}
