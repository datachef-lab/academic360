import { db } from "@/db/index.js";
import { and, eq, ilike, ne } from "drizzle-orm";
import {
  designationModel,
  Designation,
  DesignationT,
} from "@repo/db/schemas/models/administration";

function normaliseDesignationPayload<
  T extends Partial<Designation | DesignationT>,
>(data: T) {
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
    clone.code !== undefined &&
    clone.code !== null &&
    typeof clone.code === "string"
  ) {
    clone.code = clone.code.trim() as T["code"];
  }

  if (
    clone.color !== undefined &&
    clone.color !== null &&
    typeof clone.color === "string"
  ) {
    clone.color = clone.color.trim() as T["color"];
  }

  if (
    clone.bgColor !== undefined &&
    clone.bgColor !== null &&
    typeof clone.bgColor === "string"
  ) {
    clone.bgColor = clone.bgColor.trim() as T["bgColor"];
  }

  return clone;
}

async function ensureUniqueDesignationName(
  name: string,
  excludeId?: number,
): Promise<boolean> {
  const trimmedName = name.trim();

  const whereClause =
    excludeId !== undefined
      ? and(
          ilike(designationModel.name, trimmedName),
          ne(designationModel.id, excludeId),
        )
      : ilike(designationModel.name, trimmedName);

  const [existing] = await db
    .select()
    .from(designationModel)
    .where(whereClause);

  return Boolean(existing);
}

export async function createDesignation(data: Designation) {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as DesignationT;

  const payload = normaliseDesignationPayload(rest);

  if (!payload.name) {
    throw new Error("Designation name is required.");
  }

  if (await ensureUniqueDesignationName(payload.name)) {
    throw new Error("Designation name already exists.");
  }

  const [created] = await db
    .insert(designationModel)
    .values(payload)
    .returning();

  return created;
}

export async function getAllDesignations() {
  return db.select().from(designationModel);
}

export async function findDesignationById(id: number) {
  const [found] = await db
    .select()
    .from(designationModel)
    .where(eq(designationModel.id, id));

  return found ?? null;
}

export async function updateDesignation(
  id: number,
  data: Partial<DesignationT> | Partial<Designation>,
) {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as Partial<DesignationT>;

  const payload = normaliseDesignationPayload(rest);

  if (payload.name && (await ensureUniqueDesignationName(payload.name, id))) {
    throw new Error("Designation name already exists.");
  }

  const [updated] = await db
    .update(designationModel)
    .set(payload)
    .where(eq(designationModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteDesignationSafe(
  id: number,
): Promise<null | { success: boolean; message: string; records: unknown[] }> {
  const [found] = await db
    .select()
    .from(designationModel)
    .where(eq(designationModel.id, id));

  if (!found) return null;

  const [deleted] = await db
    .delete(designationModel)
    .where(eq(designationModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "Designation deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete designation.",
    records: [],
  };
}
