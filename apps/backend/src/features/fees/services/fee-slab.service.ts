import { db } from "@/db";
import { feeSlabModel, createFeeSlabSchema } from "@repo/db/schemas";
import { eq } from "drizzle-orm";
import { socketService } from "@/services/socketService.js";
import * as userService from "@/features/user/services/user.service.js";

/**
 * Services return raw DTOs/arrays/null and do not catch errors.
 * Validation is performed in controllers via zod schemas.
 */
export const createFeeSlab = async (
  data: Omit<
    typeof createFeeSlabSchema._type,
    "id" | "createdAt" | "updatedAt" | "createdByUserId" | "updatedByUserId"
  >,
  userId: number,
): Promise<typeof feeSlabModel.$inferSelect> => {
  const insertData: any = {
    name: data.name,
    description: data.description ?? null,
    defaultRate: data.defaultRate ?? 0,
    legacyFeeSlabId: data.legacyFeeSlabId ?? null,
    createdByUserId: userId,
    updatedByUserId: userId,
  };

  // Only set sequence if it's explicitly provided (not undefined)
  if (data.sequence !== undefined) {
    insertData.sequence = data.sequence ?? null;
  }

  const [created] = await db
    .insert(feeSlabModel)
    .values(insertData)
    .returning();

  // Emit socket event for fee slab creation
  const io = socketService.getIO();
  if (io && created) {
    // Get user name for notification
    const user = await userService.findById(userId);
    const userName = user?.name || "Unknown User";

    io.emit("fee_slab_created", {
      feeSlabId: created.id,
      type: "creation",
      message: "A new fee slab has been created",
      timestamp: new Date().toISOString(),
    });

    // Emit notification to all staff/admin users
    io.emit("notification", {
      id: `fee_slab_created_${created.id}_${Date.now()}`,
      type: "info",
      userId: userId.toString(),
      userName,
      message: `created a new fee slab: ${created.name}`,
      createdAt: new Date(),
      read: false,
      meta: { feeSlabId: created.id, type: "creation" },
    });
  }

  return created;
};

export const getAllFeeSlabs = async (): Promise<
  (typeof feeSlabModel.$inferSelect)[]
> => {
  const slabs = await db.select().from(feeSlabModel);
  return slabs;
};

export const getFeeSlabById = async (
  id: number,
): Promise<typeof feeSlabModel.$inferSelect | null> => {
  const [slab] = await db
    .select()
    .from(feeSlabModel)
    .where(eq(feeSlabModel.id, id));

  return slab ?? null;
};

export const updateFeeSlab = async (
  id: number,
  data: Partial<typeof createFeeSlabSchema._type>,
  userId: number,
): Promise<typeof feeSlabModel.$inferSelect | null> => {
  // Build update object, only including fields that are provided
  const updateData: any = {
    updatedAt: new Date(),
    updatedByUserId: userId,
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.defaultRate !== undefined) updateData.defaultRate = data.defaultRate;
  // Only set sequence if it's explicitly provided (not undefined)
  if (data.sequence !== undefined) {
    updateData.sequence = data.sequence ?? null;
  }
  if (data.legacyFeeSlabId !== undefined)
    updateData.legacyFeeSlabId = data.legacyFeeSlabId ?? null;

  const [updated] = await db
    .update(feeSlabModel)
    .set(updateData)
    .where(eq(feeSlabModel.id, id))
    .returning();

  // Emit socket event for fee slab update
  const io = socketService.getIO();
  if (io && updated) {
    // Get user name for notification
    const user = await userService.findById(userId);
    const userName = user?.name || "Unknown User";

    io.emit("fee_slab_updated", {
      feeSlabId: updated.id,
      type: "update",
      message: "A fee slab has been updated",
      timestamp: new Date().toISOString(),
    });

    // Emit notification to all staff/admin users
    io.emit("notification", {
      id: `fee_slab_updated_${updated.id}_${Date.now()}`,
      type: "update",
      userName,
      message: `updated fee slab: ${updated.name}`,
      createdAt: new Date(),
      read: false,
      meta: { feeSlabId: updated.id, type: "update" },
    });
  }

  return updated ?? null;
};

export const deleteFeeSlab = async (
  id: number,
  userId?: number,
): Promise<typeof feeSlabModel.$inferSelect | null> => {
  // Get the slab before deletion for socket event
  const [existing] = await db
    .select()
    .from(feeSlabModel)
    .where(eq(feeSlabModel.id, id));

  const [deleted] = await db
    .delete(feeSlabModel)
    .where(eq(feeSlabModel.id, id))
    .returning();

  // Emit socket event for fee slab deletion
  const io = socketService.getIO();
  if (io && deleted) {
    // Get user name for notification if userId provided
    let userName = "Unknown User";
    if (userId) {
      const user = await userService.findById(userId);
      userName = user?.name || "Unknown User";
    }

    io.emit("fee_slab_deleted", {
      feeSlabId: id,
      type: "deletion",
      message: "A fee slab has been deleted",
      timestamp: new Date().toISOString(),
    });

    // Emit notification to all staff/admin users
    io.emit("notification", {
      id: `fee_slab_deleted_${id}_${Date.now()}`,
      type: "update",
      userId: userId ? userId.toString() : undefined,
      userName,
      message: `deleted fee slab: ${existing?.name || `ID: ${id}`}`,
      createdAt: new Date(),
      read: false,
      meta: { feeSlabId: id, type: "deletion" },
    });
  }

  return deleted ?? null;
};
