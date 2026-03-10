import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import {
  userGroupModel,
  type UserGroupT,
} from "@repo/db/schemas/models/administration/user-group.model.js";
import type { UserGroupDto } from "@repo/db/dtos/administration/index.js";

type CreateUserGroupInput = Omit<UserGroupT, "id" | "createdAt" | "updatedAt">;
type UpdateUserGroupInput = Partial<CreateUserGroupInput>;

function toUserGroupDto(model: UserGroupT): UserGroupDto {
  return { ...model, domains: [], members: [] };
}

export async function getAllUserGroups(): Promise<UserGroupDto[]> {
  const rows = await db
    .select()
    .from(userGroupModel)
    .orderBy(userGroupModel.sequence, userGroupModel.name);
  return rows.map(toUserGroupDto);
}

export async function getUserGroupById(
  id: number,
): Promise<UserGroupDto | null> {
  const [userGroup] = await db
    .select()
    .from(userGroupModel)
    .where(eq(userGroupModel.id, id));
  return userGroup ? toUserGroupDto(userGroup) : null;
}

export async function getUserGroupByName(
  name: string,
): Promise<UserGroupDto | null> {
  const [userGroup] = await db
    .select()
    .from(userGroupModel)
    .where(eq(userGroupModel.name, name));
  return userGroup ? toUserGroupDto(userGroup) : null;
}

export async function createUserGroup(
  data: CreateUserGroupInput,
): Promise<UserGroupDto> {
  const [created] = await db.insert(userGroupModel).values(data).returning();
  return toUserGroupDto(created);
}

export async function updateUserGroup(
  id: number,
  data: UpdateUserGroupInput,
): Promise<UserGroupDto | null> {
  const [updated] = await db
    .update(userGroupModel)
    .set(data)
    .where(eq(userGroupModel.id, id))
    .returning();
  return updated ? toUserGroupDto(updated) : null;
}

export async function deleteUserGroup(
  id: number,
): Promise<UserGroupDto | null> {
  const [deleted] = await db
    .delete(userGroupModel)
    .where(eq(userGroupModel.id, id))
    .returning();
  return deleted ? toUserGroupDto(deleted) : null;
}
