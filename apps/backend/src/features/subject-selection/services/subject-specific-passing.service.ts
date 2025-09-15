import { db } from "@/db/index.js";
import { subjectSpecificPassingModel } from "@repo/db/schemas/models/subject-selection";
import {
  SubjectSpecificPassing,
  SubjectSpecificPassingT,
} from "@repo/db/schemas/models/subject-selection/subject-specific-passing.model";
import { and, countDistinct, eq, ilike, ne } from "drizzle-orm";
import { subjectModel } from "@repo/db/schemas/models/course-design";
import XLSX from "xlsx";
import fs from "fs";

// Define DTO for subject specific passing
export interface SubjectSpecificPassingDto {
  id: number;
  subjectId: number;
  passingPercentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  subject: {
    id: number;
    name: string | null;
    code: string | null;
    isActive: boolean | null;
  };
}

// Bulk upload interface
export interface SubjectSpecificPassingBulkUploadResult {
  success: SubjectSpecificPassingDto[];
  errors: Array<{
    row: number;
    data: unknown[];
    error: string;
  }>;
}

export async function createSubjectSpecificPassing(
  data: SubjectSpecificPassing,
): Promise<SubjectSpecificPassingDto> {
  const [created] = await db
    .insert(subjectSpecificPassingModel)
    .values(data)
    .returning();

  // Get related data for the created record
  const result = await getSubjectSpecificPassingById(created.id);
  if (!result) {
    throw new Error("Failed to retrieve created subject specific passing");
  }
  return result;
}

export async function getAllSubjectSpecificPassings(): Promise<
  SubjectSpecificPassingDto[]
> {
  const results = await db
    .select({
      id: subjectSpecificPassingModel.id,
      subjectId: subjectSpecificPassingModel.subjectId,
      passingPercentage: subjectSpecificPassingModel.passingPercentage,
      isActive: subjectSpecificPassingModel.isActive,
      createdAt: subjectSpecificPassingModel.createdAt,
      updatedAt: subjectSpecificPassingModel.updatedAt,
      subject: {
        id: subjectModel.id,
        name: subjectModel.name,
        code: subjectModel.code,
        isActive: subjectModel.isActive,
      },
    })
    .from(subjectSpecificPassingModel)
    .leftJoin(
      subjectModel,
      eq(subjectSpecificPassingModel.subjectId, subjectModel.id),
    );

  return results.map((result) => ({
    id: result.id,
    subjectId: result.subjectId!,
    passingPercentage: result.passingPercentage!,
    isActive: result.isActive!,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    subject: result.subject!,
  }));
}

export async function getSubjectSpecificPassingById(
  id: number,
): Promise<SubjectSpecificPassingDto | null> {
  const [result] = await db
    .select({
      id: subjectSpecificPassingModel.id,
      subjectId: subjectSpecificPassingModel.subjectId,
      passingPercentage: subjectSpecificPassingModel.passingPercentage,
      isActive: subjectSpecificPassingModel.isActive,
      createdAt: subjectSpecificPassingModel.createdAt,
      updatedAt: subjectSpecificPassingModel.updatedAt,
      subject: {
        id: subjectModel.id,
        name: subjectModel.name,
        code: subjectModel.code,
        isActive: subjectModel.isActive,
      },
    })
    .from(subjectSpecificPassingModel)
    .leftJoin(
      subjectModel,
      eq(subjectSpecificPassingModel.subjectId, subjectModel.id),
    )
    .where(eq(subjectSpecificPassingModel.id, id));

  if (!result) return null;

  return {
    id: result.id,
    subjectId: result.subjectId!,
    passingPercentage: result.passingPercentage!,
    isActive: result.isActive!,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    subject: result.subject!,
  };
}

export async function getSubjectSpecificPassingBySubjectId(
  subjectId: number,
): Promise<SubjectSpecificPassingDto | null> {
  const [result] = await db
    .select({
      id: subjectSpecificPassingModel.id,
      subjectId: subjectSpecificPassingModel.subjectId,
      passingPercentage: subjectSpecificPassingModel.passingPercentage,
      isActive: subjectSpecificPassingModel.isActive,
      createdAt: subjectSpecificPassingModel.createdAt,
      updatedAt: subjectSpecificPassingModel.updatedAt,
      subject: {
        id: subjectModel.id,
        name: subjectModel.name,
        code: subjectModel.code,
        isActive: subjectModel.isActive,
      },
    })
    .from(subjectSpecificPassingModel)
    .leftJoin(
      subjectModel,
      eq(subjectSpecificPassingModel.subjectId, subjectModel.id),
    )
    .where(eq(subjectSpecificPassingModel.subjectId, subjectId));

  if (!result) return null;

  return {
    id: result.id,
    subjectId: result.subjectId!,
    passingPercentage: result.passingPercentage!,
    isActive: result.isActive!,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    subject: result.subject!,
  };
}

export async function updateSubjectSpecificPassing(
  id: number,
  data: Partial<SubjectSpecificPassing>,
): Promise<SubjectSpecificPassingDto> {
  const [updated] = await db
    .update(subjectSpecificPassingModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subjectSpecificPassingModel.id, id))
    .returning();

  // Get related data for the updated record
  const result = await getSubjectSpecificPassingById(updated.id);
  if (!result) {
    throw new Error("Failed to retrieve updated subject specific passing");
  }
  return result;
}

export async function deleteSubjectSpecificPassing(id: number) {
  const [deleted] = await db
    .delete(subjectSpecificPassingModel)
    .where(eq(subjectSpecificPassingModel.id, id))
    .returning();
  return deleted;
}

export async function bulkUploadSubjectSpecificPassings(
  file: Express.Multer.File,
): Promise<SubjectSpecificPassingBulkUploadResult> {
  const workbook = XLSX.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const success: SubjectSpecificPassingDto[] = [];
  const errors: Array<{ row: number; data: unknown[]; error: string }> = [];

  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i] as any;
      const subjectSpecificPassingData: SubjectSpecificPassing = {
        subjectId: row.subjectId,
        passingPercentage: row.passingPercentage,
        isActive: row.isActive !== undefined ? row.isActive : true,
      };

      const created = await createSubjectSpecificPassing(
        subjectSpecificPassingData,
      );
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
