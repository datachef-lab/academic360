import { db } from "@/db/index.js";
import {
  affiliationModel,
  classModel,
  createPromotionBuilderSchema,
  promotionBuilderClauseClassMappingModel,
  promotionBuilderClauseMappingModel,
  promotionBuilderModel,
  promotionClauseClassMappingModel,
  promotionClauseModel,
} from "@repo/db/schemas";
import type {
  PromotionBuilderClauseClassMappingDto,
  PromotionBuilderClauseDto,
  PromotionBuilderDto,
} from "@repo/db/dtos/batches";
import type { ClassT } from "@repo/db/schemas/models/academics";
import type { AffiliationT } from "@repo/db/schemas/models/course-design";
import type { PromotionClauseT } from "@repo/db/schemas/models/batches/promotion-clause.model";
import { and, asc, eq, inArray } from "drizzle-orm";

type BuilderInsert = typeof createPromotionBuilderSchema._type;

export type PromotionBuilderRuleInput = {
  promotionClauseId: number;
  operator: "EQUALS" | "NONE_IN";
  /** Class IDs linked via `promotion_clause_class_mapping` for this clause */
  classIds: number[];
};

async function rowToPromotionBuilderDto(
  row: typeof promotionBuilderModel.$inferSelect,
): Promise<PromotionBuilderDto | null> {
  const [affRow] = await db
    .select()
    .from(affiliationModel)
    .where(eq(affiliationModel.id, row.affiliationId));

  const [targetClass] = await db
    .select()
    .from(classModel)
    .where(eq(classModel.id, row.targetClassId));

  if (!affRow || !targetClass) return null;

  const mappings = await db
    .select()
    .from(promotionBuilderClauseMappingModel)
    .where(eq(promotionBuilderClauseMappingModel.promotionBuilderId, row.id));

  const rules = await Promise.all(
    mappings.map(async (m) => {
      const [clause] = await db
        .select()
        .from(promotionClauseModel)
        .where(eq(promotionClauseModel.id, m.promotionClauseId));

      if (!clause) {
        throw new Error(
          `Missing promotion_clause ${m.promotionClauseId} for builder rule ${m.id}`,
        );
      }

      const pbccRows = await db
        .select()
        .from(promotionBuilderClauseClassMappingModel)
        .where(
          eq(
            promotionBuilderClauseClassMappingModel.promotionBuilderClauseId,
            m.id,
          ),
        );

      const classes: PromotionBuilderClauseClassMappingDto[] =
        await Promise.all(
          pbccRows.map(async (pbcc) => {
            const [pccm] = await db
              .select()
              .from(promotionClauseClassMappingModel)
              .where(
                eq(
                  promotionClauseClassMappingModel.id,
                  pbcc.promotionClauseClassId,
                ),
              );

            if (!pccm) {
              throw new Error(
                `Missing promotion_clause_class_mapping ${pbcc.promotionClauseClassId}`,
              );
            }

            const [cls] = await db
              .select()
              .from(classModel)
              .where(eq(classModel.id, pccm.classId));

            if (!cls) throw new Error(`Missing class ${pccm.classId}`);

            return {
              id: pbcc.id,
              promotionBuilderClauseId: pbcc.promotionBuilderClauseId,
              createdAt: pbcc.createdAt,
              updatedAt: pbcc.updatedAt,
              class: cls as ClassT,
            };
          }),
        );

      const rule: PromotionBuilderClauseDto = {
        id: m.id,
        promotionBuilderId: m.promotionBuilderId,
        operator: m.operator,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        promotionClause: clause as PromotionClauseT,
        classes,
      };
      return rule;
    }),
  );

  return {
    ...row,
    affiliation: affRow as AffiliationT,
    targetClass: targetClass as ClassT,
    rules,
  };
}

export async function findAllPromotionBuilders(
  affiliationId?: number,
): Promise<PromotionBuilderDto[]> {
  const where =
    affiliationId === undefined
      ? undefined
      : eq(promotionBuilderModel.affiliationId, affiliationId);

  const rows = await db
    .select()
    .from(promotionBuilderModel)
    .where(where)
    .orderBy(asc(promotionBuilderModel.id));

  const dtos = await Promise.all(rows.map((r) => rowToPromotionBuilderDto(r)));
  return dtos.filter((d): d is PromotionBuilderDto => d !== null);
}

export async function findPromotionBuilderById(
  id: number,
): Promise<PromotionBuilderDto | null> {
  const [row] = await db
    .select()
    .from(promotionBuilderModel)
    .where(eq(promotionBuilderModel.id, id));

  if (!row) return null;
  return rowToPromotionBuilderDto(row);
}

