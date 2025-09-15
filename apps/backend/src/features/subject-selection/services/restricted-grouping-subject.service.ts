import { db } from "@/db/index.js";
import { restrictedGroupingSubjectModel } from "@repo/db/schemas/models/subject-selection";
import {
  RestrictedGroupingSubject,
  RestrictedGroupingSubjectT,
} from "@repo/db/schemas/models/subject-selection/restricted-grouping-subject.model";
import { and, countDistinct, eq, ilike, ne } from "drizzle-orm";
import { RestrictedGroupingSubjectDto } from "@repo/db/dtos/subject-selection";
import { subjectModel } from "@repo/db/schemas/models/course-design";
import XLSX from "xlsx";
import fs from "fs";

// Bulk upload interface
export interface RestrictedGroupingSubjectBulkUploadResult {
  success: RestrictedGroupingSubjectDto[];
  errors: Array<{
    row: number;
    data: unknown[];
    error: string;
  }>;
}

export async function createRestrictedGroupingSubject(
  data: RestrictedGroupingSubject,
): Promise<RestrictedGroupingSubjectDto> {
  const [created] = await db
    .insert(restrictedGroupingSubjectModel)
    .values(data)
    .returning();

  // Get related data for the created record
  const result = await getRestrictedGroupingSubjectById(created.id);
  if (!result) {
    throw new Error("Failed to retrieve created restricted grouping subject");
  }
  return result;
}

export async function getAllRestrictedGroupingSubjects(): Promise<
  RestrictedGroupingSubjectDto[]
> {
  const results = await db
    .select({
      id: restrictedGroupingSubjectModel.id,
      restrictedGroupingMainId:
        restrictedGroupingSubjectModel.restrictedGroupingMainId,
      cannotCombineWithSubjectId:
        restrictedGroupingSubjectModel.cannotCombineWithSubjectId,
      createdAt: restrictedGroupingSubjectModel.createdAt,
      updatedAt: restrictedGroupingSubjectModel.updatedAt,
      cannotCombineWithSubject: {
        id: subjectModel.id,
        name: subjectModel.name,
        code: subjectModel.code,
        isActive: subjectModel.isActive,
      },
    })
    .from(restrictedGroupingSubjectModel)
    .leftJoin(
      subjectModel,
      eq(
        restrictedGroupingSubjectModel.cannotCombineWithSubjectId,
        subjectModel.id,
      ),
    );

  return results.map((result) => ({
    id: result.id,
    restrictedGroupingMainId: result.restrictedGroupingMainId,
    cannotCombineWithSubject: result.cannotCombineWithSubject || {
      id: 0,
      name: "Unknown Subject",
      code: null,
      isActive: null,
    },
  }));
}

export async function getRestrictedGroupingSubjectById(
  id: number,
): Promise<RestrictedGroupingSubjectDto | null> {
  const [result] = await db
    .select({
      id: restrictedGroupingSubjectModel.id,
      restrictedGroupingMainId:
        restrictedGroupingSubjectModel.restrictedGroupingMainId,
      cannotCombineWithSubjectId:
        restrictedGroupingSubjectModel.cannotCombineWithSubjectId,
      createdAt: restrictedGroupingSubjectModel.createdAt,
      updatedAt: restrictedGroupingSubjectModel.updatedAt,
      cannotCombineWithSubject: {
        id: subjectModel.id,
        name: subjectModel.name,
        code: subjectModel.code,
        isActive: subjectModel.isActive,
      },
    })
    .from(restrictedGroupingSubjectModel)
    .leftJoin(
      subjectModel,
      eq(
        restrictedGroupingSubjectModel.cannotCombineWithSubjectId,
        subjectModel.id,
      ),
    )
    .where(eq(restrictedGroupingSubjectModel.id, id));

  if (!result) return null;

  return {
    id: result.id,
    restrictedGroupingMainId: result.restrictedGroupingMainId,
    cannotCombineWithSubject: result.cannotCombineWithSubject || {
      id: 0,
      name: "Unknown Subject",
      code: null,
      isActive: null,
    },
  };
}

export async function getRestrictedGroupingSubjectsByMainId(
  mainId: number,
): Promise<RestrictedGroupingSubjectDto[]> {
  const results = await db
    .select({
      id: restrictedGroupingSubjectModel.id,
      restrictedGroupingMainId:
        restrictedGroupingSubjectModel.restrictedGroupingMainId,
      cannotCombineWithSubjectId:
        restrictedGroupingSubjectModel.cannotCombineWithSubjectId,
      createdAt: restrictedGroupingSubjectModel.createdAt,
      updatedAt: restrictedGroupingSubjectModel.updatedAt,
      cannotCombineWithSubject: {
        id: subjectModel.id,
        name: subjectModel.name,
        code: subjectModel.code,
        isActive: subjectModel.isActive,
      },
    })
    .from(restrictedGroupingSubjectModel)
    .leftJoin(
      subjectModel,
      eq(
        restrictedGroupingSubjectModel.cannotCombineWithSubjectId,
        subjectModel.id,
      ),
    )
    .where(eq(restrictedGroupingSubjectModel.restrictedGroupingMainId, mainId));

  return results.map((result) => ({
    id: result.id,
    restrictedGroupingMainId: result.restrictedGroupingMainId,
    cannotCombineWithSubject: result.cannotCombineWithSubject || {
      id: 0,
      name: "Unknown Subject",
      code: null,
      isActive: null,
    },
  }));
}

export async function updateRestrictedGroupingSubject(
  id: number,
  data: Partial<RestrictedGroupingSubject>,
): Promise<RestrictedGroupingSubjectDto> {
  const [updated] = await db
    .update(restrictedGroupingSubjectModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(restrictedGroupingSubjectModel.id, id))
    .returning();

  // Get related data for the updated record
  const result = await getRestrictedGroupingSubjectById(updated.id);
  if (!result) {
    throw new Error("Failed to retrieve updated restricted grouping subject");
  }
  return result;
}

export async function deleteRestrictedGroupingSubject(id: number) {
  const [deleted] = await db
    .delete(restrictedGroupingSubjectModel)
    .where(eq(restrictedGroupingSubjectModel.id, id))
    .returning();
  return deleted;
}

export async function bulkUploadRestrictedGroupingSubjects(
  file: Express.Multer.File,
): Promise<RestrictedGroupingSubjectBulkUploadResult> {
  const workbook = XLSX.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const success: RestrictedGroupingSubjectDto[] = [];
  const errors: Array<{ row: number; data: unknown[]; error: string }> = [];

  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i] as any;
      const restrictedGroupingSubjectData: RestrictedGroupingSubject = {
        restrictedGroupingMainId: row.restrictedGroupingMainId,
        cannotCombineWithSubjectId: row.cannotCombineWithSubjectId,
      };

      const created = await createRestrictedGroupingSubject(
        restrictedGroupingSubjectData,
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
