import { db } from "@/db/index.js";
import { boardSubjectModel } from "@repo/db/schemas/models/admissions";
import {
  BoardSubject,
  BoardSubjectT,
} from "@repo/db/schemas/models/admissions/board-subject.model";
import { and, countDistinct, eq, ilike, ne } from "drizzle-orm";
import { boardModel, degreeModel } from "@repo/db/schemas/models/resources";
import { addressModel } from "@repo/db/schemas/models/user";
import { boardSubjectNameModel } from "@repo/db/schemas/models/admissions";
import XLSX from "xlsx";
import fs from "fs";
import { BoardSubjectDto } from "@repo/db/dtos";

// Bulk upload interface
export interface BulkUploadResult {
  success: BoardSubjectDto[];
  errors: Array<{
    row: number;
    data: unknown[];
    error: string;
  }>;
}

export async function createBoardSubject(
  data: BoardSubject,
): Promise<BoardSubjectDto> {
  const [created] = await db.insert(boardSubjectModel).values(data).returning();

  // Get related data for the created record
  const result = await getBoardSubjectById(created.id);
  if (!result) {
    throw new Error("Failed to retrieve created board subject");
  }
  return result;
}

export async function getAllBoardSubjects(
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  degreeId?: number,
): Promise<{
  data: BoardSubjectDto[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const offset = (page - 1) * pageSize;

  // Build where conditions
  const whereConditions = [];

  if (search) {
    whereConditions.push(ilike(boardModel.name, `%${search}%`));
    whereConditions.push(ilike(boardSubjectNameModel.name, `%${search}%`));
  }

  if (degreeId) {
    whereConditions.push(eq(degreeModel.id, degreeId));
  }

  // Get total count
  const [{ total }] = await db
    .select({ total: countDistinct(boardSubjectModel.id) })
    .from(boardSubjectModel)
    .leftJoin(boardModel, eq(boardSubjectModel.boardId, boardModel.id))
    .leftJoin(degreeModel, eq(boardModel.degreeId, degreeModel.id))
    .leftJoin(addressModel, eq(boardModel.addressId, addressModel.id))
    .leftJoin(
      boardSubjectNameModel,
      eq(boardSubjectModel.boardSubjectNameId, boardSubjectNameModel.id),
    )
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  // Get paginated results
  const results = await db
    .select({
      id: boardSubjectModel.id,
      legacyBoardSubjectMappingSubId:
        boardSubjectModel.legacyBoardSubjectMappingSubId,
      boardId: boardSubjectModel.boardId,
      fullMarksTheory: boardSubjectModel.fullMarksTheory,
      passingMarksTheory: boardSubjectModel.passingMarksTheory,
      fullMarksPractical: boardSubjectModel.fullMarksPractical,
      passingMarksPractical: boardSubjectModel.passingMarksPractical,
      isActive: boardSubjectModel.isActive,
      createdAt: boardSubjectModel.createdAt,
      updatedAt: boardSubjectModel.updatedAt,
      board: {
        id: boardModel.id,
        name: boardModel.name,
        code: boardModel.code,
        isActive: boardModel.isActive,
      },
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
      boardSubjectName: {
        id: boardSubjectNameModel.id,
        name: boardSubjectNameModel.name,
        code: boardSubjectNameModel.code,
        isActive: boardSubjectNameModel.isActive,
      },
    })
    .from(boardSubjectModel)
    .leftJoin(boardModel, eq(boardSubjectModel.boardId, boardModel.id))
    .leftJoin(degreeModel, eq(boardModel.degreeId, degreeModel.id))
    .leftJoin(addressModel, eq(boardModel.addressId, addressModel.id))
    .leftJoin(
      boardSubjectNameModel,
      eq(boardSubjectModel.boardSubjectNameId, boardSubjectNameModel.id),
    )
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .limit(pageSize)
    .offset(offset);

  const data = results.map((result) => ({
    id: result.id!,
    legacyBoardSubjectMappingSubId: result.legacyBoardSubjectMappingSubId,
    boardId: result.boardId!,
    fullMarksTheory: result.fullMarksTheory,
    passingMarksTheory: result.passingMarksTheory,
    fullMarksPractical: result.fullMarksPractical,
    passingMarksPractical: result.passingMarksPractical,
    isActive: result.isActive,
    createdAt: result.createdAt || new Date(),
    updatedAt: result.updatedAt || new Date(),
    board: {
      id: result.board?.id!,
      name: result.board?.name!,
      code: result.board?.code,
      isActive: result.board?.isActive,
      degree: result.degree || null,
      address: result.address ? { ...result.address, district: null } : null,
    },
    boardSubjectName: {
      id: result.boardSubjectName?.id!,
      name: result.boardSubjectName?.name!,
      code: result.boardSubjectName?.code,
      isActive: result.boardSubjectName?.isActive,
    },
  }));

  return {
    data,
    total,
    page,
    pageSize,
  };
}

export async function getBoardSubjectById(
  id: number,
): Promise<BoardSubjectDto | null> {
  const [result] = await db
    .select({
      id: boardSubjectModel.id,
      legacyBoardSubjectMappingSubId:
        boardSubjectModel.legacyBoardSubjectMappingSubId,
      boardId: boardSubjectModel.boardId,
      fullMarksTheory: boardSubjectModel.fullMarksTheory,
      passingMarksTheory: boardSubjectModel.passingMarksTheory,
      fullMarksPractical: boardSubjectModel.fullMarksPractical,
      passingMarksPractical: boardSubjectModel.passingMarksPractical,
      isActive: boardSubjectModel.isActive,
      createdAt: boardSubjectModel.createdAt,
      updatedAt: boardSubjectModel.updatedAt,
      board: {
        id: boardModel.id,
        name: boardModel.name,
        code: boardModel.code,
        isActive: boardModel.isActive,
      },
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
      boardSubjectName: {
        id: boardSubjectNameModel.id,
        name: boardSubjectNameModel.name,
        code: boardSubjectNameModel.code,
        isActive: boardSubjectNameModel.isActive,
      },
    })
    .from(boardSubjectModel)
    .leftJoin(boardModel, eq(boardSubjectModel.boardId, boardModel.id))
    .leftJoin(degreeModel, eq(boardModel.degreeId, degreeModel.id))
    .leftJoin(addressModel, eq(boardModel.addressId, addressModel.id))
    .leftJoin(
      boardSubjectNameModel,
      eq(boardSubjectModel.boardSubjectNameId, boardSubjectNameModel.id),
    )
    .where(eq(boardSubjectModel.id, id));

  if (!result) return null;

  return {
    id: result.id!,
    legacyBoardSubjectMappingSubId: result.legacyBoardSubjectMappingSubId,
    boardId: result.boardId!,
    fullMarksTheory: result.fullMarksTheory,
    passingMarksTheory: result.passingMarksTheory,
    fullMarksPractical: result.fullMarksPractical,
    passingMarksPractical: result.passingMarksPractical,
    isActive: result.isActive,
    createdAt: result.createdAt || new Date(),
    updatedAt: result.updatedAt || new Date(),
    board: {
      id: result.board?.id!,
      name: result.board?.name!,
      code: result.board?.code,
      isActive: result.board?.isActive,
      degree: result.degree || null,
      address: result.address ? { ...result.address, district: null } : null,
    },
    boardSubjectName: {
      id: result.boardSubjectName?.id!,
      name: result.boardSubjectName?.name!,
      code: result.boardSubjectName?.code,
      isActive: result.boardSubjectName?.isActive,
    },
  };
}

export async function getBoardSubjectsByBoardId(
  boardId: number,
): Promise<BoardSubjectDto[]> {
  const results = await db
    .select({
      id: boardSubjectModel.id,
      legacyBoardSubjectMappingSubId:
        boardSubjectModel.legacyBoardSubjectMappingSubId,
      boardId: boardSubjectModel.boardId,
      fullMarksTheory: boardSubjectModel.fullMarksTheory,
      passingMarksTheory: boardSubjectModel.passingMarksTheory,
      fullMarksPractical: boardSubjectModel.fullMarksPractical,
      passingMarksPractical: boardSubjectModel.passingMarksPractical,
      isActive: boardSubjectModel.isActive,
      createdAt: boardSubjectModel.createdAt,
      updatedAt: boardSubjectModel.updatedAt,
      board: {
        id: boardModel.id,
        name: boardModel.name,
        code: boardModel.code,
        isActive: boardModel.isActive,
      },
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
      boardSubjectName: {
        id: boardSubjectNameModel.id,
        name: boardSubjectNameModel.name,
        code: boardSubjectNameModel.code,
        isActive: boardSubjectNameModel.isActive,
      },
    })
    .from(boardSubjectModel)
    .leftJoin(boardModel, eq(boardSubjectModel.boardId, boardModel.id))
    .leftJoin(degreeModel, eq(boardModel.degreeId, degreeModel.id))
    .leftJoin(addressModel, eq(boardModel.addressId, addressModel.id))
    .leftJoin(
      boardSubjectNameModel,
      eq(boardSubjectModel.boardSubjectNameId, boardSubjectNameModel.id),
    )
    .where(eq(boardSubjectModel.boardId, boardId));

  return results.map((result) => ({
    id: result.id!,
    legacyBoardSubjectMappingSubId: result.legacyBoardSubjectMappingSubId,
    boardId: result.boardId!,
    fullMarksTheory: result.fullMarksTheory,
    passingMarksTheory: result.passingMarksTheory,
    fullMarksPractical: result.fullMarksPractical,
    passingMarksPractical: result.passingMarksPractical,
    isActive: result.isActive,
    createdAt: result.createdAt || new Date(),
    updatedAt: result.updatedAt || new Date(),
    board: {
      id: result.board?.id!,
      name: result.board?.name!,
      code: result.board?.code,
      isActive: result.board?.isActive,
      degree: result.degree || null,
      address: result.address ? { ...result.address, district: null } : null,
    },
    boardSubjectName: {
      id: result.boardSubjectName?.id!,
      name: result.boardSubjectName?.name!,
      code: result.boardSubjectName?.code,
      isActive: result.boardSubjectName?.isActive,
    },
  }));
}

export async function updateBoardSubject(
  id: number,
  data: Partial<BoardSubject>,
): Promise<BoardSubjectDto> {
  const [updated] = await db
    .update(boardSubjectModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(boardSubjectModel.id, id))
    .returning();

  // Get related data for the updated record
  const result = await getBoardSubjectById(updated.id);
  if (!result) {
    throw new Error("Failed to retrieve updated board subject");
  }
  return result;
}

export async function deleteBoardSubject(id: number) {
  const [deleted] = await db
    .delete(boardSubjectModel)
    .where(eq(boardSubjectModel.id, id))
    .returning();
  return deleted;
}

export async function bulkUploadBoardSubjects(
  file: Express.Multer.File,
): Promise<BulkUploadResult> {
  const workbook = XLSX.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const success: BoardSubjectDto[] = [];
  const errors: Array<{ row: number; data: unknown[]; error: string }> = [];

  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i] as any;
      const boardSubjectData: BoardSubject = {
        legacyBoardSubjectMappingSubId:
          row.legacyBoardSubjectMappingSubId || null,
        boardId: row.boardId,
        boardSubjectNameId: row.boardSubjectNameId,
        fullMarksTheory: row.fullMarksTheory || null,
        passingMarksTheory: row.passingMarksTheory || null,
        fullMarksPractical: row.fullMarksPractical || null,
        passingMarksPractical: row.passingMarksPractical || null,
        isActive: row.isActive !== undefined ? row.isActive : true,
      };

      const created = await createBoardSubject(boardSubjectData);
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
