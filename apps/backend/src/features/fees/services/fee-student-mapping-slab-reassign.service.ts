// Shared "point a fee_student_mapping at the correct fee_slab" helper.
//
// The legacy fresh-import path (legacy-fees-data.service.ts :: syncFeeStudentMapping)
// already does this correctly: look up the fee_group whose slab matches, call
// updateFeeGroupPromotionMapping to repoint the fgpm, recompute total_payable
// from the slab's components, then sync amount_paid + payments.amount.
//
// This helper extracts that exact flow so heals for already-loaded students
// can reuse the SAME rules — the loader's per-student idempotent-skip path
// makes it unusable for that case. Keeping ONE code path prevents divergence:
// a future rule change in one place automatically fixes the other.
//
// Two entry points:
//   reassignFeeStudentMappingSlab(mappingId, slabName)
//     → repoint by explicit slab name (e.g. "Slab A").
//   findFeeSlabByComponentSum(feeStructureId, targetAmount)
//     → back-solve the slab when IRP doesn't carry a slab letter
//       (Admission-Fees cohort: IRP `Fee Slab` is empty but the installment
//       total uniquely identifies which slab was actually used).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";
import {
  feeGroupModel,
  feeGroupPromotionMappingModel,
  feeSlabModel,
  feeStructureComponentModel,
  feeStudentMappingModel,
  paymentModel,
} from "@repo/db/schemas";
import { and, eq, ilike } from "drizzle-orm";

import { updateFeeGroupPromotionMapping } from "./fee-group-promotion-mapping.service";
import { calculateTotalPayableForFeeStudentMapping } from "./fee-structure.service";

// Sentinel used by the legacy fresh-import path when it MANUAL-reassigns a
// student's slab (legacy-fees-data.service.ts:820). Same value here keeps
// audit trails consistent.
const HEAL_APPROVAL_USER_ID = 41;

export type SlabReassignResult =
  | {
      status: "reassigned";
      slabName: string;
      slabId: number;
      oldFeeGroupId: number;
      newFeeGroupId: number;
      totalPayableBefore: number;
      totalPayableAfter: number;
      paymentsUpdated: number;
    }
  | { status: "already-on-slab"; slabName: string; totalPayable: number }
  | { status: "slab-not-found"; slabName: string }
  | { status: "mapping-not-found" }
  | { status: "no-fgpm-on-mapping" };

/**
 * Point a fee_student_mapping at the fee_group whose fee_slab is `targetSlabName`,
 * then recompute total_payable + amount_paid + payments.amount from that slab's
 * components. Same code path as the fresh-import loader — see file header.
 */
export async function reassignFeeStudentMappingSlab(
  mappingId: number,
  targetSlabName: string,
  opts: { updatePayments?: boolean; commit?: boolean } = {},
): Promise<SlabReassignResult> {
  const updatePayments = opts.updatePayments !== false;
  const commit = opts.commit !== false;

  const [mapping] = await db
    .select()
    .from(feeStudentMappingModel)
    .where(eq(feeStudentMappingModel.id, mappingId));
  if (!mapping) return { status: "mapping-not-found" };
  if (!mapping.feeGroupPromotionMappingId) {
    return { status: "no-fgpm-on-mapping" };
  }

  const [fgpm] = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .where(
      eq(feeGroupPromotionMappingModel.id, mapping.feeGroupPromotionMappingId),
    );
  if (!fgpm) return { status: "no-fgpm-on-mapping" };

  // Resolve target slab -> fee_group. ilike mirrors the case-insensitive lookup
  // used at legacy-fees-data.service.ts:797.
  const [targetGroupRow] = await db
    .select({ feeGroup: feeGroupModel, slabId: feeSlabModel.id })
    .from(feeGroupModel)
    .leftJoin(feeSlabModel, eq(feeSlabModel.id, feeGroupModel.feeSlabId))
    .where(ilike(feeSlabModel.name, targetSlabName.trim()));
  if (!targetGroupRow?.feeGroup) {
    return { status: "slab-not-found", slabName: targetSlabName };
  }

  const oldFeeGroupId = fgpm.feeGroupId;
  const newFeeGroupId = targetGroupRow.feeGroup.id!;
  const totalPayableBefore = Math.round(Number(mapping.totalPayable ?? 0));

  if (oldFeeGroupId === newFeeGroupId) {
    return {
      status: "already-on-slab",
      slabName: targetSlabName,
      totalPayable: totalPayableBefore,
    };
  }

  // Dry-run: compute what the new total WOULD be but don't persist anything.
  if (!commit) {
    const preview = await previewTotalPayableForNewFeeGroup(
      mapping.feeStructureId,
      newFeeGroupId,
    );
    return {
      status: "reassigned",
      slabName: targetSlabName,
      slabId: targetGroupRow.slabId!,
      oldFeeGroupId,
      newFeeGroupId,
      totalPayableBefore,
      totalPayableAfter: preview,
      paymentsUpdated: 0,
    };
  }

  // Repoint fgpm. This also schedules a background per-fgpm recompute in
  // recalculateFeeStudentMappingsForPromotionMapping — we still recompute
  // synchronously below so payments.amount is consistent regardless of race.
  await updateFeeGroupPromotionMapping(fgpm.id!, {
    ...fgpm,
    feeGroupId: newFeeGroupId,
    approvalType: "MANUAL",
    approvalUserId: HEAL_APPROVAL_USER_ID,
  });

  const [freshFgpm] = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .where(eq(feeGroupPromotionMappingModel.id, fgpm.id!));
  const totalPayableAfter = freshFgpm
    ? await calculateTotalPayableForFeeStudentMapping(
        mapping.feeStructureId,
        freshFgpm,
      )
    : totalPayableBefore;

  await db
    .update(feeStudentMappingModel)
    .set({
      totalPayable: totalPayableAfter,
      amountPaid:
        mapping.amountPaid != null ? totalPayableAfter : mapping.amountPaid,
      updatedAt: new Date(),
    })
    .where(eq(feeStudentMappingModel.id, mappingId));

  let paymentsUpdated = 0;
  if (updatePayments) {
    const upd = await db
      .update(paymentModel)
      .set({ amount: totalPayableAfter })
      .where(
        and(
          eq(paymentModel.feeStudentMappingId, mappingId),
          eq(paymentModel.status, "SUCCESS"),
        ),
      )
      .returning({ id: paymentModel.id });
    paymentsUpdated = upd.length;
  }

  return {
    status: "reassigned",
    slabName: targetSlabName,
    slabId: targetGroupRow.slabId!,
    oldFeeGroupId,
    newFeeGroupId,
    totalPayableBefore,
    totalPayableAfter,
    paymentsUpdated,
  };
}

