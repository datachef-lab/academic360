import { db } from "@/db/index.js";
import { and, eq, ilike, ne } from "drizzle-orm";
import {
  Department,
  DepartmentT,
  departmentModel,
} from "@repo/db/schemas/models/administration";
import { DepartmentDto } from "@repo/db/dtos/administration";

function normaliseDepartmentPayload<
  T extends Partial<Department | DepartmentT>,
>(data: T) {
  const clone = { ...data };

  if (clone.name && typeof clone.name === "string") {
    clone.name = clone.name.trim() as T["name"];
  }

  if (
    clone.code !== undefined &&
    clone.code !== null &&
    typeof clone.code === "string"
  ) {
    clone.code = clone.code.trim() as T["code"];
  }

  if (
    clone.description !== undefined &&
    clone.description !== null &&
    typeof clone.description === "string"
  ) {
    clone.description = clone.description.trim() as T["description"];
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
          ilike(departmentModel.name, trimmedName),
          ne(departmentModel.id, excludeId),
        )
      : ilike(departmentModel.name, trimmedName);

  const [existing] = await db.select().from(departmentModel).where(whereClause);

  return Boolean(existing);
}

async function ensureUniqueCode(
  code: string,
  excludeId?: number,
): Promise<boolean> {
  const trimmedCode = code.trim();
  const whereClause =
    excludeId !== undefined
      ? and(
          ilike(departmentModel.code, trimmedCode),
          ne(departmentModel.id, excludeId),
        )
      : ilike(departmentModel.code, trimmedCode);

  const [existing] = await db.select().from(departmentModel).where(whereClause);

  return Boolean(existing);
}

async function modelToDto(
  model: typeof departmentModel.$inferSelect | null,
  seen = new Set<number>(),
): Promise<DepartmentDto | null> {
  if (!model) return null;
  if (seen.has(model.id)) return null;

  let parentDepartment: DepartmentDto | null = null;

  if (model.parentDepartmentId) {
    seen.add(model.id);
    const [parent] = await db
      .select()
      .from(departmentModel)
      .where(eq(departmentModel.id, model.parentDepartmentId));
    parentDepartment = await modelToDto(parent ?? null, seen);
    seen.delete(model.id);
  }

  const { parentDepartmentId: _, ...rest } = model;
  return {
    ...rest,
    parentDepartment,
  };
}

export async function createDepartment(data: Department) {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as DepartmentT;

  const payload = normaliseDepartmentPayload(rest);

  if (!payload.name) {
    throw new Error("Department name is required.");
  }

  if (!payload.code) {
    throw new Error("Department code is required.");
  }

  if (await ensureUniqueName(payload.name)) {
    throw new Error("Department name already exists.");
  }

  if (await ensureUniqueCode(payload.code)) {
    throw new Error("Department code already exists.");
  }

  const [created] = await db
    .insert(departmentModel)
    .values(payload)
    .returning();

  return await modelToDto(created);
}

export async function getAllDepartments() {
  const rows = await db.select().from(departmentModel);
  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter((dto): dto is DepartmentDto => dto !== null);
}

export async function findDepartmentById(id: number) {
  const [row] = await db
    .select()
    .from(departmentModel)
    .where(eq(departmentModel.id, id));

  return await modelToDto(row ?? null);
}

export async function updateDepartment(
  id: number,
  data: Partial<DepartmentT> | Partial<Department>,
) {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as Partial<DepartmentT>;

  const payload = normaliseDepartmentPayload(rest);

  if (payload.name && (await ensureUniqueName(payload.name, id))) {
    throw new Error("Department name already exists.");
  }

  if (payload.code && (await ensureUniqueCode(payload.code, id))) {
    throw new Error("Department code already exists.");
  }

  const [updated] = await db
    .update(departmentModel)
    .set(payload)
    .where(eq(departmentModel.id, id))
    .returning();

  return await modelToDto(updated ?? null);
}

export async function deleteDepartmentSafe(id: number) {
  const [found] = await db
    .select()
    .from(departmentModel)
    .where(eq(departmentModel.id, id));

  if (!found) return null;

  const [deleted] = await db
    .delete(departmentModel)
    .where(eq(departmentModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "Department deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete department.",
    records: [],
  };
}
