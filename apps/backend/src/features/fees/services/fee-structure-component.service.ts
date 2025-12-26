import { db } from "@/db";
import {
  feeStructureComponentModel,
  createFeeStructureComponentSchema,
  feeHeadModel,
} from "@repo/db/schemas";
import { eq, inArray } from "drizzle-orm";
import type { FeeStructureComponentDto } from "@repo/db/dtos/fees";

export type ServiceResult<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
};

export const createFeeStructureComponent = async (
  data: unknown,
): Promise<ServiceResult<typeof feeStructureComponentModel.$inferSelect>> => {
  try {
    const parsed = createFeeStructureComponentSchema.parse(data);
    const [created] = await db
      .insert(feeStructureComponentModel)
      .values(parsed)
      .returning();

    return {
      success: true,
      message: "Fee structure component created successfully",
      data: created,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to create fee structure component",
      error,
    };
  }
};

export const getAllFeeStructureComponents = async (): Promise<
  ServiceResult<FeeStructureComponentDto[]>
> => {
  try {
    const components = await db.select().from(feeStructureComponentModel);

    const feeHeadIds = Array.from(
      new Set(components.map((c) => c.feeHeadId).filter(Boolean)),
    );
    const heads = feeHeadIds.length
      ? await db
          .select()
          .from(feeHeadModel)
          .where(inArray(feeHeadModel.id, feeHeadIds))
      : [];

    const headsMap = new Map(heads.map((h) => [h.id, h]));

    const dto: FeeStructureComponentDto[] = components.map((c) => ({
      ...c,
      feeHead: headsMap.get(c.feeHeadId) ?? null,
    }));

    return {
      success: true,
      message: "Fee structure components retrieved successfully",
      data: dto,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to retrieve fee structure components",
      error,
    };
  }
};

export const getFeeStructureComponentById = async (
  id: number,
): Promise<ServiceResult<FeeStructureComponentDto>> => {
  try {
    const [component] = await db
      .select()
      .from(feeStructureComponentModel)
      .where(eq(feeStructureComponentModel.id, id));
    if (!component)
      return {
        success: false,
        message: `Fee structure component with ID ${id} not found`,
      };

    const [feeHead] = await db
      .select()
      .from(feeHeadModel)
      .where(eq(feeHeadModel.id, component.feeHeadId));

    const dto: FeeStructureComponentDto = {
      ...component,
      feeHead: feeHead ?? null,
    };

    return {
      success: true,
      message: "Fee structure component retrieved successfully",
      data: dto,
    };
  } catch (error) {
    return {
      success: false,
      message: "Error retrieving fee structure component",
      error,
    };
  }
};

export const updateFeeStructureComponent = async (
  id: number,
  data: unknown,
): Promise<ServiceResult<typeof feeStructureComponentModel.$inferSelect>> => {
  try {
    const partialSchema = createFeeStructureComponentSchema.partial();
    const parsed = partialSchema.parse(data);

    const [updated] = await db
      .update(feeStructureComponentModel)
      .set({ ...parsed, updatedAt: new Date() })
      .where(eq(feeStructureComponentModel.id, id))
      .returning();

    if (!updated)
      return {
        success: false,
        message: `Fee structure component with ID ${id} not found`,
      };

    return {
      success: true,
      message: "Fee structure component updated successfully",
      data: updated,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to update fee structure component",
      error,
    };
  }
};

export const deleteFeeStructureComponent = async (
  id: number,
): Promise<ServiceResult<typeof feeStructureComponentModel.$inferSelect>> => {
  try {
    const [deleted] = await db
      .delete(feeStructureComponentModel)
      .where(eq(feeStructureComponentModel.id, id))
      .returning();
    if (!deleted)
      return {
        success: false,
        message: `Fee structure component with ID ${id} not found`,
      };
    return {
      success: true,
      message: "Fee structure component deleted successfully",
      data: deleted,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to delete fee structure component",
      error,
    };
  }
};
