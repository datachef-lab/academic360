import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, ilike, SQL } from "drizzle-orm";
import { academicArchiveModel } from "@repo/db/schemas/models/library/academic-archive.model.js";
import { programCourseModel } from "@repo/db/schemas/models/course-design/program-course.model.js";
import { classModel } from "@repo/db/schemas/models/academics/class.model.js";

export type AcademicArchiveRow = {
  id: number;
  archiveType: string;
  title: string;
  description: string | null;
  programCourseId: number | null;
  programCourseName: string | null;
  classId: number | null;
  className: string | null;
  year: number | null;
  fileKey: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  tags: string | null;
  uploadedByUserId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AcademicArchiveUpsertInput = {
  archiveType: string;
  title: string;
  description?: string | null;
  programCourseId?: number | null;
  classId?: number | null;
  year?: number | null;
  fileKey: string;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  tags?: string | null;
  uploadedByUserId?: number | null;
};

const COLS = {
  id: academicArchiveModel.id,
  archiveType: academicArchiveModel.archiveType,
  title: academicArchiveModel.title,
  description: academicArchiveModel.description,
  programCourseId: academicArchiveModel.programCourseId,
  programCourseName: programCourseModel.name,
  classId: academicArchiveModel.classId,
  className: classModel.name,
  year: academicArchiveModel.year,
  fileKey: academicArchiveModel.fileKey,
  mimeType: academicArchiveModel.mimeType,
  fileSizeBytes: academicArchiveModel.fileSizeBytes,
  tags: academicArchiveModel.tags,
  uploadedByUserId: academicArchiveModel.uploadedByUserId,
  createdAt: academicArchiveModel.createdAt,
  updatedAt: academicArchiveModel.updatedAt,
};

const buildWhere = (f: {
  search?: string;
  archiveType?: string;
  programCourseId?: number;
  classId?: number;
  year?: number;
}): SQL | undefined => {
  const parts: SQL[] = [];
  if (f.search?.trim())
    parts.push(ilike(academicArchiveModel.title, `%${f.search.trim()}%`));
  if (f.archiveType?.trim())
    parts.push(eq(academicArchiveModel.archiveType, f.archiveType.trim()));
  if (f.programCourseId != null)
    parts.push(eq(academicArchiveModel.programCourseId, f.programCourseId));
  if (f.classId != null)
    parts.push(eq(academicArchiveModel.classId, f.classId));
  if (f.year != null) parts.push(eq(academicArchiveModel.year, f.year));
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findArchivesPaginated(filters: {
  page: number;
  limit: number;
  search?: string;
  archiveType?: string;
  programCourseId?: number;
  classId?: number;
  year?: number;
}) {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildWhere(rest);
  const [{ total }] = await db
    .select({ total: count() })
    .from(academicArchiveModel)
    .where(whereClause);
  const rows = await db
    .select(COLS)
    .from(academicArchiveModel)
    .leftJoin(
      programCourseModel,
      eq(programCourseModel.id, academicArchiveModel.programCourseId),
    )
    .leftJoin(classModel, eq(classModel.id, academicArchiveModel.classId))
    .where(whereClause)
    .orderBy(desc(academicArchiveModel.id))
    .limit(limit)
    .offset(offset);
  return { rows, total, page, limit };
}

export async function getArchiveById(id: number) {
  const [row] = await db
    .select(COLS)
    .from(academicArchiveModel)
    .leftJoin(
      programCourseModel,
      eq(programCourseModel.id, academicArchiveModel.programCourseId),
    )
    .leftJoin(classModel, eq(classModel.id, academicArchiveModel.classId))
    .where(eq(academicArchiveModel.id, id))
    .limit(1);
  return row ?? null;
}

const normalize = (i: AcademicArchiveUpsertInput) => {
  if (!i.archiveType?.trim())
    throw new ApiError(400, "archiveType is required.");
  if (!i.title?.trim()) throw new ApiError(400, "title is required.");
  if (!i.fileKey?.trim()) throw new ApiError(400, "fileKey is required.");
  return {
    archiveType: i.archiveType.trim(),
    title: i.title.trim(),
    description: i.description?.trim() || null,
    programCourseId: i.programCourseId ?? null,
    classId: i.classId ?? null,
    year: i.year ?? null,
    fileKey: i.fileKey.trim(),
    mimeType: i.mimeType?.trim() || null,
    fileSizeBytes: i.fileSizeBytes ?? null,
    tags: i.tags?.trim() || null,
    uploadedByUserId: i.uploadedByUserId ?? null,
  };
};

export async function createArchive(input: AcademicArchiveUpsertInput) {
  const [r] = await db
    .insert(academicArchiveModel)
    .values(normalize(input))
    .returning({ id: academicArchiveModel.id });
  return r.id;
}

export async function updateArchive(
  id: number,
  input: AcademicArchiveUpsertInput,
) {
  await db
    .update(academicArchiveModel)
    .set({ ...normalize(input), updatedAt: new Date() })
    .where(eq(academicArchiveModel.id, id));
}

export async function deleteArchive(id: number) {
  await db.delete(academicArchiveModel).where(eq(academicArchiveModel.id, id));
}
