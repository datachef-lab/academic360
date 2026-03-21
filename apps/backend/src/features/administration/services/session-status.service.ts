import { db } from "@/db/index.js";
import { and, eq, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  sessionStatusModel,
  SessionStatus,
  SessionStatusT,
} from "@repo/db/schemas/models/administration";
import { userStatusMasterModel } from "@repo/db/schemas/models/administration";
import { userModel } from "@repo/db/schemas/models/user";
import type { UserT } from "@repo/db/schemas/models/user";
import type { UserStatusMasterT } from "@repo/db/schemas/models/administration";
import type { UserStatusMaster } from "@repo/db/schemas/models/administration";

interface SessionStatusExpandedDto extends SessionStatusT {
  userStatusMaster: UserStatusMasterT;
  user: UserT;
  byUser: UserT;
}

async function ensureUniqueSessionRoleUserStatus(
  sessionId: number,
  userId: number,
  userStatusMasterId: number,
  excludeId?: number,
): Promise<boolean> {
  const whereClause =
    excludeId !== undefined
      ? and(
          eq(sessionStatusModel.sessionId, sessionId),
          eq(sessionStatusModel.userId, userId),
          eq(sessionStatusModel.userStatusMasterId, userStatusMasterId),
          ne(sessionStatusModel.id, excludeId),
        )
      : and(
          eq(sessionStatusModel.sessionId, sessionId),
          eq(sessionStatusModel.userId, userId),
          eq(sessionStatusModel.userStatusMasterId, userStatusMasterId),
        );

  const [existing] = await db
    .select()
    .from(sessionStatusModel)
    .where(whereClause);

  return Boolean(existing);
}

export async function createSessionStatus(
  data: SessionStatus,
): Promise<SessionStatusExpandedDto> {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as SessionStatusT;

  const payload = rest;

  if (payload.sessionId == null) throw new Error("sessionId is required.");
  if (payload.userId == null) throw new Error("userId is required.");
  if (payload.userStatusMasterId == null)
    throw new Error("userStatusMasterId is required.");

  if (
    await ensureUniqueSessionRoleUserStatus(
      payload.sessionId,
      payload.userId,
      payload.userStatusMasterId,
    )
  ) {
    throw new Error(
      "Session status already exists for this session, user and status master.",
    );
  }

  const [created] = await db
    .insert(sessionStatusModel)
    .values(payload)
    .returning();

  if (!created) throw new Error("Failed to create session status.");
  return (await findSessionStatusById(
    (created as any).id,
  )) as SessionStatusExpandedDto;
}

export async function getAllSessionStatuses(): Promise<
  SessionStatusExpandedDto[]
> {
  const byUser = alias(userModel, "by_user");

  const rows = await db
    .select({
      sessionStatus: sessionStatusModel,
      userStatusMaster: userStatusMasterModel,
      user: userModel,
      byUser,
    })
    .from(sessionStatusModel)
    .leftJoin(
      userStatusMasterModel,
      eq(userStatusMasterModel.id, sessionStatusModel.userStatusMasterId),
    )
    .leftJoin(userModel, eq(userModel.id, sessionStatusModel.userId))
    .leftJoin(byUser, eq(byUser.id, sessionStatusModel.byUserId));

  return rows.map((r) => ({
    ...(r.sessionStatus as SessionStatusT),
    userStatusMaster: r.userStatusMaster as UserStatusMasterT,
    user: r.user as UserT,
    byUser: r.byUser as UserT,
  }));
}

export async function findSessionStatusById(
  id: number,
): Promise<SessionStatusExpandedDto | null> {
  const byUser = alias(userModel, "by_user");

  const [row] = await db
    .select({
      sessionStatus: sessionStatusModel,
      userStatusMaster: userStatusMasterModel,
      user: userModel,
      byUser,
    })
    .from(sessionStatusModel)
    .leftJoin(
      userStatusMasterModel,
      eq(userStatusMasterModel.id, sessionStatusModel.userStatusMasterId),
    )
    .leftJoin(userModel, eq(userModel.id, sessionStatusModel.userId))
    .leftJoin(byUser, eq(byUser.id, sessionStatusModel.byUserId))
    .where(eq(sessionStatusModel.id, id))
    .limit(1);

  if (!row) return null;

  return {
    ...(row.sessionStatus as SessionStatusT),
    userStatusMaster: row.userStatusMaster as UserStatusMasterT,
    user: row.user as UserT,
    byUser: row.byUser as UserT,
  };
}

export async function updateSessionStatus(
  id: number,
  data: Partial<SessionStatusT> | Partial<SessionStatus>,
): Promise<SessionStatusExpandedDto | null> {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = data as Partial<SessionStatusT>;

  const payload = rest;
  const payloadKeys = Object.keys(payload);

  const [existing] = await db
    .select()
    .from(sessionStatusModel)
    .where(eq(sessionStatusModel.id, id))
    .limit(1);

  if (!existing) return null;

  if (payloadKeys.length === 0)
    return (await findSessionStatusById(id)) as SessionStatusExpandedDto;

  const finalSessionId =
    (payload as Partial<SessionStatusT>).sessionId ?? existing.sessionId;
  const finalUserId =
    (payload as Partial<SessionStatusT>).userId ?? existing.userId;
  const finalUserStatusMasterId =
    (payload as Partial<SessionStatusT>).userStatusMasterId ??
    existing.userStatusMasterId;

  if (
    await ensureUniqueSessionRoleUserStatus(
      finalSessionId,
      finalUserId,
      finalUserStatusMasterId,
      id,
    )
  ) {
    throw new Error(
      "Session status already exists for this session, user and status master.",
    );
  }

  const [updated] = await db
    .update(sessionStatusModel)
    .set(payload)
    .where(eq(sessionStatusModel.id, id))
    .returning();

  if (!updated) return null;
  return (await findSessionStatusById(id)) as SessionStatusExpandedDto;
}

export async function deleteSessionStatusSafe(
  id: number,
): Promise<null | { success: boolean; message: string; records: unknown[] }> {
  const [found] = await db
    .select()
    .from(sessionStatusModel)
    .where(eq(sessionStatusModel.id, id));

  if (!found) return null;

  const [deleted] = await db
    .delete(sessionStatusModel)
    .where(eq(sessionStatusModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "Session status deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete session status.",
    records: [],
  };
}
