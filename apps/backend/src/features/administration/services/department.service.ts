import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import {
  departmentModel,
  type DepartmentT,
} from "@repo/db/schemas/models/administration/department.model.js";
import type { DepartmentDto } from "@repo/db/dtos/administration/index.js";

type CreateDepartmentInput = Omit<
  DepartmentT,
  "id" | "createdAt" | "updatedAt"
>;
type UpdateDepartmentInput = Partial<CreateDepartmentInput>;

function toDepartmentDto(model: DepartmentT): DepartmentDto {
  const { parentDepartmentId, ...rest } = model;
  return { ...rest, parentDepartment: null };
}

export async function getAllDepartments(): Promise<DepartmentDto[]> {
  const rows = await db
    .select()
    .from(departmentModel)
    .orderBy(departmentModel.name);
  return rows.map(toDepartmentDto);
}

export async function getDepartmentById(
  id: number,
): Promise<DepartmentDto | null> {
  const [department] = await db
    .select()
    .from(departmentModel)
    .where(eq(departmentModel.id, id));
  return department ? toDepartmentDto(department) : null;
}

export async function getDepartmentByName(
  name: string,
): Promise<DepartmentDto | null> {
  const [department] = await db
    .select()
    .from(departmentModel)
    .where(eq(departmentModel.name, name));
  return department ? toDepartmentDto(department) : null;
}

export async function getDepartmentByCode(
  code: string,
): Promise<DepartmentDto | null> {
  const [department] = await db
    .select()
    .from(departmentModel)
    .where(eq(departmentModel.code, code));
  return department ? toDepartmentDto(department) : null;
}

export async function createDepartment(
  data: CreateDepartmentInput,
): Promise<DepartmentDto> {
  const [created] = await db.insert(departmentModel).values(data).returning();
  return toDepartmentDto(created);
}

export async function updateDepartment(
  id: number,
  data: UpdateDepartmentInput,
): Promise<DepartmentDto | null> {
  const [updated] = await db
    .update(departmentModel)
    .set(data)
    .where(eq(departmentModel.id, id))
    .returning();
  return updated ? toDepartmentDto(updated) : null;
}

export async function deleteDepartment(
  id: number,
): Promise<DepartmentDto | null> {
  const [deleted] = await db
    .delete(departmentModel)
    .where(eq(departmentModel.id, id))
    .returning();
  return deleted ? toDepartmentDto(deleted) : null;
}
