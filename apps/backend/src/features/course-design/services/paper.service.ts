import { db } from "@/db/index.js";
import { paperModel, createPaperModel, Paper } from "@/features/course-design/models/paper.model.js";
import { eq } from "drizzle-orm";

export async function createPaper(data: Omit<Paper, 'id' | 'createdAt' | 'updatedAt'>) {
    const validated = createPaperModel.parse(data);
    const [created] = await db.insert(paperModel).values(validated).returning();
    return created;
}

export async function getPaperById(id: number) {
    const [paper] = await db.select().from(paperModel).where(eq(paperModel.id, id));
    return paper;
}

export async function getAllPapers() {
    return db.select().from(paperModel);
}

export async function updatePaper(id: number, data: Partial<Paper>) {
    const { createdAt, updatedAt, ...rest } = data;
    const validated = createPaperModel.partial().parse(rest);
    const [updated] = await db.update(paperModel).set(validated).where(eq(paperModel.id, id)).returning();
    return updated;
}

export async function deletePaper(id: number) {
    const [deleted] = await db.delete(paperModel).where(eq(paperModel.id, id)).returning();
    return deleted;
} 