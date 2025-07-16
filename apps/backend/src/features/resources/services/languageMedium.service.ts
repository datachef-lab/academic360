import { db } from "@/db/index.js";
import { LanguageMedium, languageMediumModel } from "@/features/resources/models/languageMedium.model.js";
import { eq } from "drizzle-orm";

export async function addLanguageMedium(languageMedium: LanguageMedium): Promise<LanguageMedium | null> {
    const [newLanguageMedium] = await db.insert(languageMediumModel).values(languageMedium).returning();
    return newLanguageMedium;
}

export async function findLanguageMediumById(id: number): Promise<LanguageMedium | null> {
    const [foundLanguageMedium] = await db.select().from(languageMediumModel).where(eq(languageMediumModel.id, id));
    return foundLanguageMedium;
}

export async function findAllLanguageMediums(): Promise<LanguageMedium[]> {
    return await db.select().from(languageMediumModel).orderBy(languageMediumModel.sequence);
}

export async function createLanguageMedium(data: Omit<LanguageMedium, 'id' | 'createdAt' | 'updatedAt'>): Promise<LanguageMedium> {
    const [newLanguageMedium] = await db
        .insert(languageMediumModel)
        .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        .returning();
    
    return newLanguageMedium;
}

export async function updateLanguageMedium(id: number, data: Partial<Omit<LanguageMedium, 'id' | 'createdAt' | 'updatedAt'>>): Promise<LanguageMedium | null> {
    const [updatedLanguageMedium] = await db
        .update(languageMediumModel)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(languageMediumModel.id, id))
        .returning();
    
    return updatedLanguageMedium || null;
}

export async function deleteLanguageMedium(id: number): Promise<LanguageMedium | null> {
    const [deletedLanguageMedium] = await db
        .delete(languageMediumModel)
        .where(eq(languageMediumModel.id, id))
        .returning();
    
    return deletedLanguageMedium || null;
}

export async function findLanguageMediumByName(name: string): Promise<LanguageMedium | null> {
    const [foundLanguageMedium] = await db.select().from(languageMediumModel).where(eq(languageMediumModel.name, name.toUpperCase().trim()));
    return foundLanguageMedium;
}