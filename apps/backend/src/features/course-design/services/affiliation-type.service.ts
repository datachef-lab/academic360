import { db } from "@/db/index.js";
import { affiliationTypeModel, AffiliationType, NewAffiliationType } from "@/features/course-design/models/affiliation-type.model.js";
import { eq } from "drizzle-orm";
import * as XLSX from "xlsx";
import fs from "fs";

export async function createAffiliationType(data: NewAffiliationType) {
    const [created] = await db.insert(affiliationTypeModel).values(data).returning();
    return created;
}

export async function getAffiliationTypeById(id: number) {
    const [affiliationType] = await db.select().from(affiliationTypeModel).where(eq(affiliationTypeModel.id, id));
    return affiliationType;
}

export async function getAllAffiliationTypes() {
    return db.select().from(affiliationTypeModel);
}

export async function updateAffiliationType(id: number, data: Partial<AffiliationType>) {
    const { id: idObj, createdAt, updatedAt, ...props } = data;
    const [updated] = await db.update(affiliationTypeModel).set(props).where(eq(affiliationTypeModel.id, id)).returning();
    return updated;
}

export async function deleteAffiliationType(id: number) {
    const [deleted] = await db.delete(affiliationTypeModel).where(eq(affiliationTypeModel.id, id)).returning();
    return deleted;
}

export interface BulkUploadResult {
  success: AffiliationType[];
  errors: Array<{
    row: number;
    data: unknown[];
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export const bulkUploadAffiliationTypes = async (filePath: string): Promise<BulkUploadResult> => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const rowsArr = Array.isArray(rows) ? rows : [];
  const [header, ...dataRows] = rowsArr;

  if (!Array.isArray(dataRows)) return {
    success: [],
    errors: [],
    summary: { total: 0, successful: 0, failed: 0 }
  };

  const rowsArray: unknown[][] = dataRows as unknown[][];
  const success: AffiliationType[] = [];
  const errors: BulkUploadResult["errors"] = [];

  for (let i = 0; i < rowsArray.length; i++) {
    const row = rowsArray[i];
    const [name, description, sequence, disabled] = row;
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      errors.push({ row: i + 2, data: row, error: "Name is required and must be at least 2 characters." });
      continue;
    }
    try {
      const created = await db.insert(affiliationTypeModel).values({
        name: name.trim(),
        description: description ? String(description).trim() : null,
        sequence: sequence !== undefined && sequence !== null && sequence !== '' ? Number(sequence) : 0,
        disabled: disabled === true || disabled === "true" || disabled === 1 || disabled === "1"
      }).returning();
      success.push(created[0]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      errors.push({ row: i + 2, data: row, error: errorMessage });
    }
  }

  // Clean up file
  fs.unlinkSync(filePath);

  return {
    success,
    errors,
    summary: {
      total: dataRows.length,
      successful: success.length,
      failed: errors.length,
    },
  };
}; 