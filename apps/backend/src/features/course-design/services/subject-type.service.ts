import { db } from "@/db/index.js";
import { SubjectType, subjectTypeModel } from "@repo/db/schemas/models/course-design";
import { countDistinct, eq } from "drizzle-orm";
import { paperModel } from "@repo/db/schemas/models/course-design";
import { SubjectTypeSchema } from "@/types/course-design/index.js";
import { z } from "zod";
import XLSX from "xlsx";
import fs from "fs";

// Types
export type SubjectTypeData = z.infer<typeof SubjectTypeSchema>;

// Create a new subject type
export const createSubjectType = async (subjectTypeData: SubjectType) => {
    // const validatedData = SubjectTypeSchema.parse(subjectTypeData);
    const { id, createdAt, updatedAt, ...props } = subjectTypeData;
    // Check if subject type already exists
    const existingSubjectType = await db
        .select()
        .from(subjectTypeModel)
        .where(eq(subjectTypeModel.name, subjectTypeData.name!.trim()));
    if (existingSubjectType.length > 0) return null;
    const newSubjectType = await db.insert(subjectTypeModel).values(props).returning();
    return newSubjectType[0];
};

// Get all subject types
export const getAllSubjectTypes = async () => {
    const allSubjectTypes = await db.select().from(subjectTypeModel);
    return allSubjectTypes;
};

// Get subject type by ID
export const getSubjectTypeById = async (id: string) => {
    const subjectType = await db
        .select()
        .from(subjectTypeModel)
        .where(eq(subjectTypeModel.id, +id));
    return subjectType.length > 0 ? subjectType[0] : null;
};

// Update subject type
export const updateSubjectType = async (id: string, subjectTypeData: SubjectType) => {
    const { id: idObj, createdAt, updatedAt, ...props } = subjectTypeData;
    const updatedSubjectType = await db
        .update(subjectTypeModel)
        .set(props)
        .where(eq(subjectTypeModel.id, +id))
        .returning();
    return updatedSubjectType.length > 0 ? updatedSubjectType[0] : null;
};

// Delete subject type
export const deleteSubjectType = async (id: string) => {
    const deletedSubjectType = await db
        .delete(subjectTypeModel)
        .where(eq(subjectTypeModel.id, +id))
        .returning();
    return deletedSubjectType.length > 0 ? deletedSubjectType[0] : null;
};

export const deleteSubjectTypeSafe = async (id: string) => {
    const [found] = await db.select().from(subjectTypeModel).where(eq(subjectTypeModel.id, +id));
    if (!found) return null;

    const [{ paperCount }] = await db
        .select({ paperCount: countDistinct(paperModel.id) })
        .from(paperModel)
        .where(eq(paperModel.subjectTypeId, +id));

    if (paperCount > 0) {
        return {
            success: false,
            message: "Cannot delete subject-type. It is associated with other records.",
            records: [{ count: paperCount, type: "Paper" }],
        };
    }

    const deletedSubjectType = await db
        .delete(subjectTypeModel)
        .where(eq(subjectTypeModel.id, +id))
        .returning();
    if (deletedSubjectType.length > 0) {
        return { success: true, message: "Subject-type deleted successfully.", records: [] };
    }
    return { success: false, message: "Failed to delete subject-type.", records: [] };
};

export interface BulkUploadResult {
    success: SubjectType[];
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

export const bulkUploadSubjectTypes = async (
    filePath: string,
    io?: any,
    uploadSessionId?: string
): Promise<BulkUploadResult> => {
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
    const success: SubjectType[] = [];
    const errors: BulkUploadResult["errors"] = [];

    for (let i = 0; i < rowsArray.length; i++) {
        const row = rowsArray[i];
        const [name, code, sequence, isActive] = row;
        // Validation: name required
        if (!name || typeof name !== "string" || name.trim().length < 2) {
            errors.push({ row: i + 2, data: row, error: "Name is required and must be at least 2 characters." });
            continue;
        }
        try {
            const created = await db.insert(subjectTypeModel).values({
                name: name.trim(),
                code: code ? String(code).trim() : null,
                sequence: sequence !== undefined && sequence !== null && sequence !== '' ? Number(sequence) : null,
                isActive: isActive === true || isActive === "true" || isActive === 1 || isActive === "1"
            }).returning();
            success.push(created[0]);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            errors.push({ row: i + 2, data: row, error: errorMessage });
        }
        if (io && uploadSessionId) {
            io.to(uploadSessionId).emit("bulk-upload-progress", {
                processed: i,
                total: dataRows.length - 1,
                percent: Math.round((i / (dataRows.length - 1)) * 100)
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
            io.to(uploadSessionId).emit("bulk-upload-failed", { errorCount: result.errors.length });
        } else {
            io.to(uploadSessionId).emit("bulk-upload-done", { successCount: result.success.length });
        }
    }

    return result;
};