export async function createPromotionBuilder(
  data: BuilderInsert,
  rules?: PromotionBuilderRuleInput[],
): Promise<PromotionBuilderDto | null> {
  const result = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(promotionBuilderModel)
      .values(data)
      .returning();

    if (!created) return null;

    if (rules?.length) {
      await applyRulesTx(tx, created.id, rules);
    }

    return created.id;
  });

  if (result == null) return null;
  return findPromotionBuilderById(result);
}

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function clearAndApplyRulesTx(
  tx: DbTx,
  promotionBuilderId: number,
  rules: PromotionBuilderRuleInput[],
) {
  const mappingRows = await tx
    .select({ id: promotionBuilderClauseMappingModel.id })
    .from(promotionBuilderClauseMappingModel)
    .where(
      eq(
        promotionBuilderClauseMappingModel.promotionBuilderId,
        promotionBuilderId,
      ),
    );

  const mappingIds = mappingRows.map((r) => r.id);
  if (mappingIds.length) {
    await tx
      .delete(promotionBuilderClauseClassMappingModel)
      .where(
        inArray(
          promotionBuilderClauseClassMappingModel.promotionBuilderClauseId,
          mappingIds,
        ),
      );
    await tx
      .delete(promotionBuilderClauseMappingModel)
      .where(
        eq(
          promotionBuilderClauseMappingModel.promotionBuilderId,
          promotionBuilderId,
        ),
      );
  }

  await applyRulesTx(tx, promotionBuilderId, rules);
}

async function applyRulesTx(
  tx: DbTx,
  promotionBuilderId: number,
  rules: PromotionBuilderRuleInput[],
) {
  for (const rule of rules) {
    const [pbc] = await tx
      .insert(promotionBuilderClauseMappingModel)
      .values({
        promotionBuilderId,
        promotionClauseId: rule.promotionClauseId,
        operator: rule.operator,
      })
      .returning();

    if (!pbc)
      throw new Error("Failed to create promotion_builder_clause_mapping");

    for (const classId of [...new Set(rule.classIds)]) {
      const pccmId = await ensurePromotionClauseClassMappingIdTx(
        tx,
        rule.promotionClauseId,
        classId,
      );
      await tx.insert(promotionBuilderClauseClassMappingModel).values({
        promotionBuilderClauseId: pbc.id,
        promotionClauseClassId: pccmId,
      });
    }
  }
}

async function ensurePromotionClauseClassMappingIdTx(
  tx: DbTx,
  promotionClauseId: number,
  classId: number,
): Promise<number> {
  const [existing] = await tx
    .select({ id: promotionClauseClassMappingModel.id })
    .from(promotionClauseClassMappingModel)
    .where(
      and(
        eq(
          promotionClauseClassMappingModel.promotionClauseId,
          promotionClauseId,
        ),
        eq(promotionClauseClassMappingModel.classId, classId),
      ),
    );

  if (existing) return existing.id;

  const [created] = await tx
    .insert(promotionClauseClassMappingModel)
    .values({ promotionClauseId, classId })
    .returning({ id: promotionClauseClassMappingModel.id });

  if (!created)
    throw new Error("Failed to create promotion_clause_class_mapping");
  return created.id;
}

export async function updatePromotionBuilder(
  id: number,
  data: Partial<BuilderInsert>,
  options?: { rules?: PromotionBuilderRuleInput[] },
): Promise<PromotionBuilderDto | null> {
  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(promotionBuilderModel)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(promotionBuilderModel.id, id))
      .returning();

    if (!updated) return null;

    if (options?.rules !== undefined) {
      await clearAndApplyRulesTx(tx, id, options.rules);
    }

    return updated;
  });

  if (!result) return null;
  return findPromotionBuilderById(id);
}

export async function replacePromotionBuilderRules(
  promotionBuilderId: number,
  rules: PromotionBuilderRuleInput[],
): Promise<PromotionBuilderDto | null> {
  const existing = await findPromotionBuilderById(promotionBuilderId);
  if (!existing) return null;

  await db.transaction(async (tx) => {
    await clearAndApplyRulesTx(tx, promotionBuilderId, rules);
  });

  return findPromotionBuilderById(promotionBuilderId);
}

export async function deletePromotionBuilder(id: number): Promise<boolean> {
  const mappingRows = await db
    .select({ id: promotionBuilderClauseMappingModel.id })
    .from(promotionBuilderClauseMappingModel)
    .where(eq(promotionBuilderClauseMappingModel.promotionBuilderId, id));

  const mappingIds = mappingRows.map((r) => r.id);
  if (mappingIds.length) {
    await db
      .delete(promotionBuilderClauseClassMappingModel)
      .where(
        inArray(
          promotionBuilderClauseClassMappingModel.promotionBuilderClauseId,
          mappingIds,
        ),
      );
    await db
      .delete(promotionBuilderClauseMappingModel)
      .where(eq(promotionBuilderClauseMappingModel.promotionBuilderId, id));
  }

  const [del] = await db
    .delete(promotionBuilderModel)
    .where(eq(promotionBuilderModel.id, id))
    .returning({ id: promotionBuilderModel.id });

  return !!del;
}
