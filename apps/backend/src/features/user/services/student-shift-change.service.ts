import { db } from "@/db/index.js";
import {
  academicYearModel,
  classModel,
  examCandidateModel,
  examFormFillupModel,
  feeCategoryModel,
  feeGroupModel,
  feeGroupPromotionMappingModel,
  feeSlabModel,
  feeStructureModel,
  feeStudentMappingModel,
  paymentModel,
  programCourseModel,
  promotionModel,
  receiptTypeModel,
  sessionModel,
  shiftModel,
  studentModel,
  userModel,
} from "@repo/db/schemas";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { ensureDefaultFeeStudentMappingsForFeeStructure } from "@/features/fees/services/fee-structure.service.js";
import { userStatusMappingOverview } from "../models/user-status-overview.models.js";
import * as userService from "./user.service.js";

const STUDENT_EMAIL_DOMAIN = "thebges.edu.in";

/** Active promotion = no end date and not deprecated. */
function activePromotionCondition(...extra: SQL[]): SQL {
  const parts: SQL[] = [
    isNull(promotionModel.endDate),
    sql`COALESCE(${promotionModel.isDeprecated}, false) = false`,
  ];
  if (extra.length) parts.push(...extra);
  return and(...parts)!;
}

export type ShiftChangeFeeGroupPreviewRow = {
  promotionId: number;
  promotionLabel: string;
  feeSlab: string | null;
  feeCategory: string | null;
  approvalType: string | null;
  approvedByUser: string | null;
  totalPayable: number | null;
  receiptType: string | null;
  /** Unpaid only — challan or fee receipt already generated for this semester */
  generatedDocumentType: "challan" | "receipt" | null;
};

export type ShiftChangeGeneratedFeeDocument = {
  feeStudentMappingId: number;
  promotionId: number;
  promotionLabel: string;
  receiptType: string | null;
  generatedDocumentType: "challan" | "receipt";
};

export type UidBreakdownPreview = {
  currentUid: string;
  newUid: string;
  programCoursePrefix: string;
  programCourseName: string | null;
  programCourseShortName: string | null;
  shiftPrefix: string;
  shiftName: string | null;
  /** Two-digit registration year from admission (e.g. "25" from 2025-26) */
  registrationYear: string;
  /** Last four digits carried from current UID */
  sequence: string;
};

export type StudentShiftChangePreview = {
  allowed: boolean;
  blockReason: string | null;
  previousUid: string | null;
  feesPaid: boolean;
  currentShift: { id: number; name: string } | null;
  newShift: { id: number; name: string } | null;
  newUidPreview: string | null;
  uidBreakdown: UidBreakdownPreview | null;
  hasExamHistoryOnActivePromotions: boolean;
  /** When unpaid and allowed — old vs projected new fee-group-promotion mapping */
  feeComparison: {
    old: ShiftChangeFeeGroupPreviewRow[];
    new: ShiftChangeFeeGroupPreviewRow[];
  } | null;
  /** Unpaid only — every generated challan/receipt on the current shift */
  generatedFeeDocuments: ShiftChangeGeneratedFeeDocument[];
};

export type StudentShiftChangeResult = {
  studentId: number;
  previousUid: string;
  newUid: string;
  oldEmail: string;
  newEmail: string;
  oldShiftId: number;
  newShiftId: number;
  feesPaid: boolean;
  /** Active promotions (endDate IS NULL) considered for this operation */
  promotionsUpdated: number;
  /** Promotions closed (endDate set) to preserve exam history with old shift */
  promotionsClosedForExamHistory: number;
  /** New promotion rows created with the new shift (when exam data existed on old row) */
  promotionsClonedForExamHistory: number;
  /** Promotion ids that still have exam_candidates pointing at them (historical shift preserved) */
  promotionIdsWithExamHistory: number[];
  feeMappingsDeleted: number;
  feeStructuresProcessed: number;
};

function extractRegYearSuffix(academicYear: string): string {
  const startYear = academicYear.split("-")[0]?.trim() ?? "";
  const y = parseInt(startYear, 10);
  if (!Number.isFinite(y)) {
    throw new Error(
      `Unable to derive registration year from academic year "${academicYear}"`,
    );
  }
  return String(y % 100).padStart(2, "0");
}

/** UID = programCourseCodePrefix + shiftCodePrefix + regYear (2 digits) + last 4 digits of old UID */
export function buildShiftChangeUid(
  oldUid: string,
  programCourseCodePrefix: string,
  newShiftCodePrefix: string,
  regYearSuffix: string,
): string {
  const trimmed = oldUid.trim();
  if (trimmed.length < 4) {
    throw new Error(`Invalid UID "${oldUid}": expected at least 4 characters`);
  }
  const seq = trimmed.slice(-4);
  if (!/^\d{4}$/.test(seq)) {
    throw new Error(
      `Invalid UID "${oldUid}": last 4 characters must be digits`,
    );
  }

  const pc = programCourseCodePrefix.trim();
  const shift = newShiftCodePrefix.trim();
  const year = regYearSuffix.trim().padStart(2, "0");

  if (!pc || !shift) {
    throw new Error("Program course and shift code prefixes are required");
  }

  return `${pc}${shift}${year}${seq}`;
}

