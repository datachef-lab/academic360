import { db } from "@/db/index";
import { LanguageMedium, languageMediumModel } from "../models/languageMedium.model";
import { eq } from "drizzle-orm";

export async function addLanguageMedium(languageMedium: LanguageMedium): Promise<LanguageMedium | null> {
    const [newLanguageMedium] = await db.insert(languageMediumModel).values(languageMedium).returning();
    return newLanguageMedium;
}

export async function findLanguageMediumById(id: number): Promise<LanguageMedium | null> {
    const [foundLanguageMedium] = await db.select().from(languageMediumModel).where(eq(languageMediumModel.id, id));
    return foundLanguageMedium;
}

export async function findLanguageMediumByName(name: string): Promise<LanguageMedium | null> {
    const [foundLanguageMedium] = await db.select().from(languageMediumModel).where(eq(languageMediumModel.name, name.toUpperCase().trim()));
    return foundLanguageMedium;
}