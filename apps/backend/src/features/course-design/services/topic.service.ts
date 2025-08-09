import { db } from "@/db/index.js";
import { Topic, topicModel } from "../models/topic.model.js";
import { and, eq, ilike } from "drizzle-orm";
import XLSX from "xlsx";
import fs from "fs";

export interface BulkUploadResult {
    success: Topic[];
    errors: Array<{ row: number; data: unknown[]; error: string }>;
}

export const bulkUploadTopics = async (
    filePath: string,
    io?: any,
    uploadSessionId?: string
): Promise<BulkUploadResult> => {
    const result: BulkUploadResult = { success: [], errors: [] };
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        for (let i = 1; i < data.length; i++) {
            const row = data[i] as any[];
            const rowNumber = i + 1;
            try {
                const topicData = {
                    name: row[0]?.toString()?.trim(),
                    paperId: row[1] ? parseInt(row[1].toString()) : null,
                };
                if (!topicData.name) {
                    result.errors.push({ row: rowNumber, data: row, error: "Name is required" });
                    continue;
                }
                // Insert the topic
                const [newTopic] = await db.insert(topicModel).values({
                    name: topicData.name,
                    paperId: topicData.paperId!,
                }).returning();
                result.success.push(newTopic);
            } catch (error: unknown) {
                result.errors.push({ row: rowNumber, data: row, error: error instanceof Error ? error.message : "Unknown error" });
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

export async function createTopic(data: Topic) {
    const { id, createdAt, updatedAt, ...props } = data;
    let [existingTopic] = await db
        .select().from(topicModel).where(
            and(
                ilike(topicModel.name, props.name.trim()),
                eq(topicModel.paperId, props.paperId)
            )
        );
    if (!existingTopic) {
        const [created] = await db.insert(topicModel).values(props).returning();
        existingTopic = created;
    }
    return existingTopic;
}

export async function getTopicById(id: number) {
    const [topic] = await db.select().from(topicModel).where(eq(topicModel.id, id));
    return topic;
}

export async function getTopicsByPaperId(paperId: number) {
    const topics = await db.select().from(topicModel).where(eq(topicModel.paperId, paperId));
    return topics;
}

export async function getAllTopics() {
    return db.select().from(topicModel);
}

export async function updateTopic(id: number, data: Partial<Topic>) {
    const { id: idObj, createdAt, updatedAt, ...props } = data;
    const [updated] = await db.update(topicModel).set(props).where(eq(topicModel.id, id)).returning();
    return updated;
}

export async function deleteTopic(id: number) {
    const [deleted] = await db.delete(topicModel).where(eq(topicModel.id, id)).returning();
    return deleted;
} 
