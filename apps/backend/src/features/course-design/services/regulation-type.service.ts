import { db } from "@/db/index.js";
import {
  regulationTypeModel,
  RegulationType,
} from "@repo/db/schemas/models/course-design";
import { countDistinct, eq, ilike } from "drizzle-orm";
import { programCourseModel } from "@repo/db/schemas/models/course-design";
import { paperModel } from "@repo/db/schemas/models/course-design";
import XLSX from "xlsx";
import fs from "fs";

const defaultRegulationType: RegulationType[] = [
  {
    name: "CBCS",
    shortName: "CBCS",
    isActive: true,
  },
  {
    name: "CCF",
    shortName: "CCF",
    isActive: true,
  },
];

export async function loadRegulationType() {
  for (const regulationType of defaultRegulationType) {
    const [existingRegulationType] = await db
      .select()
      .from(regulationTypeModel)
      .where(ilike(regulationTypeModel.name, regulationType.name.trim()));
    if (existingRegulationType) continue;

    const [created] = await db
      .insert(regulationTypeModel)
      .values(regulationType)
      .returning();
  }
}

export async function createRegulationType(
  data: Omit<RegulationType, "id" | "createdAt" | "updatedAt">,
) {
  const [existingRegulationType] = await db
    .select()
    .from(regulationTypeModel)
    .where(ilike(regulationTypeModel.name, data.name.trim()));
  if (existingRegulationType) return null;
  const [created] = await db
    .insert(regulationTypeModel)
    .values(data)
    .returning();
  return created;
}

export async function findById(id: number) {
  const [regulationType] = await db
    .select()
    .from(regulationTypeModel)
    .where(eq(regulationTypeModel.id, id));
  return regulationType;
}

export async function getAllRegulationTypes() {
  return db.select().from(regulationTypeModel);
}

export async function updateRegulationType(
  id: number,
  data: Partial<RegulationType>,
) {
  const { id: idObj, createdAt, updatedAt, ...props } = data;
  const [updated] = await db
    .update(regulationTypeModel)
    .set(props)
    .where(eq(regulationTypeModel.id, id))
    .returning();
  return updated;
}

export async function deleteRegulationType(id: number) {
  const [deleted] = await db
    .delete(regulationTypeModel)
    .where(eq(regulationTypeModel.id, id))
    .returning();
  return deleted;
}

export async function deleteRegulationTypeSafe(id: number) {
  const [found] = await db
    .select()
    .from(regulationTypeModel)
    .where(eq(regulationTypeModel.id, id));
  if (!found) return null;

  const [{ paperCount }] = await db
    .select({ paperCount: countDistinct(paperModel.id) })
    .from(paperModel)
    .where(eq(paperModel.regulationTypeId, id));
  const [{ programCourseCount }] = await db
    .select({ programCourseCount: countDistinct(programCourseModel.id) })
    .from(programCourseModel)
    .where(eq(programCourseModel.regulationTypeId, id));

  if (paperCount > 0 || programCourseCount > 0) {
    return {
      success: false,
      message:
        "Cannot delete regulation-type. It is associated with other records.",
      records: [
        { count: paperCount, type: "Paper" },
        { count: programCourseCount, type: "Program-course" },
      ],
    };
  }

  const [deleted] = await db
    .delete(regulationTypeModel)
    .where(eq(regulationTypeModel.id, id))
    .returning();
  if (deleted)
    return {
      success: true,
      message: "Regulation-type deleted successfully.",
      records: [],
    };
  return {
    success: false,
    message: "Failed to delete regulation-type.",
    records: [],
  };
}

export interface BulkUploadResult {
  success: RegulationType[];
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

export const bulkUploadRegulationTypes = async (
  filePath: string,
  io?: any,
  uploadSessionId?: string,
): Promise<BulkUploadResult> => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const rowsArr = Array.isArray(rows) ? rows : [];
  const [header, ...dataRows] = rowsArr;

  if (!Array.isArray(dataRows))
    return {
      success: [],
      errors: [],
      summary: { total: 0, successful: 0, failed: 0 },
    };

  const rowsArray: unknown[][] = dataRows as unknown[][];
  const success: RegulationType[] = [];
  const errors: BulkUploadResult["errors"] = [];

  for (let i = 0; i < rowsArray.length; i++) {
    const row = rowsArray[i];
    const [name, shortName, sequence, isActive] = row;
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      errors.push({
        row: i + 2,
        data: row,
        error: "Name is required and must be at least 2 characters.",
      });
      continue;
    }
    try {
      const created = await db
        .insert(regulationTypeModel)
        .values({
          name: name.trim(),
          shortName: shortName ? String(shortName).trim() : null,
          sequence:
            sequence !== undefined && sequence !== null && sequence !== ""
              ? Number(sequence)
              : 0,
          isActive:
            isActive === true ||
            isActive === "true" ||
            isActive === 1 ||
            isActive === "1",
        })
        .returning();
      success.push(created[0]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      errors.push({ row: i + 2, data: row, error: errorMessage });
    }
    if (io && uploadSessionId) {
      io.to(uploadSessionId).emit("bulk-upload-progress", {
        processed: i,
        total: dataRows.length - 1,
        percent: Math.round((i / (dataRows.length - 1)) * 100),
      });
    }
  }

  // Clean up file
  fs.unlinkSync(filePath);

  const result: BulkUploadResult = {
    success,
    errors,
    summary: {
      total: dataRows.length,
      successful: success.length,
      failed: errors.length,
    },
  };

  if (io && uploadSessionId) {
    if (result.errors.length > 0) {
      io.to(uploadSessionId).emit("bulk-upload-failed", {
        errorCount: result.errors.length,
      });
    } else {
      io.to(uploadSessionId).emit("bulk-upload-done", {
        successCount: result.success.length,
      });
    }
  }

  return result;
};
