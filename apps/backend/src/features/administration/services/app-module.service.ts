import { db } from "@/db/index.js";
import { and, eq, ilike, ne } from "drizzle-orm";
import {
  AppModule,
  AppModuleT,
  appModuleModel,
} from "@repo/db/schemas/models/administration";
import { AppModuleDto } from "@repo/db/dtos/administration";
import { appModuleData } from "@/features/default-administration-data";
import fs from "fs";
import path from "path";

const APP_MODULE_IMAGE_BASE_PATH =
  process.env.APP_MODULE_IMAGE_BASE_PATH || "./public/app-module-images";

export async function loadDefaultAppModules() {
  for (const primaryAppModule of appModuleData.defaultPrimaryAppModules) {
    const [existingAppModule] = await db
      .select()
      .from(appModuleModel)
      .where(
        ilike(
          appModuleModel.componentKey,
          primaryAppModule.componentKey.trim(),
        ),
      );

    if (existingAppModule) continue;

    const { parentAppModule: _parent, ...rest } = primaryAppModule;
    const insertPayload = { ...rest, parentAppModuleId: null };

    const [created] = await db
      .insert(appModuleModel)
      .values(insertPayload as typeof appModuleModel.$inferInsert)
      .returning();
    if (created) {
      console.log(
        `Primary app module ${primaryAppModule.componentKey} created successfully.`,
      );
    } else {
      console.error(
        `Failed to create primary app module ${primaryAppModule.componentKey}.`,
      );
    }
  }
}

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

async function ensureUniqueComponentKey(
  componentKey: string,
  excludeId?: number,
): Promise<boolean> {
  const trimmed = componentKey.trim();
  const whereClause =
    excludeId !== undefined
      ? and(
          ilike(appModuleModel.componentKey, trimmed),
          ne(appModuleModel.id, excludeId),
        )
      : ilike(appModuleModel.componentKey, trimmed);

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

/**
 * Saves image to APP_MODULE_IMAGE_BASE_PATH using app module ID.
 * Structure: basePath/{id}/cover.{ext}
 */
export async function saveAppModuleImage(
  appModuleId: number,
  file: Express.Multer.File,
): Promise<string> {
  const basePath = path.resolve(APP_MODULE_IMAGE_BASE_PATH);
  const folderPath = path.join(basePath, String(appModuleId));
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const ext = path.extname(file.originalname) || ".png";
  const filename = `cover${ext}`;
  const filePath = path.join(folderPath, filename);

  const buffer =
    "buffer" in file && Buffer.isBuffer(file.buffer)
      ? file.buffer
      : fs.readFileSync((file as Express.Multer.File & { path: string }).path);
  fs.writeFileSync(filePath, buffer);

  // Store canonical URL path: app-module-images/{id}/cover.ext (matches /app-module-images static route)
  return `app-module-images/${appModuleId}/cover${ext}`;
}

export type AppModuleCreateInput = Omit<
  AppModuleT,
  "id" | "createdAt" | "updatedAt"
>;
export type AppModuleUpdateInput = Partial<AppModuleCreateInput> & {
  childAppModules?: Partial<AppModuleCreateInput>[];
};

export async function createAppModule(
  data: AppModuleCreateInput,
  imageFile?: Express.Multer.File,
) {
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

  if (!payload.componentKey) {
    throw new Error("Component key is required.");
  }

  if (await ensureUniqueName(payload.name)) {
    throw new Error("App module name already exists.");
  }

  if (await ensureUniqueComponentKey(payload.componentKey)) {
    throw new Error("Component key already exists.");
  }

  const { image: _img, ...insertRest } = payload;
  const [created] = await db
    .insert(appModuleModel)
    .values({
      ...insertRest,
      image: null,
    } as typeof appModuleModel.$inferInsert)
    .returning();

  if (!created) return null;

  // Save image using app module ID (insert first to get ID)
  let imagePath: string | null = null;
  if (imageFile && created.id) {
    imagePath = await saveAppModuleImage(created.id, imageFile);
    const [updated] = await db
      .update(appModuleModel)
      .set({ image: imagePath })
      .where(eq(appModuleModel.id, created.id))
      .returning();
    if (updated) return await modelToDto(updated);
  }

  return await modelToDto(created);
}

export async function getAllAppModules() {
  const rows = await db
    .select()
    .from(appModuleModel)
    .orderBy(appModuleModel.id);
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

async function upsertChildAppModule(
  parentId: number,
  child: Partial<AppModuleCreateInput> & { id?: number },
): Promise<typeof appModuleModel.$inferSelect | null> {
  const payload = normaliseAppModulePayload({
    ...child,
    parentAppModuleId: parentId,
  });

  const childId = child.id;

  if (childId != null) {
    const [existing] = await db
      .select()
      .from(appModuleModel)
      .where(eq(appModuleModel.id, childId));

    if (!existing) return null;
    if (existing.parentAppModuleId !== parentId) {
      throw new Error(
        `Child app module id ${childId} does not belong to this parent.`,
      );
    }

    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      parentAppModuleId: _pid,
      ...rest
    } = payload as Partial<AppModuleT>;
    const updateData = { ...rest };
    if (payload.name && (await ensureUniqueName(payload.name, childId))) {
      throw new Error(`App module name "${payload.name}" already exists.`);
    }
    if (
      payload.componentKey &&
      (await ensureUniqueComponentKey(payload.componentKey, childId))
    ) {
      throw new Error(
        `Component key "${payload.componentKey}" already exists.`,
      );
    }

    const [updated] = await db
      .update(appModuleModel)
      .set(updateData)
      .where(eq(appModuleModel.id, childId))
      .returning();
    return updated ?? null;
  } else {
    if (
      !payload.name ||
      !payload.application ||
      !payload.moduleUrl ||
      !payload.componentKey
    ) {
      throw new Error(
        "Child module must have name, application, moduleUrl, and componentKey.",
      );
    }
    if (await ensureUniqueName(payload.name)) {
      throw new Error(`App module name "${payload.name}" already exists.`);
    }
    if (await ensureUniqueComponentKey(payload.componentKey)) {
      throw new Error(
        `Component key "${payload.componentKey}" already exists.`,
      );
    }

    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...rest
    } = payload as Partial<AppModuleT>;
    const [created] = await db
      .insert(appModuleModel)
      .values({
        ...rest,
        parentAppModuleId: parentId,
      } as typeof appModuleModel.$inferInsert)
      .returning();
    return created ?? null;
  }
}

