import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import {
  appModuleModel,
  type AppModuleT,
} from "@repo/db/schemas/models/administration/app-module.model.js";
import type { AppModuleDto } from "@repo/db/dtos/administration/index.js";

type CreateAppModuleInput = Omit<AppModuleT, "id" | "createdAt" | "updatedAt">;
type UpdateAppModuleInput = Partial<CreateAppModuleInput>;

function toAppModuleDto(model: AppModuleT): AppModuleDto {
  const { parentAppModuleId, ...rest } = model;
  return { ...rest, parentAppModule: null };
}

export async function getAllAppModules(): Promise<AppModuleDto[]> {
  const rows = await db
    .select()
    .from(appModuleModel)
    .orderBy(appModuleModel.name);
  return rows.map(toAppModuleDto);
}

export async function getAppModuleById(
  id: number,
): Promise<AppModuleDto | null> {
  const [appModule] = await db
    .select()
    .from(appModuleModel)
    .where(eq(appModuleModel.id, id));
  return appModule ? toAppModuleDto(appModule) : null;
}

export async function getAppModuleByName(
  name: string,
): Promise<AppModuleDto | null> {
  const [appModule] = await db
    .select()
    .from(appModuleModel)
    .where(eq(appModuleModel.name, name));
  return appModule ? toAppModuleDto(appModule) : null;
}

export async function createAppModule(
  data: CreateAppModuleInput,
): Promise<AppModuleDto> {
  const [created] = await db.insert(appModuleModel).values(data).returning();
  return toAppModuleDto(created);
}

export async function updateAppModule(
  id: number,
  data: UpdateAppModuleInput,
): Promise<AppModuleDto | null> {
  const [updated] = await db
    .update(appModuleModel)
    .set(data)
    .where(eq(appModuleModel.id, id))
    .returning();
  return updated ? toAppModuleDto(updated) : null;
}

export async function deleteAppModule(
  id: number,
): Promise<AppModuleDto | null> {
  const [deleted] = await db
    .delete(appModuleModel)
    .where(eq(appModuleModel.id, id))
    .returning();
  return deleted ? toAppModuleDto(deleted) : null;
}
