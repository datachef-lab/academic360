import { db } from "@/db/index.js";
import { and, eq } from "drizzle-orm";
import {
  userStatusReasonModel,
  type UserStatusReasonT,
} from "@repo/db/schemas/models/administration/user-status-reason.model.js";
import { userStatusModel } from "@repo/db/schemas/models/administration/user-status.model.js";
import type { UserStatusReasonDto } from "@repo/db/dtos/administration/index.js";

type CreateUserStatusReasonInput = Omit<
  UserStatusReasonT,
  "id" | "createdAt" | "updatedAt"
>;
type UpdateUserStatusReasonInput = Partial<
  Omit<CreateUserStatusReasonInput, "userStatusId">
>;

async function toUserStatusReasonDto(
  model: UserStatusReasonT,
): Promise<UserStatusReasonDto> {
  const { userStatusId, ...rest } = model;
  const [status] = await db
    .select()
    .from(userStatusModel)
    .where(eq(userStatusModel.id, userStatusId));
  return { ...rest, status: status ?? ({} as UserStatusReasonDto["status"]) };
}

export async function getAllUserStatusReasons(): Promise<
  UserStatusReasonDto[]
> {
  const rows = await db
    .select()
    .from(userStatusReasonModel)
    .orderBy(userStatusReasonModel.userStatusId, userStatusReasonModel.name);
  return Promise.all(rows.map(toUserStatusReasonDto));
}

export async function getUserStatusReasonsByStatusId(
  userStatusId: number,
): Promise<UserStatusReasonDto[]> {
  const rows = await db
    .select()
    .from(userStatusReasonModel)
    .where(eq(userStatusReasonModel.userStatusId, userStatusId));
  return Promise.all(rows.map(toUserStatusReasonDto));
}

export async function getUserStatusReasonById(
  id: number,
): Promise<UserStatusReasonDto | null> {
  const [row] = await db
    .select()
    .from(userStatusReasonModel)
    .where(eq(userStatusReasonModel.id, id));
  return row ? toUserStatusReasonDto(row) : null;
}

export async function getUserStatusReasonByStatusAndName(
  userStatusId: number,
  name: string,
): Promise<UserStatusReasonDto | null> {
  const [row] = await db
    .select()
    .from(userStatusReasonModel)
    .where(
      and(
        eq(userStatusReasonModel.userStatusId, userStatusId),
        eq(userStatusReasonModel.name, name),
      ),
    );
  return row ? toUserStatusReasonDto(row) : null;
}

export async function createUserStatusReason(
  data: CreateUserStatusReasonInput,
): Promise<UserStatusReasonDto> {
  const [created] = await db
    .insert(userStatusReasonModel)
    .values(data)
    .returning();
  return toUserStatusReasonDto(created);
}

export async function updateUserStatusReason(
  id: number,
  data: UpdateUserStatusReasonInput,
): Promise<UserStatusReasonDto | null> {
  const [updated] = await db
    .update(userStatusReasonModel)
    .set(data)
    .where(eq(userStatusReasonModel.id, id))
    .returning();
  return updated ? toUserStatusReasonDto(updated) : null;
}

export async function deleteUserStatusReason(
  id: number,
): Promise<UserStatusReasonDto | null> {
  const [deleted] = await db
    .delete(userStatusReasonModel)
    .where(eq(userStatusReasonModel.id, id))
    .returning();
  return deleted ? toUserStatusReasonDto(deleted) : null;
}
