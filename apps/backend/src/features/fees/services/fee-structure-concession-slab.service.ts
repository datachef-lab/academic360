import { db } from "@/db/index.js";
import {
  feeStructureConcessionSlabModel,
  createFeeStructureConcessionSlabSchema,
  feeConcessionSlabModel,
  FeeStructureConcessionSlab,
} from "@repo/db/schemas/models/fees";
import { eq, inArray } from "drizzle-orm";
import type { FeeStructureConcessionSlabDto } from "@repo/db/dtos/fees";

type FeeStructureConcessionSlabInsert =
  typeof feeStructureConcessionSlabModel.$inferInsert;

export const createFeeStructureConcessionSlab = async (
  data: Omit<
    FeeStructureConcessionSlabInsert,
    "id" | "createdAt" | "updatedAt"
  >,
): Promise<FeeStructureConcessionSlabDto | null> => {
  const [created] = await db
    .insert(feeStructureConcessionSlabModel)
    .values(data)
    .returning();
  if (!created) return null;

  const [feeConcessionSlab] = await db
    .select()
    .from(feeConcessionSlabModel)
    .where(eq(feeConcessionSlabModel.id, created.feeConcessionSlabId));

  if (!feeConcessionSlab) return null;

  const { feeConcessionSlabId, ...rest } = created;
  const dto: FeeStructureConcessionSlabDto = {
    ...rest,
    feeConcessionSlab:
      feeConcessionSlab as typeof feeConcessionSlabModel.$inferSelect,
  };

  return dto;
};

export const getAllFeeStructureConcessionSlabs = async (): Promise<
  FeeStructureConcessionSlabDto[]
> => {
  const slabs = await db.select().from(feeStructureConcessionSlabModel);

  const feeConcessionSlabIds = Array.from(
    new Set(slabs.map((s) => s.feeConcessionSlabId).filter(Boolean)),
  );
  const concessionSlabs = feeConcessionSlabIds.length
    ? await db
        .select()
        .from(feeConcessionSlabModel)
        .where(inArray(feeConcessionSlabModel.id, feeConcessionSlabIds))
    : [];

  const concessionSlabsMap = new Map(concessionSlabs.map((cs) => [cs.id, cs]));

  const dto: FeeStructureConcessionSlabDto[] = [];
  for (const s of slabs) {
    const feeConcessionSlab = concessionSlabsMap.get(s.feeConcessionSlabId);
    if (feeConcessionSlab) {
      const { feeConcessionSlabId, ...rest } = s;
      dto.push({
        ...rest,
        feeConcessionSlab:
          feeConcessionSlab as typeof feeConcessionSlabModel.$inferSelect,
      });
    }
  }

  return dto;
};

export const getFeeStructureConcessionSlabById = async (
  id: number,
): Promise<FeeStructureConcessionSlabDto | null> => {
  const [slab] = await db
    .select()
    .from(feeStructureConcessionSlabModel)
    .where(eq(feeStructureConcessionSlabModel.id, id));
  if (!slab) return null;

  const [feeConcessionSlab] = await db
    .select()
    .from(feeConcessionSlabModel)
    .where(eq(feeConcessionSlabModel.id, slab.feeConcessionSlabId));

  if (!feeConcessionSlab) return null;

  const { feeConcessionSlabId, ...rest } = slab;
  const dto: FeeStructureConcessionSlabDto = {
    ...rest,
    feeConcessionSlab:
      feeConcessionSlab as typeof feeConcessionSlabModel.$inferSelect,
  };

  return dto;
};

export const updateFeeStructureConcessionSlab = async (
  id: number,
  data: Partial<FeeStructureConcessionSlab>,
): Promise<FeeStructureConcessionSlabDto | null> => {
  const [updated] = await db
    .update(feeStructureConcessionSlabModel)
    .set(data)
    .where(eq(feeStructureConcessionSlabModel.id, id))
    .returning();
  if (!updated) return null;

  const [feeConcessionSlab] = await db
    .select()
    .from(feeConcessionSlabModel)
    .where(eq(feeConcessionSlabModel.id, updated.feeConcessionSlabId));

  if (!feeConcessionSlab) return null;

  const { feeConcessionSlabId, ...rest } = updated;
  const dto: FeeStructureConcessionSlabDto = {
    ...rest,
    feeConcessionSlab:
      feeConcessionSlab as typeof feeConcessionSlabModel.$inferSelect,
  };

  return dto;
};

export const deleteFeeStructureConcessionSlab = async (
  id: number,
): Promise<FeeStructureConcessionSlabDto | null> => {
  const [deleted] = await db
    .delete(feeStructureConcessionSlabModel)
    .where(eq(feeStructureConcessionSlabModel.id, id))
    .returning();
  if (!deleted) return null;

  const [feeConcessionSlab] = await db
    .select()
    .from(feeConcessionSlabModel)
    .where(eq(feeConcessionSlabModel.id, deleted.feeConcessionSlabId));

  if (!feeConcessionSlab) return null;

  const { feeConcessionSlabId, ...rest } = deleted;
  const dto: FeeStructureConcessionSlabDto = {
    ...rest,
    feeConcessionSlab:
      feeConcessionSlab as typeof feeConcessionSlabModel.$inferSelect,
  };

  return dto;
};
