import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import {
  Department,
  departmentModel,
} from "@repo/db/schemas/models/administration/department.model.js";

type NewDepartmentData = Omit<Department, "id" | "createdAt" | "updatedAt">;
type UpdateDepartmentData = Partial<
  Omit<Department, "id" | "createdAt" | "updatedAt">
>;

export async function getAllDepartments(): Promise<Department[]> {
  return await db.select().from(departmentModel).orderBy(departmentModel.name);
}

export async function getDepartmentById(
  id: number,
): Promise<Department | null> {
  const [department] = await db
    .select()
    .from(departmentModel)
    .where(eq(departmentModel.id, id));
  return department ?? null;
}

export async function getDepartmentByName(
  name: string,
): Promise<Department | null> {
  const [department] = await db
    .select()
    .from(departmentModel)
    .where(eq(departmentModel.name, name));
  return department ?? null;
}

export async function getDepartmentByCode(
  code: string,
): Promise<Department | null> {
  const [department] = await db
    .select()
    .from(departmentModel)
    .where(eq(departmentModel.code, code));
  return department ?? null;
}

export async function createDepartment(
  data: NewDepartmentData,
): Promise<Department> {
  const [created] = await db.insert(departmentModel).values(data).returning();
  return created;
}

export async function updateDepartment(
  id: number,
  data: UpdateDepartmentData,
): Promise<Department | null> {
  const [updated] = await db
    .update(departmentModel)
    .set(data)
    .where(eq(departmentModel.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteDepartment(id: number): Promise<Department | null> {
  const [deleted] = await db
    .delete(departmentModel)
    .where(eq(departmentModel.id, id))
    .returning();
  return deleted ?? null;
}