async function getRegistrationYearSuffixForStudent(
  studentId: number,
): Promise<string> {
  const [row] = await db
    .select({ academicYear: academicYearModel.year })
    .from(promotionModel)
    .innerJoin(classModel, eq(classModel.id, promotionModel.classId))
    .innerJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
    .innerJoin(
      academicYearModel,
      eq(academicYearModel.id, sessionModel.academicYearId),
    )
    .where(
      and(
        eq(promotionModel.studentId, studentId),
        or(
          sql`upper(trim(${classModel.name})) = 'SEMESTER I'`,
          eq(classModel.sequence, 1),
        ),
      ),
    )
    .orderBy(asc(sessionModel.from), asc(promotionModel.id))
    .limit(1);

  if (!row?.academicYear) {
    throw new Error(
      "Semester I promotion not found — cannot derive registration year for UID",
    );
  }

  return extractRegYearSuffix(row.academicYear);
}

type ActivePromotionRow = typeof promotionModel.$inferSelect & {
  academicYearId: number | null;
};

async function getActivePromotionsForStudent(
  studentId: number,
): Promise<ActivePromotionRow[]> {
  const rows = await db
    .select({
      promotion: promotionModel,
      academicYearId: sessionModel.academicYearId,
    })
    .from(promotionModel)
    .innerJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
    .where(activePromotionCondition(eq(promotionModel.studentId, studentId)))
    .orderBy(asc(promotionModel.id));

  return rows.map((r) => ({
    ...r.promotion,
    academicYearId: r.academicYearId,
  }));
}

/** Promotion ids among `promotionIds` that have at least one exam_candidates row. */
async function getPromotionIdsWithExamCandidates(
  promotionIds: number[],
): Promise<number[]> {
  if (!promotionIds.length) return [];

  const rows = await db
    .selectDistinct({ promotionId: examCandidateModel.promotionId })
    .from(examCandidateModel)
    .where(inArray(examCandidateModel.promotionId, promotionIds));

  return rows
    .map((r) => r.promotionId)
    .filter((id): id is number => id != null);
}

type ClonedPromotionExamFormFields = {
  examFormFillupId: number | null;
  isExamFormSubmitted: boolean;
  examFormSubmissionTimeStamp: Date | null;
};

/** Carry appear type (exam_form_fillup) and submission flags onto the new promotion row. */
async function resolveExamFormFieldsForClonedPromotion(
  source: typeof promotionModel.$inferSelect,
): Promise<ClonedPromotionExamFormFields> {
  const empty: ClonedPromotionExamFormFields = {
    examFormFillupId: null,
    isExamFormSubmitted: false,
    examFormSubmissionTimeStamp: null,
  };

  if (source.examFormFillupId != null) {
    const [fillup] = await db
      .select({
        id: examFormFillupModel.id,
        status: examFormFillupModel.status,
        appearTypeId: examFormFillupModel.appearTypeId,
      })
      .from(examFormFillupModel)
      .where(eq(examFormFillupModel.id, source.examFormFillupId))
      .limit(1);

    if (fillup?.id != null && fillup.appearTypeId != null) {
      const completed = fillup.status === "COMPLETED";
      return {
        examFormFillupId: fillup.id,
        isExamFormSubmitted: source.isExamFormSubmitted ?? completed,
        examFormSubmissionTimeStamp: source.examFormSubmissionTimeStamp ?? null,
      };
    }
  }

  const [fillupByKeys] = await db
    .select({
      id: examFormFillupModel.id,
      status: examFormFillupModel.status,
      appearTypeId: examFormFillupModel.appearTypeId,
    })
    .from(examFormFillupModel)
    .where(
      and(
        eq(examFormFillupModel.studentId, source.studentId),
        eq(examFormFillupModel.sessionId, source.sessionId),
        eq(examFormFillupModel.programCourseId, source.programCourseId),
        eq(examFormFillupModel.classId, source.classId),
        isNotNull(examFormFillupModel.appearTypeId),
      ),
    )
    .orderBy(desc(examFormFillupModel.id))
    .limit(1);

  if (fillupByKeys?.id != null) {
    const completed = fillupByKeys.status === "COMPLETED";
    return {
      examFormFillupId: fillupByKeys.id,
      isExamFormSubmitted: completed,
      examFormSubmissionTimeStamp: null,
    };
  }

  return empty;
}

/**
 * Promotions linked to exam scheduling must keep their original shiftId because
 * exam_candidates.promotion_id_fk → promotions.id and admit cards join shift via promotion.
 */
