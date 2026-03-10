import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import {
  userStatusModel,
  type UserStatusT,
} from "@repo/db/schemas/models/administration/user-status.model.js";

type CreateUserStatusInput = Omit<
  UserStatusT,
  "id" | "createdAt" | "updatedAt"
>;
type UpdateUserStatusInput = Partial<CreateUserStatusInput>;

export async function getAllUserStatuses(): Promise<UserStatusT[]> {
  return await db.select().from(userStatusModel).orderBy(userStatusModel.name);
}

export async function getUserStatusById(
  id: number,
): Promise<UserStatusT | null> {
  const [row] = await db
    .select()
    .from(userStatusModel)
    .where(eq(userStatusModel.id, id));
  return row ?? null;
}

export async function getUserStatusByName(
  name: string,
): Promise<UserStatusT | null> {
  const [row] = await db
    .select()
    .from(userStatusModel)
    .where(eq(userStatusModel.name, name));
  return row ?? null;
}

export async function createUserStatus(
  data: CreateUserStatusInput,
): Promise<UserStatusT> {
  const [created] = await db.insert(userStatusModel).values(data).returning();
  return created;
}

export async function updateUserStatus(
  id: number,
  data: UpdateUserStatusInput,
): Promise<UserStatusT | null> {
  const [updated] = await db
    .update(userStatusModel)
    .set(data)
    .where(eq(userStatusModel.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteUserStatus(
  id: number,
): Promise<UserStatusT | null> {
  const [deleted] = await db
    .delete(userStatusModel)
    .where(eq(userStatusModel.id, id))
    .returning();
  return deleted ?? null;
}
