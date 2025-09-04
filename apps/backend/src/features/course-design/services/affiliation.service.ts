import { db } from "@/db/index.js";

import XLSX from "xlsx";
import fs from "fs";
import { Affiliation, affiliationModel, paperModel, programCourseModel } from "@repo/db/schemas";
import { countDistinct, eq, ilike } from "drizzle-orm";

const defaultAffiliation: Affiliation[] = [
    {
        name: "Calcutta University",
        shortName: "CU",
        disabled: false,
    }
]
export async function loadAffiliation() {
    for (const affiliation of defaultAffiliation) {
        const [existingAffiliation] = await db
            .select()
            .from(affiliationModel)
            .where(ilike(affiliationModel.name, affiliation.name.trim()));
        if (existingAffiliation) continue;

        const [created] = await db.insert(affiliationModel).values(affiliation).returning();

    }
}

export async function createAffiliation(data: Affiliation) {
    const { id, createdAt, updatedAt, ...props } = data;

    const [existingAffiliation] = await db
        .select()
        .from(affiliationModel)
        .where(ilike(affiliationModel.name, data.name.trim()));

    if (existingAffiliation) return null;

    const [created] = await db.insert(affiliationModel).values(props).returning();
    return created;
}

export async function getAffiliationById(id: number) {
    const [affiliation] = await db.select().from(affiliationModel).where(eq(affiliationModel.id, id));
    return affiliation;
}

export async function getAllAffiliations() {
    return db.select().from(affiliationModel);
}

export async function updateAffiliation(id: number, data: Partial<Affiliation>) {
    const { id: idObj, createdAt, updatedAt, ...props } = data;
    const [updated] = await db.update(affiliationModel).set(props).where(eq(affiliationModel.id, id)).returning();
    return updated;
}

export async function deleteAffiliation(id: number) {
    const [deleted] = await db.delete(affiliationModel).where(eq(affiliationModel.id, id)).returning();
    return deleted;
}

export async function deleteAffiliationSafe(id: number) {
    const [found] = await db.select().from(affiliationModel).where(eq(affiliationModel.id, id));
    if (!found) return null;

    const [{ paperCount }] = await db
        .select({ paperCount: countDistinct(paperModel.id) })
        .from(paperModel)
        .where(eq(paperModel.affiliationId, id));

    const [{ programCourseCount }] = await db
        .select({ programCourseCount: countDistinct(programCourseModel.id) })
        .from(programCourseModel)
        .where(eq(programCourseModel.affiliationId, id));

    if (paperCount > 0 || programCourseCount > 0) {
        return {
            success: false,
            message: "Cannot delete affiliation. It is associated with other records.",
            records: [
                { count: paperCount, type: "Paper" },
                { count: programCourseCount, type: "Program-course" },
            ],
        };
    }

    const [deleted] = await db.delete(affiliationModel).where(eq(affiliationModel.id, id)).returning();
    if (deleted) return { success: true, message: "Affiliation deleted successfully.", records: [] };
    return { success: false, message: "Failed to delete affiliation.", records: [] };
}

export interface BulkUploadResult {
    success: Affiliation[];
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

export const bulkUploadAffiliations = async (
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
    const success: Affiliation[] = [];
    const errors: BulkUploadResult["errors"] = [];

    for (let i = 0; i < rowsArray.length; i++) {
        const row = rowsArray[i];
        const [name, shortName, sequence, disabled, remarks] = row;
        // Validation: name required
        if (!name || typeof name !== "string" || name.trim().length < 2) {
            errors.push({ row: i + 2, data: row, error: "Name is required and must be at least 2 characters." });
            continue;
        }
        try {
            const created = await db.insert(affiliationModel).values({
                name: name.trim(),
                shortName: shortName ? String(shortName).trim() : null,
                sequence: sequence !== undefined && sequence !== null && sequence !== '' ? Number(sequence) : null,
                disabled: disabled === true || disabled === "true" || disabled === 1 || disabled === "1",
                remarks: remarks ? String(remarks).trim() : null
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