function buildClonedPromotionInsert(
  source: typeof promotionModel.$inferSelect,
  newShiftId: number,
  closedAt: Date,
  examForm: ClonedPromotionExamFormFields,
): typeof promotionModel.$inferInsert {
  return {
    legacyHistoricalRecordId: source.legacyHistoricalRecordId,
    studentId: source.studentId,
    programCourseId: source.programCourseId,
    sessionId: source.sessionId,
    shiftId: newShiftId,
    classId: source.classId,
    sectionId: source.sectionId,
    isAlumni: source.isAlumni,
    dateOfJoining: source.dateOfJoining,
    classRollNumber: source.classRollNumber,
    rollNumber: source.rollNumber,
    rollNumberSI: source.rollNumberSI,
    examNumber: source.examNumber,
    examSerialNumber: source.examSerialNumber,
    isExamFormSubmitted: examForm.isExamFormSubmitted,
    examFormFillupId: examForm.examFormFillupId,
    boardResultStatusId: source.boardResultStatusId,
    startDate: closedAt,
    endDate: null,
    remarks: source.remarks,
    isDeprecated: false,
    examFormSubmissionTimeStamp: examForm.examFormSubmissionTimeStamp,
  };
}

async function hasSuccessfulFeePaymentForActivePromotions(
  studentId: number,
  activePromotionIds: number[],
): Promise<boolean> {
  if (!activePromotionIds.length) return false;

  const [row] = await db
    .select({ id: feeStudentMappingModel.id })
    .from(feeStudentMappingModel)
    .innerJoin(
      feeGroupPromotionMappingModel,
      eq(
        feeGroupPromotionMappingModel.id,
        feeStudentMappingModel.feeGroupPromotionMappingId,
      ),
    )
    .innerJoin(
      paymentModel,
      and(
        eq(paymentModel.feeStudentMappingId, feeStudentMappingModel.id),
        eq(paymentModel.isLinked, true),
        eq(paymentModel.status, "SUCCESS"),
      ),
    )
    .where(
      and(
        eq(feeStudentMappingModel.studentId, studentId),
        inArray(feeGroupPromotionMappingModel.promotionId, activePromotionIds),
      ),
    )
    .limit(1);

  return Boolean(row);
}

async function collectFeeMappingIdsForOldShift(
  studentId: number,
  activePromotions: ActivePromotionRow[],
  oldShiftId: number,
): Promise<number[]> {
  const ids = new Set<number>();

  for (const promo of activePromotions) {
    if (!promo.academicYearId) continue;

    const rows = await db
      .select({ id: feeStudentMappingModel.id })
      .from(feeStudentMappingModel)
      .innerJoin(
        feeStructureModel,
        eq(feeStructureModel.id, feeStudentMappingModel.feeStructureId),
      )
      .where(
        and(
          eq(feeStudentMappingModel.studentId, studentId),
          eq(feeStructureModel.shiftId, oldShiftId),
          eq(feeStructureModel.academicYearId, promo.academicYearId),
          eq(feeStructureModel.programCourseId, promo.programCourseId),
          eq(feeStructureModel.classId, promo.classId),
        ),
      );

    for (const r of rows) {
      if (r.id != null) ids.add(r.id);
    }
  }

  return [...ids];
}

function isPreviousUidSet(previousUid: string | null | undefined): boolean {
  return Boolean(previousUid?.trim());
}

async function loadFeeGroupPreviewForPromotion(
  promotion: ActivePromotionRow,
): Promise<ShiftChangeFeeGroupPreviewRow> {
  const className = await db
    .select({ name: classModel.name })
    .from(classModel)
    .where(eq(classModel.id, promotion.classId))
    .then((r) => r[0]?.name ?? "Semester");

  const [fgpm] = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .where(eq(feeGroupPromotionMappingModel.promotionId, promotion.id!))
    .orderBy(asc(feeGroupPromotionMappingModel.id))
    .limit(1);

  if (!fgpm?.feeGroupId) {
    return {
      promotionId: promotion.id!,
      promotionLabel: className,
      feeSlab: null,
      feeCategory: null,
      approvalType: null,
      approvedByUser: null,
      totalPayable: null,
      receiptType: null,
      generatedDocumentType: null,
    };
  }

  const [feeGroup] = await db
    .select()
    .from(feeGroupModel)
    .where(eq(feeGroupModel.id, fgpm.feeGroupId));

  const [feeCategory, feeSlab, approvedByUser] = await Promise.all([
    feeGroup?.feeCategoryId
      ? db
          .select({ name: feeCategoryModel.name })
          .from(feeCategoryModel)
          .where(eq(feeCategoryModel.id, feeGroup.feeCategoryId))
          .then((r) => r[0]?.name ?? null)
      : Promise.resolve(null),
    feeGroup?.feeSlabId
      ? db
          .select({ name: feeSlabModel.name })
          .from(feeSlabModel)
          .where(eq(feeSlabModel.id, feeGroup.feeSlabId))
          .then((r) => r[0]?.name ?? null)
      : Promise.resolve(null),
    fgpm.approvalUserId
      ? db
          .select({ name: userModel.name })
          .from(userModel)
          .where(eq(userModel.id, fgpm.approvalUserId))
          .then((r) => r[0]?.name ?? null)
      : Promise.resolve(null),
  ]);

  return {
    promotionId: promotion.id!,
    promotionLabel: className,
    feeSlab,
    feeCategory,
    approvalType: fgpm.approvalType ?? null,
    approvedByUser: approvedByUser,
    totalPayable: null,
    receiptType: null,
    generatedDocumentType: null,
  };
}

