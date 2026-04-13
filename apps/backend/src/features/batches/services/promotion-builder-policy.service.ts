import { db } from "@/db/index.js";
import {
  examFormFillupModel,
  promotionBuilderClauseClassMappingModel,
  promotionBuilderClauseMappingModel,
  promotionBuilderModel,
  promotionClauseClassMappingModel,
  promotionClauseModel,
} from "@repo/db/schemas";
import { and, eq } from "drizzle-orm";

import { primaryPromotionClause } from "../default-promotion-clause-data.js";

export type ConditionalBuilderReqs = {
  requiredClassIds: number[];
  requiresSourceFormFillup: boolean;
};

export type PrecomputedBuilderPolicy = {
  allBuilderAffIds: number[];
  autoPromoteAffIds: number[];
  conditionalReqs: Map<number, ConditionalBuilderReqs>;
};

/**
 * Fetches builder configuration for the given target class (same source as promotion roster).
 */
export async function precomputeBuilderPolicy(
  toClassId: number,
): Promise<PrecomputedBuilderPolicy> {
  const formClause = primaryPromotionClause.Form_Fill_Up_Status;

  const builders = await db
    .select({
      id: promotionBuilderModel.id,
      affiliationId: promotionBuilderModel.affiliationId,
      logic: promotionBuilderModel.logic,
    })
    .from(promotionBuilderModel)
    .where(
      and(
        eq(promotionBuilderModel.targetClassId, toClassId),
        eq(promotionBuilderModel.isActive, true),
      ),
    );

  const allBuilderAffIds = [...new Set(builders.map((b) => b.affiliationId))];
  const autoPromoteAffIds = [
    ...new Set(
      builders
        .filter((b) => b.logic === "AUTO_PROMOTE")
        .map((b) => b.affiliationId),
    ),
  ];

  const conditionalReqs = new Map<number, ConditionalBuilderReqs>();
  const conditionalBuilders = builders.filter(
    (b) =>
      b.logic === "CONDITIONAL" && !autoPromoteAffIds.includes(b.affiliationId),
  );

  for (const cb of conditionalBuilders) {
    if (conditionalReqs.has(cb.affiliationId)) continue;

    const rules = await db
      .select({
        ruleId: promotionBuilderClauseMappingModel.id,
        clauseName: promotionClauseModel.name,
        operator: promotionBuilderClauseMappingModel.operator,
      })
      .from(promotionBuilderClauseMappingModel)
      .innerJoin(
        promotionClauseModel,
        eq(
          promotionClauseModel.id,
          promotionBuilderClauseMappingModel.promotionClauseId,
        ),
      )
      .where(eq(promotionBuilderClauseMappingModel.promotionBuilderId, cb.id));

    const classIds: number[] = [];
    let sourceRequired = false;

    for (const rule of rules) {
      if (rule.clauseName !== formClause || rule.operator !== "EQUALS")
        continue;

      const classMappings = await db
        .select({ classId: promotionClauseClassMappingModel.classId })
        .from(promotionBuilderClauseClassMappingModel)
        .innerJoin(
          promotionClauseClassMappingModel,
          eq(
            promotionClauseClassMappingModel.id,
            promotionBuilderClauseClassMappingModel.promotionClauseClassId,
          ),
        )
        .where(
          eq(
            promotionBuilderClauseClassMappingModel.promotionBuilderClauseId,
            rule.ruleId,
          ),
        );

      if (classMappings.length > 0) {
        for (const cm of classMappings) classIds.push(cm.classId);
      } else {
        sourceRequired = true;
      }
    }

    conditionalReqs.set(cb.affiliationId, {
      requiredClassIds: [...new Set(classIds)],
      requiresSourceFormFillup: sourceRequired,
    });
  }

  return { allBuilderAffIds, autoPromoteAffIds, conditionalReqs };
}

/**
 * For bulk exam-form-fillup upload: if the affiliation has CONDITIONAL rules for this
 * target class, require a completed fill-up row for each configured prerequisite class
 * (student + program course + class + COMPLETED). Source-only rules are not blocking
 * for import (the row being uploaded is the current class’s fill-up).
 */
export async function validateExamFormFillupBulkAgainstBuilder(
  policy: PrecomputedBuilderPolicy,
  params: {
    affiliationId: number;
    studentId: number;
    programCourseId: number;
  },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!policy.conditionalReqs.has(params.affiliationId)) {
    return { ok: true };
  }

  const reqs = policy.conditionalReqs.get(params.affiliationId)!;

  for (const prerequisiteClassId of reqs.requiredClassIds) {
    const done = await db
      .select({ id: examFormFillupModel.id })
      .from(examFormFillupModel)
      .where(
        and(
          eq(examFormFillupModel.studentId, params.studentId),
          eq(examFormFillupModel.programCourseId, params.programCourseId),
          eq(examFormFillupModel.classId, prerequisiteClassId),
          eq(examFormFillupModel.status, "COMPLETED"),
        ),
      )
      .limit(1);

    if (done.length === 0) {
      return {
        ok: false,
        reason:
          "This student is not eligible for exam form fill-up for the selected class: promotion rules require a completed exam form fill-up for a prerequisite semester (class).",
      };
    }
  }

  return { ok: true };
}
