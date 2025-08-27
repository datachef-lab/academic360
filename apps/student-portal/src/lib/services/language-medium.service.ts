import { dbPostgres } from "@/db";
import { languageMedium } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";

export type LanguageMediumResult = {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
};

export async function getAllLanguageMediums() {
  return await dbPostgres.select().from(languageMedium).where(eq(languageMedium.disabled, false)).orderBy(languageMedium.name);
}

export async function getLanguageMediumById(id: number) {
  const result = await dbPostgres.select().from(languageMedium).where(eq(languageMedium.id, id)).limit(1);
  return result[0];
}

export async function createLanguageMedium(name: string): Promise<LanguageMediumResult> {
  try {
    const existingMedium = await dbPostgres.select().from(languageMedium).where(ilike(languageMedium.name, name)).limit(1);

    if (existingMedium.length > 0) {
      return { success: false, error: "Language medium with this name already exists." };
    }

    const [newMedium] = await dbPostgres.insert(languageMedium).values({ name }).returning();
    return { success: true, message: "Language medium created successfully.", data: newMedium };
  } catch (error) {
    console.error("Error creating language medium:", error);
    return { success: false, error: "Failed to create language medium." };
  }
}

export async function updateLanguageMedium(id: number, name: string): Promise<LanguageMediumResult> {
  try {
    const existingMedium = await dbPostgres.select().from(languageMedium).where(ilike(languageMedium.name, name)).limit(1);

    if (existingMedium.length > 0 && existingMedium[0].id !== id) {
      return { success: false, error: "Language medium with this name already exists." };
    }

    const [updatedMedium] = await dbPostgres.update(languageMedium).set({ name, updatedAt: new Date().toISOString() }).where(eq(languageMedium.id, id)).returning();

    if (!updatedMedium) {
      return { success: false, error: "Language medium not found." };
    }
    return { success: true, message: "Language medium updated successfully.", data: updatedMedium };
  } catch (error) {
    console.error("Error updating language medium:", error);
    return { success: false, error: "Failed to update language medium." };
  }
}

export async function toggleLanguageMediumStatus(id: number): Promise<LanguageMediumResult> {
  try {
    const currentMedium = await getLanguageMediumById(id);

    if (!currentMedium) {
      return { success: false, error: "Language medium not found." };
    }

    const [updatedMedium] = await dbPostgres.update(languageMedium).set({ disabled: !currentMedium.disabled, updatedAt: new Date().toISOString() }).where(eq(languageMedium.id, id)).returning();

    return { success: true, message: `Language medium ${updatedMedium?.disabled ? "disabled" : "enabled"} successfully.`, data: updatedMedium };
  } catch (error) {
    console.error("Error toggling language medium status:", error);
    return { success: false, error: "Failed to toggle language medium status." };
  }
} 