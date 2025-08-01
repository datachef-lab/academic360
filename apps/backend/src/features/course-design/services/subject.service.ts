import { db } from "@/db/index.js";
import { subjectModel, createSubjectSchema, Subject } from "@/features/course-design/models/subject.model.js";
import { and, eq, ilike } from "drizzle-orm";
import * as XLSX from "xlsx";
import fs from "fs";

// Bulk upload interface
export interface BulkUploadResult {
    success: Subject[];
    errors: Array<{
        row: number;
        data: unknown[];
        error: string;
    }>;
}

export async function createSubject(data: Subject) {
    const { id, createdAt, updatedAt, ...props } = data;
    const [existingSubject] = await db
        .select()
        .from(subjectModel)
        .where(
            and(
                ilike(subjectModel.code, data.code!.trim())
            )
        );

    if (existingSubject) return null;

    const [created] = await db.insert(subjectModel).values(props).returning();
    return created;
}

// Bulk upload subjects
export const bulkUploadSubjects = async (
    filePath: string,
    io?: any,
    uploadSessionId?: string
): Promise<BulkUploadResult> => {
    const result: BulkUploadResult = {
        success: [],
        errors: []
    };

    try {
        // Read the Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Skip header row and process data
        for (let i = 1; i < data.length; i++) {
            const row = data[i] as any[];
            const rowNumber = i + 1;

            try {
                // Map Excel columns to our model
                const subjectData = {
                    name: row[0]?.toString()?.trim(),
                    code: row[1]?.toString()?.trim() || null,
                    sequence: row[2] ? parseInt(row[2].toString()) : null,
                    disabled: row[3]?.toString()?.toLowerCase() === 'inactive' || row[3]?.toString()?.toLowerCase() === 'false',
                };

                // Validate required fields
                if (!subjectData.name) {
                    result.errors.push({
                        row: rowNumber,
                        data: row,
                        error: "Name is required"
                    });
                    continue;
                }

                // Check if code is unique (if provided)
                if (subjectData.code) {
                    const existingWithCode = await db
                        .select()
                        .from(subjectModel)
                        .where(eq(subjectModel.code, subjectData.code));

                    if (existingWithCode.length > 0) {
                        result.errors.push({
                            row: rowNumber,
                            data: row,
                            error: `Code ${subjectData.code} already exists`
                        });
                        continue;
                    }
                }

                // Check if sequence is unique (if provided)
                if (subjectData.sequence !== null) {
                    const existingWithSequence = await db
                        .select()
                        .from(subjectModel)
                        .where(eq(subjectModel.sequence, subjectData.sequence));

                    if (existingWithSequence.length > 0) {
                        result.errors.push({
                            row: rowNumber,
                            data: row,
                            error: `Sequence ${subjectData.sequence} already exists`
                        });
                        continue;
                    }
                }

                // Insert the subject
                const newSubject = await db
                    .insert(subjectModel)
                    .values(subjectData)
                    .returning();

                result.success.push(newSubject[0]);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                result.errors.push({
                    row: rowNumber,
                    data: row,
                    error: errorMessage
                });
            }

            // Emit progress
            if (io && uploadSessionId) {
                io.to(uploadSessionId).emit("bulk-upload-progress", {
                    processed: i,
                    total: data.length - 1,
                    percent: Math.round((i / (data.length - 1)) * 100)
                });
            }
        }

        // Emit completion/failure event
        if (io && uploadSessionId) {
            if (result.errors.length > 0) {
                io.to(uploadSessionId).emit("bulk-upload-failed", {
                    errorCount: result.errors.length
                });
            } else {
                io.to(uploadSessionId).emit("bulk-upload-done", {
                    successCount: result.success.length
                });
            }
        }

        // Clean up the temporary file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return result;
    } catch (error: unknown) {
        // Clean up the temporary file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        throw new Error(`Failed to process Excel file: ${errorMessage}`);
    }
};

export async function getSubjectById(id: number) {
    const [subject] = await db.select().from(subjectModel).where(eq(subjectModel.id, id));
    return subject;
}

export async function getAllSubjects() {
    return db.select().from(subjectModel);
}

export async function updateSubject(id: number, data: Partial<Subject>) {
    const { id: idObj, createdAt, updatedAt, ...props } = data;
    const [updated] = await db.update(subjectModel).set(props).where(eq(subjectModel.id, id)).returning();
    return updated;
}

export async function deleteSubject(id: number) {
    const [deleted] = await db.delete(subjectModel).where(eq(subjectModel.id, id)).returning();
    return deleted;
} 
