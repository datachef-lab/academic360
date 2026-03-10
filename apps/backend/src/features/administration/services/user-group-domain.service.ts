import { db } from "@/db/index.js";
import { and, eq } from "drizzle-orm";
import {
  userGroupDomainModel,
  type UserGroupDomainT,
} from "@repo/db/schemas/models/administration/user-group-domain.model.js";

type CreateUserGroupDomainInput = Omit<
  UserGroupDomainT,
  "id" | "createdAt" | "updatedAt"
>;

const VALID_DOMAINS = [
  "MAIN_CONSOLE",
  "STUDENT_CONSOLE",
  "STUDENT_CONSOLE_MOBILE",
  "EXAM_ATTENDANCE_APP",
  "ID_CARD_GENERATOR",
  "EVENT_GATEKEEPER",
] as const;

export function isValidDomain(
  domain: string,
): domain is (typeof VALID_DOMAINS)[number] {
  return VALID_DOMAINS.includes(domain as (typeof VALID_DOMAINS)[number]);
}

export async function getAllUserGroupDomains(): Promise<UserGroupDomainT[]> {
  return await db.select().from(userGroupDomainModel);
}

export async function getUserGroupDomainsByGroupId(
  userGroupId: number,
): Promise<UserGroupDomainT[]> {
  return await db
    .select()
    .from(userGroupDomainModel)
    .where(eq(userGroupDomainModel.userGroupId, userGroupId));
}

export async function getUserGroupDomainById(
  id: number,
): Promise<UserGroupDomainT | null> {
  const [row] = await db
    .select()
    .from(userGroupDomainModel)
    .where(eq(userGroupDomainModel.id, id));
  return row ?? null;
}

export async function getUserGroupDomainByGroupAndDomain(
  userGroupId: number,
  domain: string,
): Promise<UserGroupDomainT | null> {
  const [row] = await db
    .select()
    .from(userGroupDomainModel)
    .where(
      and(
        eq(userGroupDomainModel.userGroupId, userGroupId),
        eq(
          userGroupDomainModel.domain,
          domain as (typeof VALID_DOMAINS)[number],
        ),
      ),
    );
  return row ?? null;
}

export async function createUserGroupDomain(
  data: CreateUserGroupDomainInput,
): Promise<UserGroupDomainT> {
  const [created] = await db
    .insert(userGroupDomainModel)
    .values(data)
    .returning();
  return created;
}

export async function deleteUserGroupDomain(
  id: number,
): Promise<UserGroupDomainT | null> {
  const [deleted] = await db
    .delete(userGroupDomainModel)
    .where(eq(userGroupDomainModel.id, id))
    .returning();
  return deleted ?? null;
}