async function enrichFeePreviewWithMappingDetails(
  studentId: number,
  promotion: ActivePromotionRow,
  shiftId: number,
  row: ShiftChangeFeeGroupPreviewRow,
): Promise<ShiftChangeFeeGroupPreviewRow> {
  const [mappingRow] = await db
    .select({
      totalPayable: feeStudentMappingModel.totalPayable,
      receiptNumber: feeStudentMappingModel.receiptNumber,
      challanGeneratedAt: feeStudentMappingModel.challanGeneratedAt,
      receiptTypeName: receiptTypeModel.name,
    })
    .from(feeStudentMappingModel)
    .innerJoin(
      feeGroupPromotionMappingModel,
      eq(
        feeGroupPromotionMappingModel.id,
        feeStudentMappingModel.feeGroupPromotionMappingId,
      ),
    )
    .innerJoin(
      feeStructureModel,
      eq(feeStructureModel.id, feeStudentMappingModel.feeStructureId),
    )
    .leftJoin(
      receiptTypeModel,
      eq(receiptTypeModel.id, feeStructureModel.receiptTypeId),
    )
    .where(
      and(
        eq(feeStudentMappingModel.studentId, studentId),
        eq(feeGroupPromotionMappingModel.promotionId, promotion.id!),
        eq(feeStructureModel.shiftId, shiftId),
      ),
    )
    .limit(1);

  if (!mappingRow) {
    return row;
  }

  let generatedDocumentType: "challan" | "receipt" | null = null;
  if (mappingRow.receiptNumber?.trim()) {
    generatedDocumentType = "receipt";
  } else if (mappingRow.challanGeneratedAt) {
    generatedDocumentType = "challan";
  }

  return {
    ...row,
    totalPayable: mappingRow.totalPayable ?? null,
    receiptType: mappingRow.receiptTypeName ?? row.receiptType,
    generatedDocumentType,
  };
}

async function loadGeneratedFeeDocumentsForStudent(
  studentId: number,
  activePromotionIds: number[],
  shiftId: number,
): Promise<ShiftChangeGeneratedFeeDocument[]> {
  if (!activePromotionIds.length) {
    return [];
  }

  const rows = await db
    .select({
      feeStudentMappingId: feeStudentMappingModel.id,
      promotionId: feeGroupPromotionMappingModel.promotionId,
      promotionLabel: classModel.name,
      receiptNumber: feeStudentMappingModel.receiptNumber,
      challanGeneratedAt: feeStudentMappingModel.challanGeneratedAt,
      receiptTypeName: receiptTypeModel.name,
    })
    .from(feeStudentMappingModel)
    .innerJoin(
      feeGroupPromotionMappingModel,
      eq(
        feeGroupPromotionMappingModel.id,
        feeStudentMappingModel.feeGroupPromotionMappingId,
      ),
    )
    .innerJoin(
      promotionModel,
      eq(promotionModel.id, feeGroupPromotionMappingModel.promotionId),
    )
    .innerJoin(classModel, eq(classModel.id, promotionModel.classId))
    .innerJoin(
      feeStructureModel,
      eq(feeStructureModel.id, feeStudentMappingModel.feeStructureId),
    )
    .leftJoin(
      receiptTypeModel,
      eq(receiptTypeModel.id, feeStructureModel.receiptTypeId),
    )
    .where(
      and(
        eq(feeStudentMappingModel.studentId, studentId),
        inArray(feeGroupPromotionMappingModel.promotionId, activePromotionIds),
        eq(feeStructureModel.shiftId, shiftId),
        or(
          sql`TRIM(COALESCE(${feeStudentMappingModel.receiptNumber}, '')) <> ''`,
          isNotNull(feeStudentMappingModel.challanGeneratedAt),
        ),
      ),
    )
    .orderBy(
      asc(feeGroupPromotionMappingModel.promotionId),
      asc(feeStudentMappingModel.id),
    );

  return rows
    .filter((row) => row.feeStudentMappingId != null && row.promotionId != null)
    .map((row) => {
      const generatedDocumentType: "challan" | "receipt" =
        row.receiptNumber?.trim() ? "receipt" : "challan";

      return {
        feeStudentMappingId: row.feeStudentMappingId!,
        promotionId: row.promotionId!,
        promotionLabel: row.promotionLabel ?? "Semester",
        receiptType: row.receiptTypeName ?? null,
        generatedDocumentType,
      };
    });
}

async function resolveAcademicYearIdForFeeStructureLookup(
  promotion: ActivePromotionRow,
  studentId: number,
  sourceShiftId: number,
): Promise<number | null> {
  if (promotion.academicYearId) {
    return promotion.academicYearId;
  }

  const [fromMapping] = await db
    .select({ academicYearId: feeStructureModel.academicYearId })
    .from(feeStudentMappingModel)
    .innerJoin(
      feeGroupPromotionMappingModel,
      eq(
        feeGroupPromotionMappingModel.id,
        feeStudentMappingModel.feeGroupPromotionMappingId,
      ),
    )
    .innerJoin(
      feeStructureModel,
      eq(feeStructureModel.id, feeStudentMappingModel.feeStructureId),
    )
    .where(
      and(
        eq(feeStudentMappingModel.studentId, studentId),
        eq(feeGroupPromotionMappingModel.promotionId, promotion.id!),
        eq(feeStructureModel.shiftId, sourceShiftId),
      ),
    )
    .limit(1);

  return fromMapping?.academicYearId ?? null;
}

