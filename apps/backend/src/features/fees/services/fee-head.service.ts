import { db } from "@/db";
import { feeHeadModel, createFeeHeadSchema } from "@repo/db/schemas";
import { eq } from "drizzle-orm";
import { socketService } from "@/services/socketService.js";
import * as userService from "@/features/user/services/user.service.js";

/**
 * Services should accept validated DTOs (controller validates via zod) and
 * return raw rows / arrays / null. Do not catch errors here — controller will handle them.
 */

export const createFeeHead = async (
  data: Omit<
    typeof createFeeHeadSchema._type,
    "id" | "createdAt" | "updatedAt" | "createdByUserId" | "updatedByUserId"
  >,
  userId: number,
): Promise<typeof feeHeadModel.$inferSelect> => {
  const [created] = await db
    .insert(feeHeadModel)
    .values({
      ...data,
      createdByUserId: userId,
      updatedByUserId: userId,
    })
    .returning();

  // emit socket event for creation
  const io = socketService.getIO();
  if (io && created) {
    const user = await userService.findById(userId);
    const userName = user?.name || "Unknown User";

    io.emit("fee_head_created", {
      feeHeadId: created.id,
      type: "creation",
      message: "A new fee head has been created",
      timestamp: new Date().toISOString(),
    });

    const notification = {
      id: `fee_head_created_${created.id}_${Date.now()}`,
      type: "info" as const,
      userId: userId.toString(),
      userName,
      message: `created fee head: ${created.name}`,
      createdAt: new Date(),
      read: false,
      meta: { feeHeadId: created.id, type: "creation" },
    };

    // send to admin/staff users first
    socketService.sendNotificationToAdminStaff(notification);
    // also broadcast to everyone so that others can see who performed the action
    io.emit("notification", notification);
  }

  return created;
};

export const getAllFeeHeads = async (): Promise<
  (typeof feeHeadModel.$inferSelect)[]
> => {
  const rows = await db.select().from(feeHeadModel);
  return rows;
};

export const getFeeHeadById = async (
  id: number,
): Promise<typeof feeHeadModel.$inferSelect | null> => {
  const [row] = await db
    .select()
    .from(feeHeadModel)
    .where(eq(feeHeadModel.id, id));
  return row ?? null;
};

export const updateFeeHead = async (
  id: number,
  data: Partial<typeof createFeeHeadSchema._type>,
  userId: number,
): Promise<typeof feeHeadModel.$inferSelect | null> => {
  const [updated] = await db
    .update(feeHeadModel)
    .set({
      ...data,
      updatedAt: new Date(),
      updatedByUserId: userId,
    })
    .where(eq(feeHeadModel.id, id))
    .returning();

  // Emit socket event for fee head update
  const io = socketService.getIO();
  if (io && updated) {
    // Get user name for notification
    const user = await userService.findById(userId);
    const userName = user?.name || "Unknown User";

    io.emit("fee_head_updated", {
      feeHeadId: updated.id,
      type: "update",
      message: "A fee head has been updated",
      timestamp: new Date().toISOString(),
    });

    // Emit notification to all staff/admin users
    io.emit("notification", {
      id: `fee_head_updated_${updated.id}_${Date.now()}`,
      type: "update",
      userId: userId.toString(),
      userName,
      message: `updated fee head: ${updated.name}`,
      createdAt: new Date(),
      read: false,
      meta: { feeHeadId: updated.id, type: "update" },
    });
  }

  return updated ?? null;
};

export const deleteFeeHead = async (
  id: number,
  userId?: number,
): Promise<typeof feeHeadModel.$inferSelect | null> => {
  // Get the fee head before deletion for socket event
  const [existing] = await db
    .select()
    .from(feeHeadModel)
    .where(eq(feeHeadModel.id, id));

  const [deleted] = await db
    .delete(feeHeadModel)
    .where(eq(feeHeadModel.id, id))
    .returning();

  // Emit socket event for fee head deletion
  const io = socketService.getIO();
  if (io && deleted) {
    // Get user name for notification if userId provided
    let userName = "Unknown User";
    if (userId) {
      const user = await userService.findById(userId);
      userName = user?.name || "Unknown User";
    }

    io.emit("fee_head_deleted", {
      feeHeadId: id,
      type: "deletion",
      message: "A fee head has been deleted",
      timestamp: new Date().toISOString(),
    });

    // Emit notification to all staff/admin users
    io.emit("notification", {
      id: `fee_head_deleted_${id}_${Date.now()}`,
      type: "update",
      userId: userId ? userId.toString() : undefined,
      userName,
      message: `deleted fee head: ${existing?.name || `ID: ${id}`}`,
      createdAt: new Date(),
      read: false,
      meta: { feeHeadId: id, type: "deletion" },
    });
  }

  return deleted ?? null;
};
