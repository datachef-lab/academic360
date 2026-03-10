import { db } from "@/db/index.js";
import { and, eq } from "drizzle-orm";
import {
  userGroupMemberModel,
  type UserGroupMemberT,
} from "@repo/db/schemas/models/administration/user-group-member.model.js";

type CreateUserGroupMemberInput = Omit<
  UserGroupMemberT,
  "id" | "createdAt" | "updatedAt"
>;

const VALID_MEMBERS = [
  "ADMIN",
  "STUDENT",
  "FACULTY",
  "STAFF",
  "PARENTS",
] as const;

export function isValidMember(
  member: string,
): member is (typeof VALID_MEMBERS)[number] {
  return VALID_MEMBERS.includes(member as (typeof VALID_MEMBERS)[number]);
}

export async function getAllUserGroupMembers(): Promise<UserGroupMemberT[]> {
  return await db.select().from(userGroupMemberModel);
}

export async function getUserGroupMembersByGroupId(
  userGroupId: number,
): Promise<UserGroupMemberT[]> {
  return await db
    .select()
    .from(userGroupMemberModel)
    .where(eq(userGroupMemberModel.userGroupId, userGroupId));
}

export async function getUserGroupMemberById(
  id: number,
): Promise<UserGroupMemberT | null> {
  const [row] = await db
    .select()
    .from(userGroupMemberModel)
    .where(eq(userGroupMemberModel.id, id));
  return row ?? null;
}

export async function getUserGroupMemberByGroupAndMember(
  userGroupId: number,
  member: string,
): Promise<UserGroupMemberT | null> {
  const [row] = await db
    .select()
    .from(userGroupMemberModel)
    .where(
      and(
        eq(userGroupMemberModel.userGroupId, userGroupId),
        eq(
          userGroupMemberModel.member,
          member as (typeof VALID_MEMBERS)[number],
        ),
      ),
    );
  return row ?? null;
}

export async function createUserGroupMember(
  data: CreateUserGroupMemberInput,
): Promise<UserGroupMemberT> {
  const [created] = await db
    .insert(userGroupMemberModel)
    .values(data)
    .returning();
  return created;
}

export async function deleteUserGroupMember(
  id: number,
): Promise<UserGroupMemberT | null> {
  const [deleted] = await db
    .delete(userGroupMemberModel)
    .where(eq(userGroupMemberModel.id, id))
    .returning();
  return deleted ?? null;
}