export async function updateAppModule(
  id: number,
  data: AppModuleUpdateInput,
  imageFile?: Express.Multer.File,
) {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    childAppModules: childModules,
    ...rest
  } = data as AppModuleUpdateInput & Partial<AppModuleT>;

  const payload = normaliseAppModulePayload(rest);

  if (payload.name && (await ensureUniqueName(payload.name, id))) {
    throw new Error("App module name already exists.");
  }

  if (
    payload.componentKey &&
    (await ensureUniqueComponentKey(payload.componentKey, id))
  ) {
    throw new Error("Component key already exists.");
  }

  const [existing] = await db
    .select()
    .from(appModuleModel)
    .where(eq(appModuleModel.id, id));
  if (!existing) return null;

  // Image is always derived from file upload or existing DB value, never from client payload
  let imagePath = existing.image;
  if (imageFile) {
    imagePath = await saveAppModuleImage(id, imageFile);
  }

  const { image: _payloadImage, ...payloadWithoutImage } = payload as Record<
    string,
    unknown
  >;
  const updateData: Record<string, unknown> = {
    ...payloadWithoutImage,
    image: imagePath,
  };
  const filtered = Object.fromEntries(
    Object.entries(updateData).filter(([, v]) => v !== undefined),
  );
  const [updated] = await db
    .update(appModuleModel)
    .set(filtered as Partial<typeof appModuleModel.$inferInsert>)
    .where(eq(appModuleModel.id, id))
    .returning();

  if (!updated) return null;

  if (Array.isArray(childModules) && childModules.length > 0) {
    for (const child of childModules) {
      await upsertChildAppModule(id, child);
    }
  }

  return await modelToDto(updated);
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
