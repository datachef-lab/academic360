import { db } from "@/db/index.js";
import { relatedSubjectSubModel } from "@repo/db/schemas/models/subject-selection";
import {
  RelatedSubjectSub,
  RelatedSubjectSubT,
} from "@repo/db/schemas/models/subject-selection/related-subject-sub.model";
import { and, countDistinct, eq, ilike, ne } from "drizzle-orm";
import { RelatedSubjectSubDto } from "@repo/db/dtos/subject-selection";
import { getMappingById } from "@/features/admissions/services/board-subject-univ-subject-mapping.service.js";
import type { BoardSubjectUnivSubjectMappingDto } from "@repo/db/dtos/admissions";
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
      boardSubjectUnivSubjectMappingId:
        relatedSubjectSubModel.boardSubjectUnivSubjectMappingId,
      createdAt: relatedSubjectSubModel.createdAt,
      updatedAt: relatedSubjectSubModel.updatedAt,
    })
    .from(relatedSubjectSubModel);

  const dtos: RelatedSubjectSubDto[] = await Promise.all(
    results.map(async (r) => ({
      id: r.id,
      boardSubjectUnivSubjectMapping: (await getMappingById(
        r.boardSubjectUnivSubjectMappingId!,
      )) as BoardSubjectUnivSubjectMappingDto,
    })),
  );
  return dtos;
}

export async function getRelatedSubjectSubById(
  id: number,
): Promise<RelatedSubjectSubDto | null> {
  const [result] = await db
    .select({
      id: relatedSubjectSubModel.id,
      boardSubjectUnivSubjectMappingId:
        relatedSubjectSubModel.boardSubjectUnivSubjectMappingId,
    })
    .from(relatedSubjectSubModel)
    .where(eq(relatedSubjectSubModel.id, id));

  if (!result) return null;

  return {
    id: result.id,
    boardSubjectUnivSubjectMapping: (await getMappingById(
      result.boardSubjectUnivSubjectMappingId!,
    )) as BoardSubjectUnivSubjectMappingDto,
  };
}

export async function getRelatedSubjectSubsByMainId(
  mainId: number,
): Promise<RelatedSubjectSubDto[]> {
  const results = await db
    .select({
      id: relatedSubjectSubModel.id,
      boardSubjectUnivSubjectMappingId:
        relatedSubjectSubModel.boardSubjectUnivSubjectMappingId,
    })
    .from(relatedSubjectSubModel)
    .where(eq(relatedSubjectSubModel.relatedSubjectMainId, mainId));

  const dtos: RelatedSubjectSubDto[] = await Promise.all(
    results.map(async (r) => ({
      id: r.id,
      boardSubjectUnivSubjectMapping: (await getMappingById(
        r.boardSubjectUnivSubjectMappingId!,
      )) as BoardSubjectUnivSubjectMappingDto,
    })),
  );
  return dtos;
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
        boardSubjectUnivSubjectMappingId: row.boardSubjectUnivSubjectMappingId,
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
