import { db } from "@/db/index.js";
import {
  feeStructureSlabModel,
  createFeeStructureSlabSchema,
  feeSlabModel,
} from "@repo/db/schemas/models/fees";
import { eq, inArray } from "drizzle-orm";
import type { FeeStructureSlabDto } from "@repo/db/dtos/fees";

type FeeStructureSlabInsert = typeof feeStructureSlabModel.$inferInsert;

export const createFeeStructureSlab = async (
  data: Omit<FeeStructureSlabInsert, "id" | "createdAt" | "updatedAt">,
): Promise<FeeStructureSlabDto | null> => {
  const [created] = await db
    .insert(feeStructureSlabModel)
    .values(data)
    .returning();
  if (!created) return null;

  const [feeSlab] = await db
    .select()
    .from(feeSlabModel)
    .where(eq(feeSlabModel.id, created.feeSlabId));

  if (!feeSlab) return null;

  const { feeSlabId, ...rest } = created;
  const dto: FeeStructureSlabDto = {
    ...rest,
    feeSlab: feeSlab as typeof feeSlabModel.$inferSelect,
  };

  return dto;
};

export const getAllFeeStructureSlabs = async (): Promise<
  FeeStructureSlabDto[]
> => {
  const slabs = await db.select().from(feeStructureSlabModel);

  const feeSlabIds = Array.from(
    new Set(slabs.map((s) => s.feeSlabId).filter(Boolean)),
  );
  const feeSlabs = feeSlabIds.length
    ? await db
        .select()
        .from(feeSlabModel)
        .where(inArray(feeSlabModel.id, feeSlabIds))
    : [];

  const feeSlabsMap = new Map(feeSlabs.map((fs) => [fs.id, fs]));

  const dto: FeeStructureSlabDto[] = [];
  for (const s of slabs) {
    const feeSlab = feeSlabsMap.get(s.feeSlabId);
    if (feeSlab) {
      const { feeSlabId, ...rest } = s;
      dto.push({
        ...rest,
        feeSlab: feeSlab as typeof feeSlabModel.$inferSelect,
      });
    }
  }

  return dto;
};

export const getFeeStructureSlabById = async (
  id: number,
): Promise<FeeStructureSlabDto | null> => {
  const [slab] = await db
    .select()
    .from(feeStructureSlabModel)
    .where(eq(feeStructureSlabModel.id, id));
  if (!slab) return null;

  const [feeSlab] = await db
    .select()
    .from(feeSlabModel)
    .where(eq(feeSlabModel.id, slab.feeSlabId));

  if (!feeSlab) return null;

  const { feeSlabId, ...rest } = slab;
  const dto: FeeStructureSlabDto = {
    ...rest,
    feeSlab: feeSlab as typeof feeSlabModel.$inferSelect,
  };

  return dto;
};

export const updateFeeStructureSlab = async (
  id: number,
  data: Partial<typeof createFeeStructureSlabSchema._type>,
): Promise<FeeStructureSlabDto | null> => {
  const [updated] = await db
    .update(feeStructureSlabModel)
    .set(data)
    .where(eq(feeStructureSlabModel.id, id))
    .returning();
  if (!updated) return null;

  const [feeSlab] = await db
    .select()
    .from(feeSlabModel)
    .where(eq(feeSlabModel.id, updated.feeSlabId));

  if (!feeSlab) return null;

  const { feeSlabId, ...rest } = updated;
  const dto: FeeStructureSlabDto = {
    ...rest,
    feeSlab: feeSlab as typeof feeSlabModel.$inferSelect,
  };

  return dto;
};

export const deleteFeeStructureSlab = async (
  id: number,
): Promise<FeeStructureSlabDto | null> => {
  const [deleted] = await db
    .delete(feeStructureSlabModel)
    .where(eq(feeStructureSlabModel.id, id))
    .returning();
  if (!deleted) return null;

  const [feeSlab] = await db
    .select()
    .from(feeSlabModel)
    .where(eq(feeSlabModel.id, deleted.feeSlabId));

  if (!feeSlab) return null;

  const { feeSlabId, ...rest } = deleted;
  const dto: FeeStructureSlabDto = {
    ...rest,
    feeSlab: feeSlab as typeof feeSlabModel.$inferSelect,
  };

  return dto;
};
