import { db } from "@/db/index.js";
import { and, eq, ilike, ne } from "drizzle-orm";
import {
  AppModule,
  AppModuleT,
  appModuleModel,
} from "@repo/db/schemas/models/administration";
import { AppModuleDto } from "@repo/db/dtos/administration";

function normaliseAppModulePayload<T extends Partial<AppModule | AppModuleT>>(
  data: T,
) {
  const clone = { ...data };

  if (clone.name && typeof clone.name === "string") {
    clone.name = clone.name.trim() as T["name"];
  }

  if (
    clone.description !== undefined &&
    clone.description !== null &&
    typeof clone.description === "string"
  ) {
    clone.description = clone.description.trim() as T["description"];
  }

  if (
    clone.moduleUrl !== undefined &&
    clone.moduleUrl !== null &&
    typeof clone.moduleUrl === "string"
  ) {
    clone.moduleUrl = clone.moduleUrl.trim() as T["moduleUrl"];
  }

  if (
    clone.iconValue !== undefined &&
    clone.iconValue !== null &&
    typeof clone.iconValue === "string"
  ) {
    clone.iconValue = clone.iconValue.trim() as T["iconValue"];
  }

  if (
    clone.image !== undefined &&
    clone.image !== null &&
    typeof clone.image === "string"
  ) {
    clone.image = clone.image.trim() as T["image"];
  }

  return clone;
}

async function ensureUniqueName(
  name: string,
  excludeId?: number,
): Promise<boolean> {
  const trimmedName = name.trim();
  const whereClause =
    excludeId !== undefined
      ? and(
          ilike(appModuleModel.name, trimmedName),
          ne(appModuleModel.id, excludeId),
        )
      : ilike(appModuleModel.name, trimmedName);

  const [existing] = await db.select().from(appModuleModel).where(whereClause);

  return Boolean(existing);
}

async function modelToDto(
  model: typeof appModuleModel.$inferSelect | null,
  seen = new Set<number>(),
): Promise<AppModuleDto | null> {
  if (!model) return null;
  if (seen.has(model.id)) return null;

  let parentAppModule: AppModuleDto | null = null;

  if (model.parentAppModuleId) {
    seen.add(model.id);
    const [parent] = await db
      .select()
      .from(appModuleModel)
      .where(eq(appModuleModel.id, model.parentAppModuleId));
    parentAppModule = await modelToDto(parent ?? null, seen);
    seen.delete(model.id);
  }

  const { parentAppModuleId: _, ...rest } = model;
  return {
    ...rest,
    parentAppModule,
  };
}

export async function createAppModule(data: AppModule) {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as AppModuleT;

  const payload = normaliseAppModulePayload(rest);

  if (!payload.name) {
    throw new Error("App module name is required.");
  }

  if (!payload.application) {
    throw new Error("Application is required.");
  }

  if (!payload.moduleUrl) {
    throw new Error("Module URL is required.");
  }

  if (await ensureUniqueName(payload.name)) {
    throw new Error("App module name already exists.");
  }

  const [created] = await db.insert(appModuleModel).values(payload).returning();

  return await modelToDto(created);
}

export async function getAllAppModules() {
  const rows = await db.select().from(appModuleModel);
  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter((dto): dto is AppModuleDto => dto !== null);
}

export async function findAppModuleById(id: number) {
  const [row] = await db
    .select()
    .from(appModuleModel)
    .where(eq(appModuleModel.id, id));

  return await modelToDto(row ?? null);
}

export async function updateAppModule(
  id: number,
  data: Partial<AppModuleT> | Partial<AppModule>,
) {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as Partial<AppModuleT>;

  const payload = normaliseAppModulePayload(rest);

  if (payload.name && (await ensureUniqueName(payload.name, id))) {
    throw new Error("App module name already exists.");
  }

  const [updated] = await db
    .update(appModuleModel)
    .set(payload)
    .where(eq(appModuleModel.id, id))
    .returning();

  return await modelToDto(updated ?? null);
}

export async function deleteAppModuleSafe(id: number) {
  const [found] = await db
    .select()
    .from(appModuleModel)
    .where(eq(appModuleModel.id, id));

  if (!found) return null;

  const [deleted] = await db
    .delete(appModuleModel)
    .where(eq(appModuleModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "App module deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete app module.",
    records: [],
  };
}
