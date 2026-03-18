import { db } from "@/db/index.js";
import { Department, departmentModel } from "@repo/db/schemas";
import { eq } from "drizzle-orm";

export async function findDepartmentById(
  id: number,
): Promise<Department | null> {
  const [found] = await db
    .select()
    .from(departmentModel)
    .where(eq(departmentModel.id, id));

  return found || null;
}

export async function findAllDepartments(): Promise<Department[]> {
  return await db.select().from(departmentModel).orderBy(departmentModel.name);
}

export async function createDepartment(
  data: Omit<Department, "id" | "createdAt" | "updatedAt">,
): Promise<Department> {
  const [newDepartment] = await db
    .insert(departmentModel)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newDepartment;
}

export async function updateDepartment(
  id: number,
  data: Partial<Omit<Department, "id" | "createdAt" | "updatedAt">>,
): Promise<Department | null> {
  const [updatedDepartment] = await db
    .update(departmentModel)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(departmentModel.id, id))
    .returning();

  return updatedDepartment || null;
}

export async function deleteDepartment(id: number): Promise<Department | null> {
  const [deletedDepartment] = await db
    .delete(departmentModel)
    .where(eq(departmentModel.id, id))
    .returning();

  return deletedDepartment || null;
}

export async function findDepartmentByName(
  name: string,
): Promise<Department | null> {
  const [found] = await db
    .select()
    .from(departmentModel)
    .where(eq(departmentModel.name, name));

  return found || null;
}

export async function findDepartmentByCode(
  code: string,
): Promise<Department | null> {
  const [found] = await db
    .select()
    .from(departmentModel)
    .where(eq(departmentModel.code, code));

  return found || null;
}

export async function findDepartmentsByParentId(
  parentId: number,
): Promise<Department[]> {
  return await db
    .select()
    .from(departmentModel)
    .where(eq(departmentModel.parentDepartmentId, parentId))
    .orderBy(departmentModel.name);
}
