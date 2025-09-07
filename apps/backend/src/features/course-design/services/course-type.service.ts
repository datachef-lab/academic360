import { db } from "@/db/index.js";
import { CourseType, courseTypeModel } from "@repo/db/schemas";
import { countDistinct, eq, ilike } from "drizzle-orm";
import { programCourseModel } from "@repo/db/schemas/models/course-design";
import XLSX from "xlsx";
import fs from "fs";

// Bulk upload interface
export interface BulkUploadResult {
    success: CourseType[];
    errors: Array<{
        row: number;
        data: unknown[];
        error: string;
    }>;
}

const defaultCourseType: CourseType[] = [
    {
        name: "Honours",
        shortName: "H",
    },
    {
        name: "General",
        shortName: "G",
    }
]

export async function loadCourseType() {
    for (const courseType of defaultCourseType) {
        const [existingCourseType] = await db
            .select()
            .from(courseTypeModel)
            .where(ilike(courseTypeModel.name, courseType.name.trim()));
        if (existingCourseType) continue;

        const [created] = await db.insert(courseTypeModel).values(courseType).returning();

    }
}

export async function createCourseType(data: CourseType) {
    const { id, createdAt, updatedAt, ...props } = data;

    const [existingCourseType] = await db
        .select()
        .from(courseTypeModel)
        .where(ilike(courseTypeModel.name, data.name.trim()));

    if (existingCourseType) return null;

    const [created] = await db.insert(courseTypeModel).values(props).returning();
    return created;
}

// Bulk upload course types
export const bulkUploadCourseTypes = async (
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
                const courseTypeData = {
                    name: row[0]?.toString()?.trim(),
                    shortName: row[1]?.toString()?.trim() || null,
                    sequence: row[2] ? parseInt(row[2].toString()) : null,
                    disabled: row[3]?.toString()?.toLowerCase() === 'inactive' || row[3]?.toString()?.toLowerCase() === 'false',
                };

                // Validate required fields
                if (!courseTypeData.name) {
                    result.errors.push({
                        row: rowNumber,
                        data: row,
                        error: "Name is required"
                    });
                    continue;
                }

                // Check if sequence is unique (if provided)
                if (courseTypeData.sequence !== null) {
                    const existingWithSequence = await db
                        .select()
                        .from(courseTypeModel)
                        .where(eq(courseTypeModel.sequence, courseTypeData.sequence));

                    if (existingWithSequence.length > 0) {
                        result.errors.push({
                            row: rowNumber,
                            data: row,
                            error: `Sequence ${courseTypeData.sequence} already exists`
                        });
                        continue;
                    }
                }

                // Insert the course type
                const newCourseType = await db
                    .insert(courseTypeModel)
                    .values(courseTypeData)
                    .returning();

                result.success.push(newCourseType[0]);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                result.errors.push({
                    row: rowNumber,
                    data: row,
                    error: errorMessage
                });
            }
            if (io && uploadSessionId) {
                io.to(uploadSessionId).emit("bulk-upload-progress", {
                    processed: i,
                    total: data.length - 1,
                    percent: Math.round((i / (data.length - 1)) * 100)
                });
            }
        }

        // Clean up the temporary file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        if (io && uploadSessionId) {
            if (result.errors.length > 0) {
                io.to(uploadSessionId).emit("bulk-upload-failed", { errorCount: result.errors.length });
            } else {
                io.to(uploadSessionId).emit("bulk-upload-done", { successCount: result.success.length });
            }
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

export async function findById(id: number) {
    const [courseType] = await db.select().from(courseTypeModel).where(eq(courseTypeModel.id, id));
    return courseType;
}

export async function getAllCourseTypes() {
    return db.select().from(courseTypeModel);
}

export async function updateCourseType(id: number, data: Partial<CourseType>) {
    const { id: idObj, createdAt, updatedAt, ...props } = data;
    const [updated] = await db.update(courseTypeModel).set(props).where(eq(courseTypeModel.id, id)).returning();
    return updated;
}

export async function deleteCourseType(id: number) {
    const [deleted] = await db.delete(courseTypeModel).where(eq(courseTypeModel.id, id)).returning();
    return deleted;
}

export async function deleteCourseTypeSafe(id: number) {
    const [found] = await db.select().from(courseTypeModel).where(eq(courseTypeModel.id, id));
    if (!found) return null;

    const [{ programCourseCount }] = await db
        .select({ programCourseCount: countDistinct(programCourseModel.id) })
        .from(programCourseModel)
        .where(eq(programCourseModel.courseTypeId, id));

    if (programCourseCount > 0) {
        return {
            success: false,
            message: "Cannot delete course-type. It is associated with other records.",
            records: [{ count: programCourseCount, type: "Program-course" }],
        };
    }

    const [deleted] = await db.delete(courseTypeModel).where(eq(courseTypeModel.id, id)).returning();
    if (deleted) return { success: true, message: "Course-type deleted successfully.", records: [] };
    return { success: false, message: "Failed to delete course-type.", records: [] };
}
