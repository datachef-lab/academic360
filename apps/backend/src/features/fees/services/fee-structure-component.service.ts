import { db } from "@/db";
import {
  feeStructureComponentModel,
  createFeeStructureComponentSchema,
  feeHeadModel,
} from "@repo/db/schemas";
import { eq, inArray } from "drizzle-orm";
import type { FeeStructureComponentDto } from "@repo/db/dtos/fees";

/**
 * Services return raw DTOs/arrays/null and do not catch errors.
 */
export const createFeeStructureComponent = async (
  data: typeof createFeeStructureComponentSchema._type,
): Promise<typeof feeStructureComponentModel.$inferSelect> => {
  const [created] = await db
    .insert(feeStructureComponentModel)
    .values(data)
    .returning();
  return created;
};

export const getAllFeeStructureComponents = async (): Promise<
  FeeStructureComponentDto[]
> => {
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

  return dto;
};

export const getFeeStructureComponentById = async (
  id: number,
): Promise<FeeStructureComponentDto | null> => {
  const [component] = await db
    .select()
    .from(feeStructureComponentModel)
    .where(eq(feeStructureComponentModel.id, id));
  if (!component) return null;

  const [feeHead] = await db
    .select()
    .from(feeHeadModel)
    .where(eq(feeHeadModel.id, component.feeHeadId));

  const dto: FeeStructureComponentDto = {
    ...component,
    feeHead: feeHead ?? null,
  };

  return dto;
};

export const updateFeeStructureComponent = async (
  id: number,
  data: Partial<typeof createFeeStructureComponentSchema._type>,
): Promise<typeof feeStructureComponentModel.$inferSelect | null> => {
  const [updated] = await db
    .update(feeStructureComponentModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(feeStructureComponentModel.id, id))
    .returning();

  return updated ?? null;
};

export const deleteFeeStructureComponent = async (
  id: number,
): Promise<typeof feeStructureComponentModel.$inferSelect | null> => {
  const [deleted] = await db
    .delete(feeStructureComponentModel)
    .where(eq(feeStructureComponentModel.id, id))
    .returning();

  return deleted ?? null;
};