async function findFeeStructureForPromotionShift(
  promotion: ActivePromotionRow,
  shiftId: number,
  academicYearId: number,
): Promise<{ id: number; receiptTypeName: string | null } | null> {
  const [feeStructure] = await db
    .select({
      id: feeStructureModel.id,
      receiptTypeName: receiptTypeModel.name,
    })
    .from(feeStructureModel)
    .leftJoin(
      receiptTypeModel,
      eq(receiptTypeModel.id, feeStructureModel.receiptTypeId),
    )
    .where(
      and(
        eq(feeStructureModel.academicYearId, academicYearId),
        eq(feeStructureModel.programCourseId, promotion.programCourseId),
        eq(feeStructureModel.classId, promotion.classId),
        eq(feeStructureModel.shiftId, shiftId),
      ),
    )
    .limit(1);

  return feeStructure?.id ? feeStructure : null;
}

async function enrichFeePreviewWithProjectedPayable(
  studentId: number,
  promotion: ActivePromotionRow,
  targetShiftId: number,
  sourceShiftId: number,
  row: ShiftChangeFeeGroupPreviewRow,
): Promise<ShiftChangeFeeGroupPreviewRow> {
  const academicYearId = await resolveAcademicYearIdForFeeStructureLookup(
    promotion,
    studentId,
    sourceShiftId,
  );

  if (!academicYearId) {
    return row;
  }

  let feeStructure = await findFeeStructureForPromotionShift(
    promotion,
    targetShiftId,
    academicYearId,
  );

  if (!feeStructure) {
    const [sourceMappingStructure] = await db
      .select({ academicYearId: feeStructureModel.academicYearId })
      .from(feeStudentMappingModel)
      .innerJoin(
        feeGroupPromotionMappingModel,
        eq(
          feeGroupPromotionMappingModel.id,
          feeStudentMappingModel.feeGroupPromotionMappingId,
        ),
      )
      .innerJoin(
        feeStructureModel,
        eq(feeStructureModel.id, feeStudentMappingModel.feeStructureId),
      )
      .where(
        and(
          eq(feeStudentMappingModel.studentId, studentId),
          eq(feeGroupPromotionMappingModel.promotionId, promotion.id!),
          eq(feeStructureModel.shiftId, sourceShiftId),
        ),
      )
      .limit(1);

    const mappingAcademicYearId = sourceMappingStructure?.academicYearId;
    if (
      mappingAcademicYearId != null &&
      mappingAcademicYearId !== academicYearId
    ) {
      feeStructure = await findFeeStructureForPromotionShift(
        promotion,
        targetShiftId,
        mappingAcademicYearId,
      );
    }
  }

  if (!feeStructure?.id) {
    return row;
  }

  const [fgpm] = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .where(eq(feeGroupPromotionMappingModel.promotionId, promotion.id!))
    .orderBy(asc(feeGroupPromotionMappingModel.id))
    .limit(1);

  if (!fgpm?.feeGroupId) {
    return {
      ...row,
      receiptType: feeStructure.receiptTypeName ?? row.receiptType,
    };
  }

  let totalPayable = await projectTotalPayableForFeeStudentMapping(
    feeStructure.id,
    fgpm,
  );

  const [existingMapping] = await db
    .select({
      isWaivedOff: feeStudentMappingModel.isWaivedOff,
      waivedOffAmount: feeStudentMappingModel.waivedOffAmount,
    })
    .from(feeStudentMappingModel)
    .innerJoin(
      feeGroupPromotionMappingModel,
      eq(
        feeGroupPromotionMappingModel.id,
        feeStudentMappingModel.feeGroupPromotionMappingId,
      ),
    )
    .innerJoin(
      feeStructureModel,
      eq(feeStructureModel.id, feeStudentMappingModel.feeStructureId),
    )
    .where(
      and(
        eq(feeStudentMappingModel.studentId, studentId),
        eq(feeGroupPromotionMappingModel.promotionId, promotion.id!),
        eq(feeStructureModel.shiftId, sourceShiftId),
      ),
    )
    .limit(1);

  if (existingMapping?.isWaivedOff) {
    totalPayable = Math.max(
      0,
      totalPayable - (existingMapping.waivedOffAmount || 0),
    );
  }

  return {
    ...row,
    totalPayable,
    receiptType: feeStructure.receiptTypeName ?? row.receiptType,
    generatedDocumentType: null,
  };
}

