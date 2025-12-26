import { db } from "@/db";
import { feeHeadModel, createFeeHeadSchema } from "@repo/db/schemas";
import { eq } from "drizzle-orm";

export type ServiceResult<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
};

export const createFeeHead = async (
  data: unknown,
): Promise<ServiceResult<typeof feeHeadModel.$inferSelect>> => {
  try {
    const parsed = createFeeHeadSchema.parse(data);
    const [created] = await db.insert(feeHeadModel).values(parsed).returning();

    return {
      success: true,
      message: "Fee head created successfully",
      data: created,
    };
  } catch (error) {
    return { success: false, message: "Failed to create fee head", error };
  }
};

export const getAllFeeHeads = async (): Promise<
  ServiceResult<(typeof feeHeadModel.$inferSelect)[]>
> => {
  try {
    const rows = await db.select().from(feeHeadModel);
    return {
      success: true,
      message: "Fee heads retrieved successfully",
      data: rows,
    };
  } catch (error) {
    return { success: false, message: "Failed to retrieve fee heads", error };
  }
};

export const getFeeHeadById = async (
  id: number,
): Promise<ServiceResult<typeof feeHeadModel.$inferSelect>> => {
  try {
    const [row] = await db
      .select()
      .from(feeHeadModel)
      .where(eq(feeHeadModel.id, id));
    if (!row)
      return { success: false, message: `Fee head with ID ${id} not found` };
    return {
      success: true,
      message: "Fee head retrieved successfully",
      data: row,
    };
  } catch (error) {
    return { success: false, message: "Error retrieving fee head", error };
  }
};

export const updateFeeHead = async (
  id: number,
  data: unknown,
): Promise<ServiceResult<typeof feeHeadModel.$inferSelect>> => {
  try {
    const partialSchema = createFeeHeadSchema.partial();
    const parsed = partialSchema.parse(data);

    const [updated] = await db
      .update(feeHeadModel)
      .set({ ...parsed, updatedAt: new Date() })
      .where(eq(feeHeadModel.id, id))
      .returning();

    if (!updated)
      return { success: false, message: `Fee head with ID ${id} not found` };
    return {
      success: true,
      message: "Fee head updated successfully",
      data: updated,
    };
  } catch (error) {
    return { success: false, message: "Failed to update fee head", error };
  }
};

export const deleteFeeHead = async (
  id: number,
): Promise<ServiceResult<typeof feeHeadModel.$inferSelect>> => {
  try {
    const [deleted] = await db
      .delete(feeHeadModel)
      .where(eq(feeHeadModel.id, id))
      .returning();
    if (!deleted)
      return { success: false, message: `Fee head with ID ${id} not found` };
    return {
      success: true,
      message: "Fee head deleted successfully",
      data: deleted,
    };
  } catch (error) {
    return { success: false, message: "Failed to delete fee head", error };
  }
};
