import { dbPostgres } from "@/db";
import { sportsCategories, SportsCategory } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createSportCategory(givenSportCategory: Omit<SportsCategory, 'id'>) {
  const [newCategory] = await dbPostgres
    .insert(sportsCategories)
    .values(givenSportCategory)
    .returning();
  return newCategory;
}

export async function getAllSportCategories() {
  return await dbPostgres.select().from(sportsCategories);
}

export async function getSportCategoryById(id: number) {
  const [category] = await dbPostgres
    .select()
    .from(sportsCategories)
    .where(eq(sportsCategories.id, id));
  return category || null;
}

export async function updateSportCategory(id: number, update: Partial<typeof sportsCategories._.inferInsert>) {
  const [updated] = await dbPostgres
    .update(sportsCategories)
    .set(update)
    .where(eq(sportsCategories.id, id))
    .returning();
  return updated;
}

export async function deleteSportCategory(id: number) {
  const [updated] = await dbPostgres
    .update(sportsCategories)
    .set({ disabled: true })
    .where(eq(sportsCategories.id, id))
    .returning();
  return !!updated;
}

export async function enableSportCategory(id: number) {
  const [updated] = await dbPostgres
    .update(sportsCategories)
    .set({ disabled: false })
    .where(eq(sportsCategories.id, id))
    .returning();
  return !!updated;
}