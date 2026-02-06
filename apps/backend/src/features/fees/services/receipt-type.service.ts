import { db } from "@/db/index.js";
import { receiptTypeModel, ReceiptType } from "@repo/db/schemas/models/fees";
import { eq } from "drizzle-orm";
import { socketService } from "@/services/socketService.js";
import * as userService from "@/features/user/services/user.service.js";

type ReceiptTypeInsert = typeof receiptTypeModel.$inferInsert;

export const createReceiptType = async (
  data: Omit<
    ReceiptTypeInsert,
    "id" | "createdAt" | "updatedAt" | "createdByUserId" | "updatedByUserId"
  >,
  userId: number,
): Promise<ReceiptType | null> => {
  const [created] = await db
    .insert(receiptTypeModel)
    .values({
      ...data,
      createdByUserId: userId,
      updatedByUserId: userId,
    })
    .returning();
  return created || null;
};

export const getAllReceiptTypes = async (): Promise<ReceiptType[]> => {
  return db.select().from(receiptTypeModel);
};

export const getReceiptTypeById = async (
  id: number,
): Promise<ReceiptType | null> => {
  const [found] = await db
    .select()
    .from(receiptTypeModel)
    .where(eq(receiptTypeModel.id, id));
  return found || null;
};

export const updateReceiptType = async (
  id: number,
  data: Partial<ReceiptType>,
  userId: number,
): Promise<ReceiptType | null> => {
  const [updated] = await db
    .update(receiptTypeModel)
    .set({
      ...data,
      updatedAt: new Date(),
      updatedByUserId: userId,
    })
    .where(eq(receiptTypeModel.id, id))
    .returning();

  // Emit socket event for receipt type update
  const io = socketService.getIO();
  if (io && updated) {
    // Get user name for notification
    const user = await userService.findById(userId);
    const userName = user?.name || "Unknown User";

    io.emit("receipt_type_updated", {
      receiptTypeId: updated.id,
      type: "update",
      message: "A receipt type has been updated",
      timestamp: new Date().toISOString(),
    });

    // Emit notification to all staff/admin users
    io.emit("notification", {
      id: `receipt_type_updated_${updated.id}_${Date.now()}`,
      type: "update",
      userId: userId.toString(),
      userName,
      message: `updated receipt type: ${updated.name}`,
      createdAt: new Date(),
      read: false,
      meta: { receiptTypeId: updated.id, type: "update" },
    });
  }

  return updated || null;
};

export const deleteReceiptType = async (
  id: number,
  userId?: number,
): Promise<ReceiptType | null> => {
  // Get the receipt type before deletion for socket event
  const [existing] = await db
    .select()
    .from(receiptTypeModel)
    .where(eq(receiptTypeModel.id, id));

  const [deleted] = await db
    .delete(receiptTypeModel)
    .where(eq(receiptTypeModel.id, id))
    .returning();

  // Emit socket event for receipt type deletion
  const io = socketService.getIO();
  if (io && deleted) {
    // Get user name for notification if userId provided
    let userName = "Unknown User";
    if (userId) {
      const user = await userService.findById(userId);
      userName = user?.name || "Unknown User";
    }

    io.emit("receipt_type_deleted", {
      receiptTypeId: id,
      type: "deletion",
      message: "A receipt type has been deleted",
      timestamp: new Date().toISOString(),
    });

    // Emit notification to all staff/admin users
    io.emit("notification", {
      id: `receipt_type_deleted_${id}_${Date.now()}`,
      type: "update",
      userId: userId?.toString(),
      userName,
      message: `deleted receipt type: ${existing?.name || `ID: ${id}`}`,
      createdAt: new Date(),
      read: false,
      meta: { receiptTypeId: id, type: "deletion" },
    });
  }

  return deleted || null;
};