/**
 * Preview what total_payable would be if the mapping were repointed at the
 * given fee_group — used by dry-run. Mirrors calculateTotalPayableForFeeStudentMapping
 * but without loading the mapping's real fgpm.
 */
async function previewTotalPayableForNewFeeGroup(
  feeStructureId: number,
  feeGroupId: number,
): Promise<number> {
  const [feeGroup] = await db
    .select()
    .from(feeGroupModel)
    .where(eq(feeGroupModel.id, feeGroupId));
  if (!feeGroup?.feeSlabId) return 0;
  const components = await db
    .select({ amount: feeStructureComponentModel.amount })
    .from(feeStructureComponentModel)
    .where(
      and(
        eq(feeStructureComponentModel.feeStructureId, feeStructureId),
        eq(feeStructureComponentModel.feeSlabId, feeGroup.feeSlabId),
      ),
    );
  return Math.round(components.reduce((sum, c) => sum + (c.amount ?? 0), 0));
}

/**
 * Back-solve which slab a student was actually charged for by matching the
 * IRP installment total against the sum of each slab's components under the
 * given fee_structure. Returns null if no slab or more than one slab matches
 * — an ambiguous match must NOT be auto-applied (a heal-driven silent swap
 * to the wrong slab would look identical to the loader's original bug).
 */
export async function findFeeSlabByComponentSum(
  feeStructureId: number,
  targetAmount: number,
): Promise<{ slabId: number; slabName: string; total: number } | null> {
  const rows = await db
    .select({
      slabId: feeStructureComponentModel.feeSlabId,
      slabName: feeSlabModel.name,
      amount: feeStructureComponentModel.amount,
    })
    .from(feeStructureComponentModel)
    .leftJoin(
      feeSlabModel,
      eq(feeSlabModel.id, feeStructureComponentModel.feeSlabId),
    )
    .where(eq(feeStructureComponentModel.feeStructureId, feeStructureId));

  const totals = new Map<number, { name: string; total: number }>();
  for (const r of rows) {
    if (r.slabId == null) continue;
    const cur = totals.get(r.slabId) ?? { name: r.slabName ?? "", total: 0 };
    cur.total += r.amount ?? 0;
    totals.set(r.slabId, cur);
  }

  const target = Math.round(targetAmount);
  const matches: Array<{ slabId: number; slabName: string; total: number }> =
    [];
  for (const [slabId, v] of totals) {
    if (Math.round(v.total) === target) {
      matches.push({ slabId, slabName: v.name, total: Math.round(v.total) });
    }
  }
  if (matches.length !== 1) return null;
  return matches[0];
}
