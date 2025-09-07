import { db } from "@/db/index.js";
import { Stream, streamModel } from "@repo/db/schemas/models/course-design";
import { countDistinct, eq, ilike } from "drizzle-orm";
import { programCourseModel } from "@repo/db/schemas/models/course-design";
import XLSX from "xlsx";
import fs from "fs";

// Bulk upload interface
export interface BulkUploadResult {
    success: Stream[];
    errors: Array<{
        row: number;
        data: unknown[];
        error: string;
    }>;
}

export async function createStream(data: Stream) {
    const { id, createdAt, updatedAt, ...props } = data;
    const [existingStream] = await db
        .select()
        .from(streamModel)
        .where(eq(streamModel.code, data.code.trim()));
    if (existingStream) return null;
    const [created] = await db.insert(streamModel).values(props).returning();
    return created;
}

// Bulk upload streams
export const bulkUploadStreams = async (
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
        const streamData = {
          name: row[0]?.toString()?.trim(),
          code: row[1]?.toString()?.trim(),
          shortName: row[2]?.toString()?.trim() || null,
          sequence: row[3] ? parseInt(row[3].toString()) : null,
          disabled: row[4]?.toString()?.toLowerCase() === 'inactive' || row[4]?.toString()?.toLowerCase() === 'false',
        };

        // Validate required fields
        if (!streamData.name) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: "Name is required"
          });
          continue;
        }
        if (!streamData.code) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: "Code is required"
          });
          continue;
        }
        // Insert the stream
        const [newStream] = await db.insert(streamModel).values(streamData).returning();
        result.success.push(newStream);
      } catch (error: unknown) {
        result.errors.push({
          row: rowNumber,
          data: row,
          error: error instanceof Error ? error.message : "Unknown error"
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
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (io && uploadSessionId) {
      if (result.errors.length > 0) {
        io.to(uploadSessionId).emit("bulk-upload-failed", { errorCount: result.errors.length });
      } else {
        io.to(uploadSessionId).emit("bulk-upload-done", { successCount: result.success.length });
      }
    }
    return result;
  } catch (error: unknown) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw new Error(`Failed to process Excel file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

export async function findById(id: number) {
    const [stream] = await db.select().from(streamModel).where(eq(streamModel.id, id));
    return stream;
}

export async function getAllStreams() {
    return db.select().from(streamModel);
}

export async function updateStream(id: number, data: Partial<Stream>) {
    const { id: idObj, createdAt, updatedAt, ...props } = data;
    const [updated] = await db.update(streamModel).set(props).where(eq(streamModel.id, id)).returning();
    return updated;
}

export async function deleteStream(id: number) {
    const [deleted] = await db.delete(streamModel).where(eq(streamModel.id, id)).returning();
    return deleted;
} 

export async function deleteStreamSafe(id: number) {
    const [found] = await db.select().from(streamModel).where(eq(streamModel.id, id));
    if (!found) return null;

    const [{ programCourseCount }] = await db
        .select({ programCourseCount: countDistinct(programCourseModel.id) })
        .from(programCourseModel)
        .where(eq(programCourseModel.streamId, id));

    if (programCourseCount > 0) {
        return {
            success: false,
            message: "Cannot delete stream. It is associated with other records.",
            records: [{ count: programCourseCount, type: "Program-course" }],
        };
    }

    const [deleted] = await db.delete(streamModel).where(eq(streamModel.id, id)).returning();
    if (deleted) return { success: true, message: "Stream deleted successfully.", records: [] };
    return { success: false, message: "Failed to delete stream.", records: [] };
}
