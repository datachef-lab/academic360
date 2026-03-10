import { db } from "@/db/index.js";
import { and, eq } from "drizzle-orm";
import {
  userStaffDepartmentMappingModel,
  type UserStaffDepartmentT,
} from "@repo/db/schemas/models/administration/user-staff-department-mapping.model.js";

type CreateUserStaffDepartmentMappingInput = Omit<
  UserStaffDepartmentT,
  "id" | "createdAt" | "updatedAt"
>;

export async function getAllUserStaffDepartmentMappings(): Promise<
  UserStaffDepartmentT[]
> {
  return await db.select().from(userStaffDepartmentMappingModel);
}

export async function getUserStaffDepartmentMappingsByStaffId(
  staffId: number,
): Promise<UserStaffDepartmentT[]> {
  return await db
    .select()
    .from(userStaffDepartmentMappingModel)
    .where(eq(userStaffDepartmentMappingModel.staffId, staffId));
}

export async function getUserStaffDepartmentMappingsByDepartmentId(
  departmentId: number,
): Promise<UserStaffDepartmentT[]> {
  return await db
    .select()
    .from(userStaffDepartmentMappingModel)
    .where(eq(userStaffDepartmentMappingModel.departmentId, departmentId));
}

export async function getUserStaffDepartmentMappingById(
  id: number,
): Promise<UserStaffDepartmentT | null> {
  const [row] = await db
    .select()
    .from(userStaffDepartmentMappingModel)
    .where(eq(userStaffDepartmentMappingModel.id, id));
  return row ?? null;
}

export async function getUserStaffDepartmentMappingByStaffAndDepartment(
  staffId: number,
  departmentId: number,
): Promise<UserStaffDepartmentT | null> {
  const [row] = await db
    .select()
    .from(userStaffDepartmentMappingModel)
    .where(
      and(
        eq(userStaffDepartmentMappingModel.staffId, staffId),
        eq(userStaffDepartmentMappingModel.departmentId, departmentId),
      ),
    );
  return row ?? null;
}

export async function createUserStaffDepartmentMapping(
  data: CreateUserStaffDepartmentMappingInput,
): Promise<UserStaffDepartmentT> {
  const [created] = await db
    .insert(userStaffDepartmentMappingModel)
    .values(data)
    .returning();
  return created;
}

export async function deleteUserStaffDepartmentMapping(
  id: number,
): Promise<UserStaffDepartmentT | null> {
  const [deleted] = await db
    .delete(userStaffDepartmentMappingModel)
    .where(eq(userStaffDepartmentMappingModel.id, id))
    .returning();
  return deleted ?? null;
}
