import { db } from "@/db/index.js";
import { boardSubjectNameModel } from "@repo/db/schemas/models/admissions";
import {
  BoardSubjectName,
  BoardSubjectNameT,
} from "@repo/db/schemas/models/admissions/board-subject-name.model";
import { and, countDistinct, eq, ilike, ne } from "drizzle-orm";
import XLSX from "xlsx";
import fs from "fs";

// Define DTO for board subject name
export interface BoardSubjectNameDto {
  id: number;
  legacyBoardSubjectNameId: number | null;
  name: string;
  code: string | null;
  sequence: number | null;
  isActive: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

// Bulk upload interface
export interface BulkUploadResult {
  success: BoardSubjectNameDto[];
  errors: Array<{
    row: number;
    data: unknown[];
    error: string;
  }>;
}

export async function createBoardSubjectName(
  data: BoardSubjectName,
): Promise<BoardSubjectNameDto> {
  const [created] = await db
    .insert(boardSubjectNameModel)
    .values(data)
    .returning();

  // Get related data for the created record
  const result = await getBoardSubjectNameById(created.id);
  if (!result) {
    throw new Error("Failed to retrieve created board subject name");
  }
  return result;
}

export async function getAllBoardSubjectNames(): Promise<
  BoardSubjectNameDto[]
> {
  const results = await db
    .select({
      id: boardSubjectNameModel.id,
      legacyBoardSubjectNameId: boardSubjectNameModel.legacyBoardSubjectNameId,
      name: boardSubjectNameModel.name,
      code: boardSubjectNameModel.code,
      sequence: boardSubjectNameModel.sequence,
      isActive: boardSubjectNameModel.isActive,
      createdAt: boardSubjectNameModel.createdAt,
      updatedAt: boardSubjectNameModel.updatedAt,
    })
    .from(boardSubjectNameModel);

  return results.map((result) => ({
    id: result.id,
    legacyBoardSubjectNameId: result.legacyBoardSubjectNameId,
    name: result.name,
    code: result.code,
    sequence: result.sequence,
    isActive: result.isActive,
    createdAt: result.createdAt || new Date(),
    updatedAt: result.updatedAt || new Date(),
  }));
}

export async function getBoardSubjectNameById(
  id: number,
): Promise<BoardSubjectNameDto | null> {
  const [result] = await db
    .select({
      id: boardSubjectNameModel.id,
      legacyBoardSubjectNameId: boardSubjectNameModel.legacyBoardSubjectNameId,
      name: boardSubjectNameModel.name,
      code: boardSubjectNameModel.code,
      sequence: boardSubjectNameModel.sequence,
      isActive: boardSubjectNameModel.isActive,
      createdAt: boardSubjectNameModel.createdAt,
      updatedAt: boardSubjectNameModel.updatedAt,
    })
    .from(boardSubjectNameModel)
    .where(eq(boardSubjectNameModel.id, id));

  if (!result) return null;

  return {
    id: result.id,
    legacyBoardSubjectNameId: result.legacyBoardSubjectNameId,
    name: result.name,
    code: result.code,
    sequence: result.sequence,
    isActive: result.isActive,
    createdAt: result.createdAt || new Date(),
    updatedAt: result.updatedAt || new Date(),
  };
}

export async function updateBoardSubjectName(
  id: number,
  data: Partial<BoardSubjectName>,
): Promise<BoardSubjectNameDto> {
  const [updated] = await db
    .update(boardSubjectNameModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(boardSubjectNameModel.id, id))
    .returning();

  // Get related data for the updated record
  const result = await getBoardSubjectNameById(updated.id);
  if (!result) {
    throw new Error("Failed to retrieve updated board subject name");
  }
  return result;
}

export async function deleteBoardSubjectName(id: number) {
  const [deleted] = await db
    .delete(boardSubjectNameModel)
    .where(eq(boardSubjectNameModel.id, id))
    .returning();
  return deleted;
}

export async function bulkUploadBoardSubjectNames(
  file: Express.Multer.File,
): Promise<BulkUploadResult> {
  const workbook = XLSX.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const success: BoardSubjectNameDto[] = [];
  const errors: Array<{ row: number; data: unknown[]; error: string }> = [];

  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i] as any;
      const boardSubjectNameData: BoardSubjectName = {
        legacyBoardSubjectNameId: row.legacyBoardSubjectNameId || null,
        name: row.name,
        code: row.code || null,
        sequence: row.sequence || null,
        isActive: row.isActive !== undefined ? row.isActive : true,
      };

      const created = await createBoardSubjectName(boardSubjectNameData);
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
