import { db } from "@/db";
import { feeCategoryModel, createFeeCategorySchema } from "@repo/db/schemas";
import { eq } from "drizzle-orm";
import { FeeCategoryDto } from "@repo/db/dtos/fees";
import { socketService } from "@/services/socketService.js";
import * as userService from "@/features/user/services/user.service.js";

/**
 * Services should accept validated DTOs (controller validates via zod) and
 * return raw rows / arrays / null. Do not catch errors here — controller will handle them.
 */
export const createFeeCategory = async (
  data: Omit<
    typeof createFeeCategorySchema._type,
    "id" | "createdAt" | "updatedAt" | "createdByUserId" | "updatedByUserId"
  >,
  userId: number,
): Promise<FeeCategoryDto> => {
  const [created] = await db
    .insert(feeCategoryModel)
    .values({
      ...data,
      createdByUserId: userId,
      updatedByUserId: userId,
    })
    .returning();

  const dto = created as FeeCategoryDto;

  // Emit socket event for fee category creation
  const io = socketService.getIO();
  if (io && dto) {
    // Get user name for notification
    const user = await userService.findById(userId);
    const userName = user?.name || "Unknown User";

    io.emit("fee_category_created", {
      feeCategoryId: dto.id,
      type: "creation",
      message: "A new fee category has been created",
      timestamp: new Date().toISOString(),
    });

    const notification = {
      id: `fee_category_created_${dto.id}_${Date.now()}`,
      type: "info" as const,
      userId: userId.toString(),
      userName,
      message: `created a new fee category: ${dto.name}`,
      createdAt: new Date(),
      read: false,
      meta: { feeCategoryId: dto.id, type: "creation" },
    };
    socketService.sendNotificationToAdminStaff(notification);
    io.emit("notification", notification);
  }

  return dto;
};

export const getAllFeeCategories = async (): Promise<FeeCategoryDto[]> => {
  const rows = await db.select().from(feeCategoryModel);
  return rows as FeeCategoryDto[];
};

export const getFeeCategoryById = async (
  id: number,
): Promise<FeeCategoryDto | null> => {
  const [row] = await db
    .select()
    .from(feeCategoryModel)
    .where(eq(feeCategoryModel.id, id));

  return (row ?? null) as FeeCategoryDto | null;
};

export const updateFeeCategory = async (
  id: number,
  data: Partial<typeof createFeeCategorySchema._type>,
  userId: number,
): Promise<FeeCategoryDto | null> => {
  const [updated] = await db
    .update(feeCategoryModel)
    .set({
      ...data,
      updatedAt: new Date(),
      updatedByUserId: userId,
    })
    .where(eq(feeCategoryModel.id, id))
    .returning();

  return (updated ?? null) as FeeCategoryDto | null;
};

export const deleteFeeCategory = async (
  id: number,
  userId?: number,
): Promise<FeeCategoryDto | null> => {
  // Get the category before deletion for socket event
  const [existing] = await db
    .select()
    .from(feeCategoryModel)
    .where(eq(feeCategoryModel.id, id));

  const [deleted] = await db
    .delete(feeCategoryModel)
    .where(eq(feeCategoryModel.id, id))
    .returning();

  const dto = (deleted ?? null) as FeeCategoryDto | null;

  // Emit socket event for fee category deletion
  const io = socketService.getIO();
  if (io && dto) {
    // Get user name for notification if userId provided
    let userName = "Unknown User";
    if (userId) {
      const user = await userService.findById(userId);
      userName = user?.name || "Unknown User";
    }

    io.emit("fee_category_deleted", {
      feeCategoryId: id,
      type: "deletion",
      message: "A fee category has been deleted",
      timestamp: new Date().toISOString(),
    });

    const notification = {
      id: `fee_category_deleted_${id}_${Date.now()}`,
      type: "update" as const,
      userId: userId?.toString(),
      userName,
      message: `deleted fee category: ${existing?.name || `ID: ${id}`}`,
      createdAt: new Date(),
      read: false,
      meta: { feeCategoryId: id, type: "deletion" },
    };
    socketService.sendNotificationToAdminStaff(notification);
    io.emit("notification", notification);
  }

  return dto;
};
