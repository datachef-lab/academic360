import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, ilike, SQL } from "drizzle-orm";
import { readingListModel } from "@repo/db/schemas/models/library/reading-list.model.js";
import { readingListItemModel } from "@repo/db/schemas/models/library/reading-list-item.model.js";
import { programCourseModel } from "@repo/db/schemas/models/course-design/program-course.model.js";
import { classModel } from "@repo/db/schemas/models/academics/class.model.js";

export type ReadingListRow = {
  id: number;
  programCourseId: number;
  programCourseName: string | null;
  classId: number | null;
  className: string | null;
  facultyUserId: number | null;
  title: string;
  description: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ReadingListUpsertInput = {
  programCourseId: number;
  classId?: number | null;
  facultyUserId?: number | null;
  title: string;
  description?: string | null;
  isPublished?: boolean;
};

export type ReadingListItemUpsertInput = {
  readingListId: number;
  itemType: "BOOK" | "JOURNAL" | "EXTERNAL_URL";
  bookId?: number | null;
  journalId?: number | null;
  externalUrl?: string | null;
  externalTitle?: string | null;
  notes?: string | null;
  displayOrder?: number;
};

const COLS = {
  id: readingListModel.id,
  programCourseId: readingListModel.programCourseId,
  programCourseName: programCourseModel.name,
  classId: readingListModel.classId,
  className: classModel.name,
  facultyUserId: readingListModel.facultyUserId,
  title: readingListModel.title,
  description: readingListModel.description,
  isPublished: readingListModel.isPublished,
  createdAt: readingListModel.createdAt,
  updatedAt: readingListModel.updatedAt,
};

const buildWhere = (f: {
  search?: string;
  programCourseId?: number;
  classId?: number;
  isPublished?: boolean;
}): SQL | undefined => {
  const parts: SQL[] = [];
  if (f.search?.trim())
    parts.push(ilike(readingListModel.title, `%${f.search.trim()}%`));
  if (f.programCourseId != null)
    parts.push(eq(readingListModel.programCourseId, f.programCourseId));
  if (f.classId != null) parts.push(eq(readingListModel.classId, f.classId));
  if (f.isPublished != null)
    parts.push(eq(readingListModel.isPublished, f.isPublished));
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findReadingListsPaginated(filters: {
  page: number;
  limit: number;
  search?: string;
  programCourseId?: number;
  classId?: number;
  isPublished?: boolean;
}) {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildWhere(rest);
  const [{ total }] = await db
    .select({ total: count() })
    .from(readingListModel)
    .where(whereClause);
  const rows = await db
    .select(COLS)
    .from(readingListModel)
    .innerJoin(
      programCourseModel,
      eq(programCourseModel.id, readingListModel.programCourseId),
    )
    .leftJoin(classModel, eq(classModel.id, readingListModel.classId))
    .where(whereClause)
    .orderBy(desc(readingListModel.id))
    .limit(limit)
    .offset(offset);
  return { rows, total, page, limit };
}

export async function getReadingListById(id: number) {
  const [row] = await db
    .select(COLS)
    .from(readingListModel)
    .innerJoin(
      programCourseModel,
      eq(programCourseModel.id, readingListModel.programCourseId),
    )
    .leftJoin(classModel, eq(classModel.id, readingListModel.classId))
    .where(eq(readingListModel.id, id))
    .limit(1);
  return row ?? null;
}

const normalize = (i: ReadingListUpsertInput) => {
  if (!i.programCourseId)
    throw new ApiError(400, "programCourseId is required.");
  if (!i.title?.trim()) throw new ApiError(400, "title is required.");
  return {
    programCourseId: i.programCourseId,
    classId: i.classId ?? null,
    facultyUserId: i.facultyUserId ?? null,
    title: i.title.trim(),
    description: i.description?.trim() || null,
    isPublished: i.isPublished ?? false,
  };
};

export async function createReadingList(input: ReadingListUpsertInput) {
  const [r] = await db
    .insert(readingListModel)
    .values(normalize(input))
    .returning({ id: readingListModel.id });
  return r.id;
}

export async function updateReadingList(
  id: number,
  input: ReadingListUpsertInput,
) {
  await db
    .update(readingListModel)
    .set({ ...normalize(input), updatedAt: new Date() })
    .where(eq(readingListModel.id, id));
}

export async function deleteReadingList(id: number) {
  await db.transaction(async (tx) => {
    await tx
      .delete(readingListItemModel)
      .where(eq(readingListItemModel.readingListId, id));
    await tx.delete(readingListModel).where(eq(readingListModel.id, id));
  });
}

export async function listItemsForList(readingListId: number) {
  return db
    .select({
      id: readingListItemModel.id,
      readingListId: readingListItemModel.readingListId,
      itemType: readingListItemModel.itemType,
      bookId: readingListItemModel.bookId,
      journalId: readingListItemModel.journalId,
      externalUrl: readingListItemModel.externalUrl,
      externalTitle: readingListItemModel.externalTitle,
      notes: readingListItemModel.notes,
      displayOrder: readingListItemModel.displayOrder,
    })
    .from(readingListItemModel)
    .where(eq(readingListItemModel.readingListId, readingListId))
    .orderBy(readingListItemModel.displayOrder, readingListItemModel.id);
}

export async function createReadingListItem(input: ReadingListItemUpsertInput) {
  if (!input.readingListId)
    throw new ApiError(400, "readingListId is required.");
  if (!["BOOK", "JOURNAL", "EXTERNAL_URL"].includes(input.itemType)) {
    throw new ApiError(400, "Invalid itemType.");
  }
  if (input.itemType === "BOOK" && !input.bookId) {
    throw new ApiError(400, "bookId is required for BOOK items.");
  }
  if (input.itemType === "JOURNAL" && !input.journalId) {
    throw new ApiError(400, "journalId is required for JOURNAL items.");
  }
  if (input.itemType === "EXTERNAL_URL" && !input.externalUrl) {
    throw new ApiError(400, "externalUrl is required for EXTERNAL_URL items.");
  }
  const [r] = await db
    .insert(readingListItemModel)
    .values({
      readingListId: input.readingListId,
      itemType: input.itemType,
      bookId: input.bookId ?? null,
      journalId: input.journalId ?? null,
      externalUrl: input.externalUrl?.trim() || null,
      externalTitle: input.externalTitle?.trim() || null,
      notes: input.notes?.trim() || null,
      displayOrder: input.displayOrder ?? 0,
    })
    .returning({ id: readingListItemModel.id });
  return r.id;
}

export async function deleteReadingListItem(id: number) {
  await db.delete(readingListItemModel).where(eq(readingListItemModel.id, id));
}
