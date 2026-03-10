import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import {
  userStatusSessionMappingModel,
  type UserStatusSessionMappingT,
} from "@repo/db/schemas/models/administration/user-status-session-mapping.model.js";
import type { UserStatusSessionMappingDto } from "@repo/db/dtos/administration/index.js";

type CreateUserStatusSessionMappingInput = Omit<
  UserStatusSessionMappingT,
  "id" | "createdAt" | "updatedAt"
>;
type UpdateUserStatusSessionMappingInput = Partial<
  Pick<
    UserStatusSessionMappingT,
    "userStatusReasonId" | "suspendedTillDate" | "remarks" | "isActive"
  >
>;

function toUserStatusSessionMappingDto(
  model: UserStatusSessionMappingT,
): UserStatusSessionMappingDto {
  const { sessionId, userStatusReasonId, ...rest } = model;
  return {
    ...rest,
    session: {} as UserStatusSessionMappingDto["session"],
    reason: {} as UserStatusSessionMappingDto["reason"],
  };
}

export async function getAllUserStatusSessionMappings(): Promise<
  UserStatusSessionMappingDto[]
> {
  const rows = await db.select().from(userStatusSessionMappingModel);
  return rows.map(toUserStatusSessionMappingDto);
}

export async function getUserStatusSessionMappingsByUserId(
  userId: number,
): Promise<UserStatusSessionMappingDto[]> {
  const rows = await db
    .select()
    .from(userStatusSessionMappingModel)
    .where(eq(userStatusSessionMappingModel.userId, userId));
  return rows.map(toUserStatusSessionMappingDto);
}

export async function getUserStatusSessionMappingsBySessionId(
  sessionId: number,
): Promise<UserStatusSessionMappingDto[]> {
  const rows = await db
    .select()
    .from(userStatusSessionMappingModel)
    .where(eq(userStatusSessionMappingModel.sessionId, sessionId));
  return rows.map(toUserStatusSessionMappingDto);
}

export async function getUserStatusSessionMappingById(
  id: number,
): Promise<UserStatusSessionMappingDto | null> {
  const [row] = await db
    .select()
    .from(userStatusSessionMappingModel)
    .where(eq(userStatusSessionMappingModel.id, id));
  return row ? toUserStatusSessionMappingDto(row) : null;
}

export async function createUserStatusSessionMapping(
  data: CreateUserStatusSessionMappingInput,
): Promise<UserStatusSessionMappingDto> {
  const [created] = await db
    .insert(userStatusSessionMappingModel)
    .values(data)
    .returning();
  return toUserStatusSessionMappingDto(created);
}

export async function updateUserStatusSessionMapping(
  id: number,
  data: UpdateUserStatusSessionMappingInput,
): Promise<UserStatusSessionMappingDto | null> {
  const [updated] = await db
    .update(userStatusSessionMappingModel)
    .set(data)
    .where(eq(userStatusSessionMappingModel.id, id))
    .returning();
  return updated ? toUserStatusSessionMappingDto(updated) : null;
}

export async function deleteUserStatusSessionMapping(
  id: number,
): Promise<UserStatusSessionMappingDto | null> {
  const [deleted] = await db
    .delete(userStatusSessionMappingModel)
    .where(eq(userStatusSessionMappingModel.id, id))
    .returning();
  return deleted ? toUserStatusSessionMappingDto(deleted) : null;
}
