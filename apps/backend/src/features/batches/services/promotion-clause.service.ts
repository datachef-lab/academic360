import { db } from "@/db/index.js";
import {
  classModel,
  createPromotionClauseSchema,
  promotionBuilderClauseMappingModel,
  promotionClauseClassMappingModel,
  promotionClauseModel,
} from "@repo/db/schemas";
import { asc, eq } from "drizzle-orm";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
import type {
  PromotionClauseClassMappingDto,
  PromotionClauseDto,
} from "@repo/db/dtos/batches";
import type { ClassT } from "@repo/db/schemas/models/academics";

export async function findAllPromotionClauses(opts?: {
  isActive?: boolean;
}): Promise<PromotionClauseDto[]> {
  const where =
    opts?.isActive === undefined
      ? undefined
      : eq(promotionClauseModel.isActive, opts.isActive);

  const rows = await db
    .select()
    .from(promotionClauseModel)
    .where(where)
    .orderBy(asc(promotionClauseModel.name));

  return Promise.all(rows.map((row) => toClauseWithClasses(row)));
}

export async function findPromotionClauseById(
  id: number,
): Promise<PromotionClauseDto | null> {
  const [row] = await db
    .select()
    .from(promotionClauseModel)
    .where(eq(promotionClauseModel.id, id));

  if (!row) return null;
  return toClauseWithClasses(row);
}

async function toClauseWithClasses(
  clause: typeof promotionClauseModel.$inferSelect,
): Promise<PromotionClauseDto> {
  const mappings = await db
    .select({
      mapping: promotionClauseClassMappingModel,
      cls: classModel,
    })
    .from(promotionClauseClassMappingModel)
    .innerJoin(
      classModel,
      eq(promotionClauseClassMappingModel.classId, classModel.id),
    )
    .where(eq(promotionClauseClassMappingModel.promotionClauseId, clause.id))
    .orderBy(asc(classModel.name));

  const classes: PromotionClauseClassMappingDto[] = mappings.map((m) => ({
    ...m.mapping,
    class: m.cls as ClassT,
  }));

  return {
    ...clause,
    classes,
  } as PromotionClauseDto;
}

type PromotionClauseInsert = typeof createPromotionClauseSchema._type;

export async function createPromotionClause(
  data: PromotionClauseInsert,
): Promise<PromotionClauseDto | null> {
  const [created] = await db
    .insert(promotionClauseModel)
    .values(data)
    .returning();

  if (!created) return null;
  return toClauseWithClasses(created);
}

async function syncPromotionClauseClassMappingsTx(
  tx: DbTx,
  promotionClauseId: number,
  classIds: number[],
) {
  await tx
    .delete(promotionClauseClassMappingModel)
    .where(
      eq(promotionClauseClassMappingModel.promotionClauseId, promotionClauseId),
    );

  if (classIds.length === 0) return;

  const uniqueClassIds = [...new Set(classIds)];
  await tx.insert(promotionClauseClassMappingModel).values(
    uniqueClassIds.map((classId) => ({
      promotionClauseId,
      classId,
    })),
  );
}

export async function updatePromotionClause(
  id: number,
  data: Partial<PromotionClauseInsert>,
  options?: { classIds?: number[] },
): Promise<PromotionClauseDto | null> {
  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(promotionClauseModel)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(promotionClauseModel.id, id))
      .returning();

    if (!updated) return null;

    if (options?.classIds !== undefined) {
      await syncPromotionClauseClassMappingsTx(tx, id, options.classIds);
    }

    return updated;
  });

  if (!result) return null;
  return findPromotionClauseById(id);
}

export async function replacePromotionClauseClassMappings(
  promotionClauseId: number,
  classIds: number[],
): Promise<PromotionClauseDto | null> {
  const clause = await findPromotionClauseById(promotionClauseId);
  if (!clause) return null;

  await db.transaction(async (tx) => {
    await syncPromotionClauseClassMappingsTx(tx, promotionClauseId, classIds);
  });

  return findPromotionClauseById(promotionClauseId);
}

export async function deletePromotionClause(id: number): Promise<boolean> {
  const used = await db
    .select({ id: promotionBuilderClauseMappingModel.id })
    .from(promotionBuilderClauseMappingModel)
    .where(eq(promotionBuilderClauseMappingModel.promotionClauseId, id))
    .limit(1);

  if (used.length > 0) {
    const err = new Error(
      "Promotion clause is referenced by promotion builder rules",
    );
    (err as any).statusCode = 409;
    throw err;
  }

  await db
    .delete(promotionClauseClassMappingModel)
    .where(eq(promotionClauseClassMappingModel.promotionClauseId, id));

  const [del] = await db
    .delete(promotionClauseModel)
    .where(eq(promotionClauseModel.id, id))
    .returning({ id: promotionClauseModel.id });

  return !!del;
}