async function loadDefaultGeneralFeeGroupPreview(
  promotion: ActivePromotionRow,
): Promise<ShiftChangeFeeGroupPreviewRow> {
  const className = await db
    .select({ name: classModel.name })
    .from(classModel)
    .where(eq(classModel.id, promotion.classId))
    .then((r) => r[0]?.name ?? "Semester");

  const [generalFeeCategory] = await db
    .select()
    .from(feeCategoryModel)
    .where(
      or(
        eq(feeCategoryModel.name, "General"),
        eq(feeCategoryModel.name, "Full Fee"),
        eq(feeCategoryModel.name, "Full Fees"),
      ),
    )
    .limit(1);

  if (!generalFeeCategory?.id) {
    return {
      promotionId: promotion.id!,
      promotionLabel: className,
      feeSlab: null,
      feeCategory: null,
      approvalType: "SYSTEM",
      approvedByUser: null,
      totalPayable: null,
      receiptType: null,
      generatedDocumentType: null,
    };
  }

  const [generalFeeGroup] = await db
    .select()
    .from(feeGroupModel)
    .where(eq(feeGroupModel.feeCategoryId, generalFeeCategory.id))
    .limit(1);

  const feeSlab = generalFeeGroup?.feeSlabId
    ? await db
        .select({ name: feeSlabModel.name })
        .from(feeSlabModel)
        .where(eq(feeSlabModel.id, generalFeeGroup.feeSlabId))
        .then((r) => r[0]?.name ?? null)
    : null;

  return {
    promotionId: promotion.id!,
    promotionLabel: className,
    feeSlab,
    feeCategory: generalFeeCategory.name ?? null,
    approvalType: "SYSTEM",
    approvedByUser: null,
    totalPayable: null,
    receiptType: null,
    generatedDocumentType: null,
  };
}

async function projectTotalPayableForFeeStudentMapping(
  feeStructureId: number,
  feeGroupPromotionMapping: typeof feeGroupPromotionMappingModel.$inferSelect,
): Promise<number> {
  const { calculateTotalPayableForFeeStudentMapping } =
    await import("@/features/fees/services/fee-structure.service.js");
  return calculateTotalPayableForFeeStudentMapping(
    feeStructureId,
    feeGroupPromotionMapping,
  );
}

/** Preview shift change eligibility, warnings, and fee-group mapping comparison. */
export async function getStudentShiftChangePreview(
  studentId: number,
  newShiftId: number,
): Promise<StudentShiftChangePreview> {
  const [student] = await db
    .select()
    .from(studentModel)
    .where(eq(studentModel.id, studentId));

  if (!student) {
    throw new Error(`Student with id ${studentId} not found`);
  }

  if (isPreviousUidSet(student.previousUid)) {
    return {
      allowed: false,
      blockReason:
        "Shift change is not allowed because this student has already changed shift once (previous UID on record).",
      previousUid: student.previousUid,
      feesPaid: false,
      currentShift: null,
      newShift: null,
      newUidPreview: null,
      uidBreakdown: null,
      hasExamHistoryOnActivePromotions: false,
      feeComparison: null,
      generatedFeeDocuments: [],
    };
  }

  const activePromotions = await getActivePromotionsForStudent(studentId);
  const activePromotionIds = activePromotions
    .map((p) => p.id)
    .filter((id): id is number => id != null);

  const oldShiftIds = [
    ...new Set(activePromotions.map((p) => p.shiftId).filter(Boolean)),
  ];
  const currentShiftId = oldShiftIds[0];

  const [currentShift, newShift] = await Promise.all([
    currentShiftId
      ? db
          .select()
          .from(shiftModel)
          .where(eq(shiftModel.id, currentShiftId))
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    db
      .select()
      .from(shiftModel)
      .where(eq(shiftModel.id, newShiftId))
      .then((r) => r[0] ?? null),
  ]);

  const [programCourse] = await db
    .select()
    .from(programCourseModel)
    .where(eq(programCourseModel.id, student.programCourseId));

  let newUidPreview: string | null = null;
  let uidBreakdown: UidBreakdownPreview | null = null;
  if (
    programCourse?.codePrefix?.trim() &&
    newShift?.codePrefix?.trim() &&
    !isPreviousUidSet(student.previousUid)
  ) {
    try {
      const regYearSuffix =
        await getRegistrationYearSuffixForStudent(studentId);
      newUidPreview = buildShiftChangeUid(
        student.uid,
        programCourse.codePrefix,
        newShift.codePrefix,
        regYearSuffix,
      );
      uidBreakdown = {
        currentUid: student.uid,
        newUid: newUidPreview,
        programCoursePrefix: programCourse.codePrefix.trim(),
        programCourseName: programCourse.name ?? null,
        programCourseShortName: programCourse.shortName ?? null,
        shiftPrefix: newShift.codePrefix.trim(),
        shiftName: newShift.name ?? null,
        registrationYear: regYearSuffix,
        sequence: student.uid.trim().slice(-4),
      };
    } catch {
      newUidPreview = null;
      uidBreakdown = null;
    }
  }

  const feesPaid = await hasSuccessfulFeePaymentForActivePromotions(
    studentId,
    activePromotionIds,
  );

  const promotionIdsWithExamHistory =
    await getPromotionIdsWithExamCandidates(activePromotionIds);

  const oldRows = await Promise.all(
    activePromotions.map(async (p) => {
      const base = await loadFeeGroupPreviewForPromotion(p);
      if (!currentShiftId || feesPaid) {
        return base;
      }
      return enrichFeePreviewWithMappingDetails(
        studentId,
        p,
        currentShiftId,
        base,
      );
    }),
  );

  let newRows: ShiftChangeFeeGroupPreviewRow[] = [];
  if (!feesPaid) {
    newRows = await Promise.all(
      activePromotions.map(async (p) => {
        const oldRow = await loadFeeGroupPreviewForPromotion(p);
        let projectedRow: ShiftChangeFeeGroupPreviewRow;
        if (oldRow.feeCategory) {
          projectedRow = {
            ...oldRow,
            promotionLabel: `${oldRow.promotionLabel} (new row)`,
            approvalType: oldRow.approvalType ?? "SYSTEM",
            totalPayable: null,
            receiptType: null,
            generatedDocumentType: null,
          };
        } else {
          projectedRow = await loadDefaultGeneralFeeGroupPreview(p);
        }
        return enrichFeePreviewWithProjectedPayable(
          studentId,
          p,
          newShiftId,
          currentShiftId!,
          projectedRow,
        );
      }),
    );
  }

  let blockReason: string | null = null;
  if (!activePromotions.length) {
    blockReason =
      "No active promotion (end date is empty) found for this student.";
  } else if (oldShiftIds.length > 1) {
    blockReason =
      "Active promotions have inconsistent shifts; resolve before changing shift.";
  } else if (!newShift) {
    blockReason = "Selected shift not found.";
  } else if (newShift.disabled) {
    blockReason = `Shift "${newShift.name}" is disabled.`;
  } else if (currentShiftId === newShiftId) {
    blockReason = "Student is already on the selected shift.";
  } else if (feesPaid) {
    blockReason =
      "Shift change is not allowed: fees for the current promotion are already paid.";
  }

  const generatedFeeDocuments =
    feesPaid || !currentShiftId
      ? []
      : await loadGeneratedFeeDocumentsForStudent(
          studentId,
          activePromotionIds,
          currentShiftId,
        );

  return {
    allowed: blockReason == null,
    blockReason,
    previousUid: student.previousUid ?? null,
    feesPaid,
    currentShift: currentShift
      ? { id: currentShift.id!, name: currentShift.name }
      : null,
    newShift: newShift ? { id: newShift.id!, name: newShift.name } : null,
    newUidPreview,
    uidBreakdown,
    hasExamHistoryOnActivePromotions: promotionIdsWithExamHistory.length > 0,
    feeComparison: feesPaid ? null : { old: oldRows, new: newRows },
    generatedFeeDocuments,
  };
}

