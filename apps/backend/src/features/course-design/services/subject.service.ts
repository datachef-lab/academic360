import { db } from "@/db/index.js";
import { subjectModel, createSubjectSchema, Subject } from "@/features/course-design/models/subject.model.js";
import { eq } from "drizzle-orm";

export async function createSubject(data: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>) {
    const validated = createSubjectSchema.parse(data);
    const [created] = await db.insert(subjectModel).values(validated).returning();
    return created;
}

export async function getSubjectById(id: number) {
    const [subject] = await db.select().from(subjectModel).where(eq(subjectModel.id, id));
    return subject;
}

export async function getAllSubjects() {
    return db.select().from(subjectModel);
}

export async function updateSubject(id: number, data: Partial<Subject>) {
    const { createdAt, updatedAt, ...rest } = data;
    const validated = createSubjectSchema.partial().parse(rest);
    const [updated] = await db.update(subjectModel).set(validated).where(eq(subjectModel.id, id)).returning();
    return updated;
}

export async function deleteSubject(id: number) {
    const [deleted] = await db.delete(subjectModel).where(eq(subjectModel.id, id)).returning();
    return deleted;
} 
