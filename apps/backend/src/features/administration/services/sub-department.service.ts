import { db } from "@/db/index.js";
import { and, eq } from "drizzle-orm";
import {
  SubDepartment,
  subDepartmentModel,
} from "@repo/db/schemas/models/administration/sub-department.model.js";

type NewSubDepartmentData = Omit<
  SubDepartment,
  "id" | "createdAt" | "updatedAt"
>;
type UpdateSubDepartmentData = Partial<
  Omit<SubDepartment, "id" | "createdAt" | "updatedAt">
>;

export async function getAllSubDepartments(): Promise<SubDepartment[]> {
  return db.select().from(subDepartmentModel).orderBy(subDepartmentModel.name);
}

export async function getSubDepartmentsByDepartmentId(
  departmentId: number,
): Promise<SubDepartment[]> {
  return db
    .select()
    .from(subDepartmentModel)
    .where(eq(subDepartmentModel.departmentId, departmentId))
    .orderBy(subDepartmentModel.name);
}

export async function getSubDepartmentById(
  id: number,
): Promise<SubDepartment | null> {
  const [subDepartment] = await db
    .select()
    .from(subDepartmentModel)
    .where(eq(subDepartmentModel.id, id));

  return subDepartment ?? null;
}

export async function getSubDepartmentByName(
  departmentId: number,
  name: string,
): Promise<SubDepartment | null> {
  const [subDepartment] = await db
    .select()
    .from(subDepartmentModel)
    .where(
      and(
        eq(subDepartmentModel.departmentId, departmentId),
        eq(subDepartmentModel.name, name),
      ),
    );

  return subDepartment ?? null;
}

export async function getSubDepartmentByShortName(
  departmentId: number,
  shortName: string,
): Promise<SubDepartment | null> {
  const [subDepartment] = await db
    .select()
    .from(subDepartmentModel)
    .where(
      and(
        eq(subDepartmentModel.departmentId, departmentId),
        eq(subDepartmentModel.shortName, shortName),
      ),
    );

  return subDepartment ?? null;
}

export async function createSubDepartment(
  data: NewSubDepartmentData,
): Promise<SubDepartment> {
  const [created] = await db
    .insert(subDepartmentModel)
    .values(data)
    .returning();

  return created;
}

export async function updateSubDepartment(
  id: number,
  data: UpdateSubDepartmentData,
): Promise<SubDepartment | null> {
  const [updated] = await db
    .update(subDepartmentModel)
    .set(data)
    .where(eq(subDepartmentModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteSubDepartment(
  id: number,
): Promise<SubDepartment | null> {
  const [deleted] = await db
    .delete(subDepartmentModel)
    .where(eq(subDepartmentModel.id, id))
    .returning();

  return deleted ?? null;
}
