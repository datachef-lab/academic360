import { db } from "@/db/index.js";
import { createLogger } from "@/config/logger.js";
import {
  affiliationModel,
  classModel,
  promotionClauseClassMappingModel,
  promotionClauseModel,
  promotionBuilderModel,
} from "@repo/db/schemas";
import { and, eq, ilike } from "drizzle-orm";
import {
  defaultPromotionBuilderSeeds,
  defaultPromotionClauseSeeds,
  type ClassRef,
} from "./default-promotion-clause-data.js";
import {
  createPromotionBuilder,
  type PromotionBuilderRuleInput,
} from "./services/promotion-builder.service.js";

const log = createLogger("default-promotion-data");

async function resolveAffiliationIdByName(
  name: string,
): Promise<number | null> {
  const pattern = name.trim();
  if (!pattern) return null;
  const [row] = await db
    .select({ id: affiliationModel.id })
    .from(affiliationModel)
    .where(ilike(affiliationModel.name, pattern))
    .limit(1);
  return row?.id ?? null;
}

async function resolveClassId(ref: ClassRef): Promise<number | null> {
  const pattern = ref.name.trim();
  if (!pattern) return null;
  const [row] = await db
    .select({ id: classModel.id })
    .from(classModel)
    .where(and(eq(classModel.type, ref.type), ilike(classModel.name, pattern)))
    .limit(1);
  return row?.id ?? null;
}

async function ensureClauseClassMappings(
  promotionClauseId: number,
  refs: ClassRef[],
): Promise<void> {
  for (const ref of refs) {
    const classId = await resolveClassId(ref);
    if (!classId) {
      log.warn("Default promotion clause: class not found, skipping mapping", {
        promotionClauseId,
        ...ref,
      });
      continue;
    }
    const [existing] = await db
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
      )
      .limit(1);
    if (existing) continue;
    await db.insert(promotionClauseClassMappingModel).values({
      promotionClauseId,
      classId,
    });
  }
}

/**
 * Inserts default promotion clauses (with class links) and promotion builders when missing.
 * Idempotent: skips clauses/builders that already exist; fills missing class mappings.
 * Requires affiliation "Calcutta University" and named `classes` rows (see seeds).
 */
export async function loadDefaultPromotionData(): Promise<void> {
  const clauseIdByName = new Map<string, number>();

  for (const seed of defaultPromotionClauseSeeds) {
    const [existing] = await db
      .select()
      .from(promotionClauseModel)
      .where(ilike(promotionClauseModel.name, seed.name.trim()))
      .limit(1);

    let clauseId: number;
    if (existing) {
      clauseId = existing.id;
    } else {
      const [created] = await db
        .insert(promotionClauseModel)
        .values({
          name: seed.name,
          description: seed.description,
          color: seed.color,
          bgColor: seed.bgColor,
          isActive: seed.isActive,
        })
        .returning();
      if (!created?.id) {
        log.warn("Failed to insert promotion clause", { name: seed.name });
        continue;
      }
      clauseId = created.id;
    }

    clauseIdByName.set(seed.name, clauseId);
    await ensureClauseClassMappings(clauseId, seed.classRefs);
  }

  for (const b of defaultPromotionBuilderSeeds) {
    const affiliationId = await resolveAffiliationIdByName(b.affiliationName);
    if (!affiliationId) {
      log.warn("Skip promotion builder seed: affiliation not found", {
        affiliationName: b.affiliationName,
      });
      continue;
    }

    const targetClassId = await resolveClassId(b.targetClassRef);
    if (!targetClassId) {
      log.warn("Skip promotion builder seed: target class not found", {
        targetClassRef: b.targetClassRef,
      });
      continue;
    }

    const [existingBuilder] = await db
      .select({ id: promotionBuilderModel.id })
      .from(promotionBuilderModel)
      .where(
        and(
          eq(promotionBuilderModel.affiliationId, affiliationId),
          eq(promotionBuilderModel.targetClassId, targetClassId),
        ),
      )
      .limit(1);

    if (existingBuilder) {
      continue;
    }

    const rules: PromotionBuilderRuleInput[] = [];
    for (const r of b.rules) {
      const promotionClauseId = clauseIdByName.get(r.clauseName);
      if (!promotionClauseId) {
        log.warn("Skip rule: promotion clause not loaded", {
          clauseName: r.clauseName,
        });
        continue;
      }
      const classIds: number[] = [];
      for (const ref of r.classRefs) {
        const cid = await resolveClassId(ref);
        if (cid) classIds.push(cid);
        else
          log.warn("Rule class not found", {
            clauseName: r.clauseName,
            ...ref,
          });
      }
      rules.push({
        promotionClauseId,
        operator: r.operator,
        classIds,
      });
    }

    if (rules.length === 0) {
      log.warn("Skip promotion builder seed: no valid rules", {
        targetClassId,
      });
      continue;
    }

    await createPromotionBuilder(
      {
        affiliationId,
        logic: b.logic,
        targetClassId,
        isActive: true,
      },
      rules,
    );
  }

  log.info("Default promotion data load finished");
}
