import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { Qualification, qualificationModel } from "@/features/resources/models/qualification.model.js";

export async function addQualification(qualification: Qualification): Promise<Qualification | null> {
    const [newQualification] = await db.insert(qualificationModel).values(qualification).returning();
    return newQualification;
}

export async function findQualificationById(id: number): Promise<Qualification | null> {
    const [foundQualification] = await db.select().from(qualificationModel).where(eq(qualificationModel.id, id));
    return foundQualification;
}

export async function findAllQualifications(): Promise<Qualification[]> {
    return await db.select().from(qualificationModel).orderBy(qualificationModel.sequence);
}

export async function createQualification(data: Omit<Qualification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Qualification> {
    const [newQualification] = await db
        .insert(qualificationModel)
        .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        .returning();
    
    return newQualification;
}

export async function updateQualification(id: number, data: Partial<Omit<Qualification, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Qualification | null> {
    const [updatedQualification] = await db
        .update(qualificationModel)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(qualificationModel.id, id))
        .returning();
    
    return updatedQualification || null;
}

export async function deleteQualification(id: number): Promise<Qualification | null> {
    const [deletedQualification] = await db
        .delete(qualificationModel)
        .where(eq(qualificationModel.id, id))
        .returning();
    
    return deletedQualification || null;
}

export async function findQualificationByName(name: string): Promise<Qualification | null> {
    const [foundQualification] = await db.select().from(qualificationModel).where(eq(qualificationModel.name, name.toUpperCase().trim()));
    return foundQualification;
}