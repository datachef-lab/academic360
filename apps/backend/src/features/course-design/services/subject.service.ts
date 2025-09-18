import { db } from "@/db/index.js";
import { subjectModel } from "@repo/db/schemas/models/course-design";
import {
  Subject,
  SubjectT,
} from "@repo/db/schemas/models/course-design/subject.model";
import { and, countDistinct, eq, ilike, ne } from "drizzle-orm";
import { SubjectDto } from "@repo/db/dtos/course-design";
import XLSX from "xlsx";
import fs from "fs";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";

// Bulk upload interface
export interface SubjectBulkUploadResult {
  success: SubjectDto[];
  errors: Array<{
    row: number;
    data: unknown[];
    error: string;
  }>;
}

export async function createSubject(data: Subject): Promise<SubjectDto> {
  const [created] = await db.insert(subjectModel).values(data).returning();

  return {
    id: created.id!,
    legacySubjectId: created.legacySubjectId,
    name: created.name,
    code: created.code,
    sequence: created.sequence,
    isActive: created.isActive,
    createdAt: created.createdAt || new Date(),
    updatedAt: created.updatedAt || new Date(),
  };
}

export async function getAllSubjects(): Promise<SubjectDto[]> {
  const results = await db
    .select({
      id: subjectModel.id,
      legacySubjectId: subjectModel.legacySubjectId,
      name: subjectModel.name,
      code: subjectModel.code,
      sequence: subjectModel.sequence,
      isActive: subjectModel.isActive,
      createdAt: subjectModel.createdAt,
      updatedAt: subjectModel.updatedAt,
    })
    .from(subjectModel)
    .orderBy(subjectModel.name);

  return results.map((result) => ({
    id: result.id!,
    legacySubjectId: result.legacySubjectId,
    name: result.name,
    code: result.code,
    sequence: result.sequence,
    isActive: result.isActive,
    createdAt: result.createdAt || new Date(),
    updatedAt: result.updatedAt || new Date(),
  }));
}

export async function getSubjectsPaginated(options: {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
}): Promise<PaginatedResponse<SubjectDto>> {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.max(1, Math.min(100, options.pageSize || 10));
  const offset = (page - 1) * pageSize;

  const filters = [] as any[];
  const q = (options.search || "").trim();
  if (q) {
    filters.push(ilike(subjectModel.name, `%${q}%`));
  }
  if (typeof options.isActive === "boolean") {
    filters.push(eq(subjectModel.isActive, options.isActive));
  }

  // Get total count
  const [{ count }] = await db
    .select({ count: countDistinct(subjectModel.id) })
    .from(subjectModel)
    .where(filters.length ? (and as any)(...filters) : undefined);

  const totalElements = Number(count);
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));

  // Get paginated results
  const results = await db
    .select({
      id: subjectModel.id,
      legacySubjectId: subjectModel.legacySubjectId,
      name: subjectModel.name,
      code: subjectModel.code,
      sequence: subjectModel.sequence,
      isActive: subjectModel.isActive,
      createdAt: subjectModel.createdAt,
      updatedAt: subjectModel.updatedAt,
    })
    .from(subjectModel)
    .where(filters.length ? (and as any)(...filters) : undefined)
    .orderBy(subjectModel.name)
    .limit(pageSize)
    .offset(offset);

  const content = results.map((result) => ({
    id: result.id!,
    legacySubjectId: result.legacySubjectId,
    name: result.name,
    code: result.code,
    sequence: result.sequence,
    isActive: result.isActive,
    createdAt: result.createdAt || new Date(),
    updatedAt: result.updatedAt || new Date(),
  }));

  return { content, page, pageSize, totalPages, totalElements };
}

export async function getSubjectById(id: number): Promise<SubjectDto | null> {
  const [result] = await db
    .select({
      id: subjectModel.id,
      legacySubjectId: subjectModel.legacySubjectId,
      name: subjectModel.name,
      code: subjectModel.code,
      sequence: subjectModel.sequence,
      isActive: subjectModel.isActive,
      createdAt: subjectModel.createdAt,
      updatedAt: subjectModel.updatedAt,
    })
    .from(subjectModel)
    .where(eq(subjectModel.id, id));

  if (!result) return null;

  return {
    id: result.id!,
    legacySubjectId: result.legacySubjectId,
    name: result.name,
    code: result.code,
    sequence: result.sequence,
    isActive: result.isActive,
    createdAt: result.createdAt || new Date(),
    updatedAt: result.updatedAt || new Date(),
  };
}

export async function getActiveSubjects(): Promise<
  Array<{ id: number; name: string; code: string | null }>
> {
  const results = await db
    .select({
      id: subjectModel.id,
      name: subjectModel.name,
      code: subjectModel.code,
    })
    .from(subjectModel)
    .where(eq(subjectModel.isActive, true))
    .orderBy(subjectModel.name);

  return results;
}

export async function updateSubject(
  id: number,
  data: Partial<Subject>,
): Promise<SubjectDto> {
  const [updated] = await db
    .update(subjectModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subjectModel.id, id))
    .returning();

  // Get related data for the updated record
  const result = await getSubjectById(updated.id);
  if (!result) {
    throw new Error("Failed to retrieve updated subject");
  }
  return result;
}

export async function deleteSubject(id: number) {
  const [deleted] = await db
    .delete(subjectModel)
    .where(eq(subjectModel.id, id))
    .returning();
  return deleted;
}

export async function bulkUploadSubjects(
  file: Express.Multer.File,
): Promise<SubjectBulkUploadResult> {
  const workbook = XLSX.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const success: SubjectDto[] = [];
  const errors: Array<{ row: number; data: unknown[]; error: string }> = [];

  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i] as any;
      const subjectData: Subject = {
        legacySubjectId: row.legacySubjectId || null,
        name: row.name,
        code: row.code || null,
        sequence: row.sequence || null,
        isActive: row.isActive !== undefined ? row.isActive : true,
      };

      const created = await createSubject(subjectData);
      success.push(created);
    } catch (error) {
      errors.push({
        row: i + 2, // +2 because Excel is 1-indexed and we skip header
        data: Object.values(data[i] as any),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Clean up file
  fs.unlinkSync(file.path);

  return { success, errors };
}
