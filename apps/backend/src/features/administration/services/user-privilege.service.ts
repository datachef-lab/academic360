import { db } from "@/db/index.js";
import { and, eq } from "drizzle-orm";
import {
  userPrivilegeModel,
  type UserPrivilegeT,
} from "@repo/db/schemas/models/administration/user-privilege.model.js";
import type { UserPrivilegeDto } from "@repo/db/dtos/administration/index.js";

type CreateUserPrivilegeInput = Omit<
  UserPrivilegeT,
  "id" | "createdAt" | "updatedAt"
>;
type UpdateUserPrivilegeInput = Partial<Pick<UserPrivilegeT, "isActive">>;

function toUserPrivilegeDto(model: UserPrivilegeT): UserPrivilegeDto {
  const { userGroupId, userStatusId, ...rest } = model;
  return {
    ...rest,
    group: {
      id: 0,
      name: "",
      domains: [],
      members: [],
    } as UserPrivilegeDto["group"],
    status: {} as UserPrivilegeDto["status"],
    resources: [],
  };
}

export async function getAllUserPrivileges(): Promise<UserPrivilegeDto[]> {
  const rows = await db.select().from(userPrivilegeModel);
  return rows.map(toUserPrivilegeDto);
}

export async function getUserPrivilegesByGroupId(
  userGroupId: number,
): Promise<UserPrivilegeDto[]> {
  const rows = await db
    .select()
    .from(userPrivilegeModel)
    .where(eq(userPrivilegeModel.userGroupId, userGroupId));
  return rows.map(toUserPrivilegeDto);
}

export async function getUserPrivilegesByStatusId(
  userStatusId: number,
): Promise<UserPrivilegeDto[]> {
  const rows = await db
    .select()
    .from(userPrivilegeModel)
    .where(eq(userPrivilegeModel.userStatusId, userStatusId));
  return rows.map(toUserPrivilegeDto);
}

export async function getUserPrivilegeById(
  id: number,
): Promise<UserPrivilegeDto | null> {
  const [row] = await db
    .select()
    .from(userPrivilegeModel)
    .where(eq(userPrivilegeModel.id, id));
  return row ? toUserPrivilegeDto(row) : null;
}

export async function getUserPrivilegeByGroupAndStatus(
  userGroupId: number,
  userStatusId: number,
): Promise<UserPrivilegeDto | null> {
  const [row] = await db
    .select()
    .from(userPrivilegeModel)
    .where(
      and(
        eq(userPrivilegeModel.userGroupId, userGroupId),
        eq(userPrivilegeModel.userStatusId, userStatusId),
      ),
    );
  return row ? toUserPrivilegeDto(row) : null;
}

export async function createUserPrivilege(
  data: CreateUserPrivilegeInput,
): Promise<UserPrivilegeDto> {
  const [created] = await db
    .insert(userPrivilegeModel)
    .values(data)
    .returning();
  return toUserPrivilegeDto(created);
}

export async function updateUserPrivilege(
  id: number,
  data: UpdateUserPrivilegeInput,
): Promise<UserPrivilegeDto | null> {
  const [updated] = await db
    .update(userPrivilegeModel)
    .set(data)
    .where(eq(userPrivilegeModel.id, id))
    .returning();
  return updated ? toUserPrivilegeDto(updated) : null;
}

export async function deleteUserPrivilege(
  id: number,
): Promise<UserPrivilegeDto | null> {
  const [deleted] = await db
    .delete(userPrivilegeModel)
    .where(eq(userPrivilegeModel.id, id))
    .returning();
  return deleted ? toUserPrivilegeDto(deleted) : null;
}
