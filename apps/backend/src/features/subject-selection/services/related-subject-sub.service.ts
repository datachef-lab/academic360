import { db } from "@/db/index.js";
import { relatedSubjectSubModel } from "@repo/db/schemas/models/subject-selection";
import {
  RelatedSubjectSub,
  RelatedSubjectSubT,
} from "@repo/db/schemas/models/subject-selection/related-subject-sub.model";
import { and, countDistinct, eq, ilike, ne } from "drizzle-orm";
import { RelatedSubjectSubDto } from "@repo/db/dtos/subject-selection";
import { boardSubjectNameModel } from "@repo/db/schemas/models/admissions";
import XLSX from "xlsx";
import fs from "fs";

// Bulk upload interface
export interface RelatedSubjectSubBulkUploadResult {
  success: RelatedSubjectSubDto[];
  errors: Array<{
    row: number;
    data: unknown[];
    error: string;
  }>;
}

export async function createRelatedSubjectSub(
  data: RelatedSubjectSub,
): Promise<RelatedSubjectSubDto> {
  const [created] = await db
    .insert(relatedSubjectSubModel)
    .values(data)
    .returning();

  // Get related data for the created record
  const result = await getRelatedSubjectSubById(created.id);
  if (!result) {
    throw new Error("Failed to retrieve created related subject sub");
  }
  return result;
}

export async function getAllRelatedSubjectSubs(): Promise<
  RelatedSubjectSubDto[]
> {
  const results = await db
    .select({
      id: relatedSubjectSubModel.id,
      relatedSubjectMainId: relatedSubjectSubModel.relatedSubjectMainId,
      boardSubjectNameId: relatedSubjectSubModel.boardSubjectNameId,
      createdAt: relatedSubjectSubModel.createdAt,
      updatedAt: relatedSubjectSubModel.updatedAt,
      boardSubjectName: {
        id: boardSubjectNameModel.id,
        name: boardSubjectNameModel.name,
        code: boardSubjectNameModel.code,
      },
    })
    .from(relatedSubjectSubModel)
    .leftJoin(
      boardSubjectNameModel,
      eq(relatedSubjectSubModel.boardSubjectNameId, boardSubjectNameModel.id),
    );

  return results.map((result) => ({
    id: result.id,
    boardSubjectNameId: result.boardSubjectNameId,
    boardSubjectName: result.boardSubjectName || {
      id: 0,
      name: "Unknown Board Subject Name",
      code: null,
    },
  }));
}

export async function getRelatedSubjectSubById(
  id: number,
): Promise<RelatedSubjectSubDto | null> {
  const [result] = await db
    .select({
      id: relatedSubjectSubModel.id,
      relatedSubjectMainId: relatedSubjectSubModel.relatedSubjectMainId,
      boardSubjectNameId: relatedSubjectSubModel.boardSubjectNameId,
      createdAt: relatedSubjectSubModel.createdAt,
      updatedAt: relatedSubjectSubModel.updatedAt,
      boardSubjectName: {
        id: boardSubjectNameModel.id,
        name: boardSubjectNameModel.name,
        code: boardSubjectNameModel.code,
      },
    })
    .from(relatedSubjectSubModel)
    .leftJoin(
      boardSubjectNameModel,
      eq(relatedSubjectSubModel.boardSubjectNameId, boardSubjectNameModel.id),
    )
    .where(eq(relatedSubjectSubModel.id, id));

  if (!result) return null;

  return {
    id: result.id,
    boardSubjectNameId: result.boardSubjectNameId,
    boardSubjectName: result.boardSubjectName || {
      id: 0,
      name: "Unknown Board Subject Name",
      code: null,
    },
  };
}

export async function getRelatedSubjectSubsByMainId(
  mainId: number,
): Promise<RelatedSubjectSubDto[]> {
  const results = await db
    .select({
      id: relatedSubjectSubModel.id,
      relatedSubjectMainId: relatedSubjectSubModel.relatedSubjectMainId,
      boardSubjectNameId: relatedSubjectSubModel.boardSubjectNameId,
      createdAt: relatedSubjectSubModel.createdAt,
      updatedAt: relatedSubjectSubModel.updatedAt,
      boardSubjectName: {
        id: boardSubjectNameModel.id,
        name: boardSubjectNameModel.name,
        code: boardSubjectNameModel.code,
      },
    })
    .from(relatedSubjectSubModel)
    .leftJoin(
      boardSubjectNameModel,
      eq(relatedSubjectSubModel.boardSubjectNameId, boardSubjectNameModel.id),
    )
    .where(eq(relatedSubjectSubModel.relatedSubjectMainId, mainId));

  return results.map((result) => ({
    id: result.id,
    boardSubjectNameId: result.boardSubjectNameId,
    boardSubjectName: result.boardSubjectName || {
      id: 0,
      name: "Unknown Board Subject Name",
      code: null,
    },
  }));
}

export async function updateRelatedSubjectSub(
  id: number,
  data: Partial<RelatedSubjectSub>,
): Promise<RelatedSubjectSubDto> {
  const [updated] = await db
    .update(relatedSubjectSubModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(relatedSubjectSubModel.id, id))
    .returning();

  // Get related data for the updated record
  const result = await getRelatedSubjectSubById(updated.id);
  if (!result) {
    throw new Error("Failed to retrieve updated related subject sub");
  }
  return result;
}

export async function deleteRelatedSubjectSub(id: number) {
  const [deleted] = await db
    .delete(relatedSubjectSubModel)
    .where(eq(relatedSubjectSubModel.id, id))
    .returning();
  return deleted;
}

export async function bulkUploadRelatedSubjectSubs(
  file: Express.Multer.File,
): Promise<RelatedSubjectSubBulkUploadResult> {
  const workbook = XLSX.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const success: RelatedSubjectSubDto[] = [];
  const errors: Array<{ row: number; data: unknown[]; error: string }> = [];

  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i] as any;
      const relatedSubjectSubData: RelatedSubjectSub = {
        relatedSubjectMainId: row.relatedSubjectMainId,
        boardSubjectNameId: row.boardSubjectNameId,
      };

      const created = await createRelatedSubjectSub(relatedSubjectSubData);
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
