import { db } from "@/db";
import {
  FeeConcessionSlab,
  feeConcessionSlabModel,
  createFeeConcessionSlabSchema,
} from "@repo/db/schemas";
import { eq } from "drizzle-orm";

export type ServiceResult<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
};

export const createFeeConcessionSlab = async (
  data: FeeConcessionSlab,
): Promise<ServiceResult<typeof feeConcessionSlabModel.$inferSelect>> => {
  try {
    // Validate input using the drizzle-zod schema
    createFeeConcessionSlabSchema.parse(data);

    const [created] = await db
      .insert(feeConcessionSlabModel)
      .values(data)
      .returning();

    return {
      success: true,
      message: "Fee concession slab created successfully",
      data: created,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to create fee concession slab",
      error,
    };
  }
};

export const getAllFeeConcessionSlabs = async (): Promise<
  ServiceResult<(typeof feeConcessionSlabModel.$inferSelect)[]>
> => {
  try {
    const slabs = await db.select().from(feeConcessionSlabModel);
    return {
      success: true,
      message: "Fee concession slabs retrieved successfully",
      data: slabs,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to retrieve fee concession slabs",
      error,
    };
  }
};

export const getFeeConcessionSlabById = async (
  id: number,
): Promise<ServiceResult<typeof feeConcessionSlabModel.$inferSelect>> => {
  try {
    const [slab] = await db
      .select()
      .from(feeConcessionSlabModel)
      .where(eq(feeConcessionSlabModel.id, id));

    if (!slab) {
      return {
        success: false,
        message: `Fee concession slab with ID ${id} not found`,
      };
    }

    return {
      success: true,
      message: "Fee concession slab retrieved successfully",
      data: slab,
    };
  } catch (error) {
    return {
      success: false,
      message: "Error retrieving fee concession slab",
      error,
    };
  }
};

export const updateFeeConcessionSlab = async (
  id: number,
  data: Partial<FeeConcessionSlab>,
): Promise<ServiceResult<typeof feeConcessionSlabModel.$inferSelect>> => {
  try {
    // Use partial schema for validation
    const partialSchema = createFeeConcessionSlabSchema.partial();
    partialSchema.parse(data);

    const [updated] = await db
      .update(feeConcessionSlabModel)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(feeConcessionSlabModel.id, id))
      .returning();

    if (!updated) {
      return {
        success: false,
        message: `Fee concession slab with ID ${id} not found`,
      };
    }

    return {
      success: true,
      message: "Fee concession slab updated successfully",
      data: updated,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to update fee concession slab",
      error,
    };
  }
};

export const deleteFeeConcessionSlab = async (
  id: number,
): Promise<ServiceResult<typeof feeConcessionSlabModel.$inferSelect>> => {
  try {
    const [deleted] = await db
      .delete(feeConcessionSlabModel)
      .where(eq(feeConcessionSlabModel.id, id))
      .returning();

    if (!deleted) {
      return {
        success: false,
        message: `Fee concession slab with ID ${id} not found`,
      };
    }

    return {
      success: true,
      message: "Fee concession slab deleted successfully",
      data: deleted,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to delete fee concession slab",
      error,
    };
  }
};
