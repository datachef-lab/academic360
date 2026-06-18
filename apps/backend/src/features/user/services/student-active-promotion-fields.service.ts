/**
 * Lightweight updater for fields that live on every active promotion of a
 * student (endDate IS NULL and not deprecated). Used by the student panel to
 * change Section + Class Roll Number without touching the heavier
 * shift-change flow (UID regen, fees, etc.).
 */

import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import {
  promotionModel,
  sectionModel,
  studentModel,
} from "@repo/db/schemas/index.js";

export type ActivePromotionFieldsInput = {
  sectionId?: number | null;
  classRollNumber?: string | null;
};

export type ActivePromotionFieldsResult = {
  promotionIdsUpdated: number[];
  sectionId: number | null;
  classRollNumber: string | null;
};

const activePromotionFilter = (studentId: number) =>
  and(
    eq(promotionModel.studentId, studentId),
    isNull(promotionModel.endDate),
    sql`COALESCE(${promotionModel.isDeprecated}, false) = false`,
  );

export async function updateActivePromotionFields(
  studentId: number,
  input: ActivePromotionFieldsInput,
): Promise<ActivePromotionFieldsResult> {
  if (!Number.isInteger(studentId) || studentId <= 0) {
    throw new ApiError(400, "Valid studentId is required.");
  }

  const [student] = await db
    .select({ id: studentModel.id })
    .from(studentModel)
    .where(eq(studentModel.id, studentId))
    .limit(1);
  if (!student) throw new ApiError(404, "Student not found.");

  if (
    input.sectionId == null &&
    (input.classRollNumber == null || input.classRollNumber === undefined)
  ) {
    throw new ApiError(
      400,
      "Nothing to update — provide sectionId or classRollNumber.",
    );
  }

  if (input.sectionId != null) {
    if (!Number.isInteger(input.sectionId) || input.sectionId <= 0) {
      throw new ApiError(400, "Valid sectionId is required.");
    }
    const [section] = await db
      .select({ id: sectionModel.id })
      .from(sectionModel)
      .where(eq(sectionModel.id, input.sectionId))
      .limit(1);
    if (!section) throw new ApiError(404, "Section not found.");
  }

  // promotionModel.classRollNumber is NOT NULL — reject empty strings.
  if (
    input.classRollNumber !== undefined &&
    input.classRollNumber !== null &&
    !String(input.classRollNumber).trim()
  ) {
    throw new ApiError(400, "Class roll number cannot be blank.");
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.sectionId != null) patch.sectionId = input.sectionId;
  if (input.classRollNumber !== undefined && input.classRollNumber !== null) {
    patch.classRollNumber = String(input.classRollNumber).trim();
  }

  const updated = await db
    .update(promotionModel)
    .set(patch)
    .where(activePromotionFilter(studentId))
    .returning({ id: promotionModel.id });

  if (updated.length === 0) {
    throw new ApiError(
      409,
      "No active promotions (endDate IS NULL, not deprecated) found for this student.",
    );
  }

  return {
    promotionIdsUpdated: updated.map((r) => r.id),
    sectionId: input.sectionId ?? null,
    classRollNumber:
      input.classRollNumber !== undefined && input.classRollNumber !== null
        ? String(input.classRollNumber).trim()
        : null,
  };
}
