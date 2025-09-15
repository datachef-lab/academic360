import { db } from "@/db/index.js";
import { boardModel } from "@repo/db/schemas/models/resources";
import { Board, BoardT } from "@repo/db/schemas/models/resources/board.model";
import { and, countDistinct, eq, ilike, ne } from "drizzle-orm";
import { degreeModel } from "@repo/db/schemas/models/resources";
import { addressModel } from "@repo/db/schemas/models/user";
import XLSX from "xlsx";
import fs from "fs";

// Define DTO for board
export interface BoardDto {
  id: number;
  legacyBoardId: number | null;
  name: string;
  degreeId: number | null;
  passingMarks: number | null;
  code: string | null;
  addressId: number | null;
  sequence: number | null;
  isActive: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  degree: {
    id: number;
    name: string | null;
    sequence: number | null;
    isActive: boolean | null;
  } | null;
  address: {
    id: number;
    addressLine: string | null;
    landmark: string | null;
    otherCity: string | null;
    otherState: string | null;
    otherCountry: string | null;
  } | null;
}

// Bulk upload interface
export interface BulkUploadResult {
  success: BoardDto[];
  errors: Array<{
    row: number;
    data: unknown[];
    error: string;
  }>;
}

export async function createBoard(data: Board): Promise<BoardDto> {
  const [created] = await db.insert(boardModel).values(data).returning();

  // Get related data for the created record
  const result = await getBoardById(created.id);
  if (!result) {
    throw new Error("Failed to retrieve created board");
  }
  return result;
}

export async function getAllBoards(): Promise<BoardDto[]> {
  const results = await db
    .select({
      id: boardModel.id,
      legacyBoardId: boardModel.legacyBoardId,
      name: boardModel.name,
      degreeId: boardModel.degreeId,
      passingMarks: boardModel.passingMarks,
      code: boardModel.code,
      addressId: boardModel.addressId,
      sequence: boardModel.sequence,
      isActive: boardModel.isActive,
      createdAt: boardModel.createdAt,
      updatedAt: boardModel.updatedAt,
      degree: {
        id: degreeModel.id,
        name: degreeModel.name,
        sequence: degreeModel.sequence,
        isActive: degreeModel.isActive,
      },
      address: {
        id: addressModel.id,
        addressLine: addressModel.addressLine,
        landmark: addressModel.landmark,
        otherCity: addressModel.otherCity,
        otherState: addressModel.otherState,
        otherCountry: addressModel.otherCountry,
      },
    })
    .from(boardModel)
    .leftJoin(degreeModel, eq(boardModel.degreeId, degreeModel.id))
    .leftJoin(addressModel, eq(boardModel.addressId, addressModel.id));

  return results.map((result) => ({
    id: result.id,
    legacyBoardId: result.legacyBoardId,
    name: result.name,
    degreeId: result.degreeId,
    passingMarks: result.passingMarks,
    code: result.code,
    addressId: result.addressId,
    sequence: result.sequence,
    isActive: result.isActive,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    degree: result.degree,
    address: result.address,
  }));
}

export async function getBoardById(id: number): Promise<BoardDto | null> {
  const [result] = await db
    .select({
      id: boardModel.id,
      legacyBoardId: boardModel.legacyBoardId,
      name: boardModel.name,
      degreeId: boardModel.degreeId,
      passingMarks: boardModel.passingMarks,
      code: boardModel.code,
      addressId: boardModel.addressId,
      sequence: boardModel.sequence,
      isActive: boardModel.isActive,
      createdAt: boardModel.createdAt,
      updatedAt: boardModel.updatedAt,
      degree: {
        id: degreeModel.id,
        name: degreeModel.name,
        sequence: degreeModel.sequence,
        isActive: degreeModel.isActive,
      },
      address: {
        id: addressModel.id,
        addressLine: addressModel.addressLine,
        landmark: addressModel.landmark,
        otherCity: addressModel.otherCity,
        otherState: addressModel.otherState,
        otherCountry: addressModel.otherCountry,
      },
    })
    .from(boardModel)
    .leftJoin(degreeModel, eq(boardModel.degreeId, degreeModel.id))
    .leftJoin(addressModel, eq(boardModel.addressId, addressModel.id))
    .where(eq(boardModel.id, id));

  if (!result) return null;

  return {
    id: result.id,
    legacyBoardId: result.legacyBoardId,
    name: result.name,
    degreeId: result.degreeId,
    passingMarks: result.passingMarks,
    code: result.code,
    addressId: result.addressId,
    sequence: result.sequence,
    isActive: result.isActive,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    degree: result.degree,
    address: result.address,
  };
}

export async function updateBoard(
  id: number,
  data: Partial<Board>,
): Promise<BoardDto> {
  const [updated] = await db
    .update(boardModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(boardModel.id, id))
    .returning();

  // Get related data for the updated record
  const result = await getBoardById(updated.id);
  if (!result) {
    throw new Error("Failed to retrieve updated board");
  }
  return result;
}

export async function deleteBoard(id: number) {
  const [deleted] = await db
    .delete(boardModel)
    .where(eq(boardModel.id, id))
    .returning();
  return deleted;
}

export async function bulkUploadBoards(
  file: Express.Multer.File,
): Promise<BulkUploadResult> {
  const workbook = XLSX.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const success: BoardDto[] = [];
  const errors: Array<{ row: number; data: unknown[]; error: string }> = [];

  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i] as any;
      const boardData: Board = {
        legacyBoardId: row.legacyBoardId || null,
        name: row.name,
        degreeId: row.degreeId || null,
        passingMarks: row.passingMarks || null,
        code: row.code || null,
        addressId: row.addressId || null,
        sequence: row.sequence || null,
        isActive: row.isActive !== undefined ? row.isActive : true,
      };

      const created = await createBoard(boardData);
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
