import { db } from "@/db/index.js";
import { AppModule, appModuleModel } from "@repo/db/schemas";
import { eq } from "drizzle-orm";

export async function findAppModuleById(id: number): Promise<AppModule | null> {
  const [found] = await db
    .select()
    .from(appModuleModel)
    .where(eq(appModuleModel.id, id));
  return found || null;
}

export async function findAllAppModules(): Promise<AppModule[]> {
  return await db.select().from(appModuleModel).orderBy(appModuleModel.name);
}

export async function createAppModule(
  data: Omit<AppModule, "id" | "createdAt" | "updatedAt">,
): Promise<AppModule> {
  const [newItem] = await db
    .insert(appModuleModel)
    .values({ ...data, createdAt: new Date(), updatedAt: new Date() })
    .returning();

  return newItem;
}

export async function updateAppModule(
  id: number,
  data: Partial<Omit<AppModule, "id" | "createdAt" | "updatedAt">>,
): Promise<AppModule | null> {
  const [updated] = await db
    .update(appModuleModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(appModuleModel.id, id))
    .returning();

  return updated || null;
}

export async function deleteAppModule(id: number): Promise<AppModule | null> {
  const [deleted] = await db
    .delete(appModuleModel)
    .where(eq(appModuleModel.id, id))
    .returning();
  return deleted || null;
}

export async function findAppModuleByName(
  name: string,
): Promise<AppModule | null> {
  const [found] = await db
    .select()
    .from(appModuleModel)
    .where(eq(appModuleModel.name, name));
  return found || null;
}

export async function findAppModuleByUrl(
  url: string,
): Promise<AppModule | null> {
  const [found] = await db
    .select()
    .from(appModuleModel)
    .where(eq(appModuleModel.moduleUrl, url));
  return found || null;
}