async function recreateFeeMappingsForActivePromotions(
  newShiftId: number,
  activePromotions: ActivePromotionRow[],
): Promise<number> {
  const structureById = new Map<
    number,
    typeof feeStructureModel.$inferSelect
  >();

  for (const promo of activePromotions) {
    if (!promo.academicYearId) continue;

    const [fs] = await db
      .select()
      .from(feeStructureModel)
      .where(
        and(
          eq(feeStructureModel.academicYearId, promo.academicYearId),
          eq(feeStructureModel.programCourseId, promo.programCourseId),
          eq(feeStructureModel.classId, promo.classId),
          eq(feeStructureModel.shiftId, newShiftId),
        ),
      )
      .limit(1);

    if (fs?.id) structureById.set(fs.id, fs);
  }

  for (const fs of structureById.values()) {
    await ensureDefaultFeeStudentMappingsForFeeStructure(fs);
  }

  return structureById.size;
}

export async function changeStudentShift(
  studentId: number,
  newShiftId: number,
): Promise<StudentShiftChangeResult> {
  const [student] = await db
    .select()
    .from(studentModel)
    .where(eq(studentModel.id, studentId));

  if (!student) {
    throw new Error(`Student with id ${studentId} not found`);
  }

  if (isPreviousUidSet(student.previousUid)) {
    throw new Error(
      "Shift change is not allowed: this student has already changed shift once (previous UID on record).",
    );
  }

  const [newShift] = await db
    .select()
    .from(shiftModel)
    .where(eq(shiftModel.id, newShiftId));

  if (!newShift) {
    throw new Error(`Shift with id ${newShiftId} not found`);
  }

  if (newShift.disabled) {
    throw new Error(`Shift "${newShift.name}" is disabled`);
  }

  const [programCourse] = await db
    .select()
    .from(programCourseModel)
    .where(eq(programCourseModel.id, student.programCourseId));

  if (!programCourse?.codePrefix?.trim()) {
    throw new Error("Program course code prefix is not configured");
  }

  if (!newShift.codePrefix?.trim()) {
    throw new Error("Shift code prefix is not configured");
  }

  const activePromotions = await getActivePromotionsForStudent(studentId);
  if (!activePromotions.length) {
    throw new Error(
      "No active promotions (without end date) found for student",
    );
  }

  const oldShiftIds = [
    ...new Set(activePromotions.map((p) => p.shiftId).filter(Boolean)),
  ];
  if (oldShiftIds.length > 1) {
    throw new Error(
      "Active promotions have inconsistent shifts; resolve before changing shift",
    );
  }

  const oldShiftId = oldShiftIds[0]!;
  if (oldShiftId === newShiftId) {
    throw new Error("Student is already on the requested shift");
  }

  const activePromotionIds = activePromotions
    .map((p) => p.id)
    .filter((id): id is number => id != null);

  const feesPaid = await hasSuccessfulFeePaymentForActivePromotions(
    studentId,
    activePromotionIds,
  );

  if (feesPaid) {
    throw new Error(
      "Shift change is not allowed: fees for the current promotion are already paid.",
    );
  }

  const regYearSuffix = await getRegistrationYearSuffixForStudent(studentId);
  const newUid = buildShiftChangeUid(
    student.uid,
    programCourse.codePrefix,
    newShift.codePrefix,
    regYearSuffix,
  );
  const newEmail = `${newUid}@${STUDENT_EMAIL_DOMAIN}`.toLowerCase();

  if (newUid !== student.uid) {
    const [uidConflict] = await db
      .select({ id: studentModel.id })
      .from(studentModel)
      .where(and(eq(studentModel.uid, newUid), ne(studentModel.id, studentId)))
      .limit(1);

    if (uidConflict) {
      throw new Error(`UID "${newUid}" is already assigned to another student`);
    }
  }

  const existingEmailUser = await userService.findByEmail(newEmail);
  if (existingEmailUser?.id && existingEmailUser.id !== student.userId) {
    throw new Error(`Email "${newEmail}" is already in use`);
  }

  const [currentUser] = await db
    .select({ email: userModel.email })
    .from(userModel)
    .where(eq(userModel.id, student.userId));

  let feeMappingsDeleted = 0;
  let feeStructuresProcessed = 0;
  let promotionsClosed = 0;
  let promotionsCloned = 0;

  const promotionIdsWithExamHistory =
    await getPromotionIdsWithExamCandidates(activePromotionIds);

  const closedAt = new Date();

  await db.transaction(async (tx) => {
    if (!feesPaid) {
      const mappingIds = await collectFeeMappingIdsForOldShift(
        studentId,
        activePromotions,
        oldShiftId,
      );

      if (mappingIds.length) {
        await tx
          .delete(paymentModel)
          .where(inArray(paymentModel.feeStudentMappingId, mappingIds));

        const deleted = await tx
          .delete(feeStudentMappingModel)
          .where(inArray(feeStudentMappingModel.id, mappingIds))
          .returning({ id: feeStudentMappingModel.id });

        feeMappingsDeleted = deleted.length;
      }
    }

    for (const promo of activePromotions) {
      if (promo.id == null) continue;

      const examFormFields =
        await resolveExamFormFieldsForClonedPromotion(promo);

      await tx
        .update(promotionModel)
        .set({ endDate: closedAt, isDeprecated: true, updatedAt: closedAt })
        .where(
          and(
            eq(promotionModel.id, promo.id),
            activePromotionCondition(eq(promotionModel.studentId, studentId)),
          ),
        );

      const [inserted] = await tx
        .insert(promotionModel)
        .values(
          buildClonedPromotionInsert(
            promo,
            newShiftId,
            closedAt,
            examFormFields,
          ),
        )
        .returning({ id: promotionModel.id });

      if (inserted?.id != null) {
        await tx
          .update(userStatusMappingOverview)
          .set({
            promotionId: inserted.id,
            updatedAt: closedAt,
          })
          .where(
            and(
              eq(userStatusMappingOverview.promotionId, promo.id),
              eq(userStatusMappingOverview.studentId, studentId),
              eq(userStatusMappingOverview.isActive, true),
            ),
          );
      }

      promotionsClosed++;
      promotionsCloned++;
    }

    if (promotionsClosed === 0) {
      throw new Error(
        "Failed to update any active promotion (endDate IS NULL)",
      );
    }

    await tx
      .update(studentModel)
      .set({
        previousUid: student.uid,
        uid: newUid,
        updatedAt: new Date(),
      })
      .where(eq(studentModel.id, studentId));

    await tx
      .update(userModel)
      .set({
        email: newEmail,
        updatedAt: new Date(),
      })
      .where(eq(userModel.id, student.userId));
  });

  // Recreate fee_student_mappings (+ fee_group_promotion_mappings via ensureDefault)
  // for unpaid shifts. On close+clone, new promotion rows need fresh fgpm/fsm.
  if (!feesPaid) {
    const refreshedActivePromotions =
      await getActivePromotionsForStudent(studentId);
    feeStructuresProcessed = await recreateFeeMappingsForActivePromotions(
      newShiftId,
      refreshedActivePromotions,
    );
  }

  return {
    studentId,
    previousUid: student.uid,
    newUid,
    oldEmail: currentUser?.email ?? "",
    newEmail,
    oldShiftId,
    newShiftId,
    feesPaid,
    promotionsUpdated: promotionsCloned,
    promotionsClosedForExamHistory: promotionsClosed,
    promotionsClonedForExamHistory: promotionsCloned,
    promotionIdsWithExamHistory,
    feeMappingsDeleted,
    feeStructuresProcessed,
  };
}
