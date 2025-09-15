import { db } from "@/db/index.js";
import { restrictedGroupingClassModel } from "@repo/db/schemas/models/subject-selection";
import {
  RestrictedGroupingClass,
  RestrictedGroupingClassT,
} from "@repo/db/schemas/models/subject-selection/restricted-grouping-class.model";
import { and, countDistinct, eq, ilike, ne } from "drizzle-orm";
import { RestrictedGroupingClassDto } from "@repo/db/dtos/subject-selection";
import { classModel } from "@repo/db/schemas/models/academics";
import XLSX from "xlsx";
import fs from "fs";

// Bulk upload interface
export interface RestrictedGroupingClassBulkUploadResult {
  success: RestrictedGroupingClassDto[];
  errors: Array<{
    row: number;
    data: unknown[];
    error: string;
  }>;
}

export async function createRestrictedGroupingClass(
  data: RestrictedGroupingClass,
): Promise<RestrictedGroupingClassDto> {
  const [created] = await db
    .insert(restrictedGroupingClassModel)
    .values(data)
    .returning();

  // Get related data for the created record
  const result = await getRestrictedGroupingClassById(created.id);
  if (!result) {
    throw new Error("Failed to retrieve created restricted grouping class");
  }
  return result;
}

export async function getAllRestrictedGroupingClasses(): Promise<
  RestrictedGroupingClassDto[]
> {
  const results = await db
    .select({
      id: restrictedGroupingClassModel.id,
      restrictedGroupingMainId:
        restrictedGroupingClassModel.restrictedGroupingMainId,
      classId: restrictedGroupingClassModel.classId,
      isActive: restrictedGroupingClassModel.isActive,
      createdAt: restrictedGroupingClassModel.createdAt,
      updatedAt: restrictedGroupingClassModel.updatedAt,
      class: {
        id: classModel.id,
        name: classModel.name,
        type: classModel.type,
        shortName: classModel.shortName,
        sequence: classModel.sequence,
        isActive: classModel.isActive,
        createdAt: classModel.createdAt,
        updatedAt: classModel.updatedAt,
      },
    })
    .from(restrictedGroupingClassModel)
    .leftJoin(
      classModel,
      eq(restrictedGroupingClassModel.classId, classModel.id),
    );

  return results.map((result) => ({
    id: result.id,
    isActive: result.isActive!,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    class: result.class!,
  }));
}

export async function getRestrictedGroupingClassById(
  id: number,
): Promise<RestrictedGroupingClassDto | null> {
  const [result] = await db
    .select({
      id: restrictedGroupingClassModel.id,
      restrictedGroupingMainId:
        restrictedGroupingClassModel.restrictedGroupingMainId,
      classId: restrictedGroupingClassModel.classId,
      isActive: restrictedGroupingClassModel.isActive,
      createdAt: restrictedGroupingClassModel.createdAt,
      updatedAt: restrictedGroupingClassModel.updatedAt,
      class: {
        id: classModel.id,
        name: classModel.name,
        type: classModel.type,
        shortName: classModel.shortName,
        sequence: classModel.sequence,
        isActive: classModel.isActive,
        createdAt: classModel.createdAt,
        updatedAt: classModel.updatedAt,
      },
    })
    .from(restrictedGroupingClassModel)
    .leftJoin(
      classModel,
      eq(restrictedGroupingClassModel.classId, classModel.id),
    )
    .where(eq(restrictedGroupingClassModel.id, id));

  if (!result) return null;

  return {
    id: result.id,
    isActive: result.isActive!,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    class: result.class!,
  };
}

export async function getRestrictedGroupingClassesByMainId(
  mainId: number,
): Promise<RestrictedGroupingClassDto[]> {
  const results = await db
    .select({
      id: restrictedGroupingClassModel.id,
      restrictedGroupingMainId:
        restrictedGroupingClassModel.restrictedGroupingMainId,
      classId: restrictedGroupingClassModel.classId,
      isActive: restrictedGroupingClassModel.isActive,
      createdAt: restrictedGroupingClassModel.createdAt,
      updatedAt: restrictedGroupingClassModel.updatedAt,
      class: {
        id: classModel.id,
        name: classModel.name,
        type: classModel.type,
        shortName: classModel.shortName,
        sequence: classModel.sequence,
        isActive: classModel.isActive,
        createdAt: classModel.createdAt,
        updatedAt: classModel.updatedAt,
      },
    })
    .from(restrictedGroupingClassModel)
    .leftJoin(
      classModel,
      eq(restrictedGroupingClassModel.classId, classModel.id),
    )
    .where(eq(restrictedGroupingClassModel.restrictedGroupingMainId, mainId));

  return results.map((result) => ({
    id: result.id,
    isActive: result.isActive!,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    class: result.class!,
  }));
}

export async function updateRestrictedGroupingClass(
  id: number,
  data: Partial<RestrictedGroupingClass>,
): Promise<RestrictedGroupingClassDto> {
  const [updated] = await db
    .update(restrictedGroupingClassModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(restrictedGroupingClassModel.id, id))
    .returning();

  // Get related data for the updated record
  const result = await getRestrictedGroupingClassById(updated.id);
  if (!result) {
    throw new Error("Failed to retrieve updated restricted grouping class");
  }
  return result;
}

export async function deleteRestrictedGroupingClass(id: number) {
  const [deleted] = await db
    .delete(restrictedGroupingClassModel)
    .where(eq(restrictedGroupingClassModel.id, id))
    .returning();
  return deleted;
}

export async function bulkUploadRestrictedGroupingClasses(
  file: Express.Multer.File,
): Promise<RestrictedGroupingClassBulkUploadResult> {
  const workbook = XLSX.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const success: RestrictedGroupingClassDto[] = [];
  const errors: Array<{ row: number; data: unknown[]; error: string }> = [];

  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i] as any;
      const restrictedGroupingClassData: RestrictedGroupingClass = {
        restrictedGroupingMainId: row.restrictedGroupingMainId,
        classId: row.classId,
        isActive: row.isActive !== undefined ? row.isActive : true,
      };

      const created = await createRestrictedGroupingClass(
        restrictedGroupingClassData,
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
