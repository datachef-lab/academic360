/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";
import {
  feeGroupPromotionMappingModel,
  createFeeGroupPromotionMappingSchema,
  feeGroupModel,
  feeCategoryModel,
  feeSlabModel,
  promotionModel,
  boardResultStatusModel,
  paymentModel,
} from "@repo/db/schemas";
// import { promotionStatusModel } from "@repo/db/schemas/models/batches";
import {
  sessionModel,
  classModel,
  sectionModel,
  shiftModel,
  academicYearModel,
} from "@repo/db/schemas/models/academics";
import {
  studentModel,
  personalDetailsModel,
} from "@repo/db/schemas/models/user";
import {
  and,
  or,
  asc,
  count,
  ilike,
  inArray,
  desc,
  eq,
  isNull,
  sql,
  type SQL,
} from "drizzle-orm";
import { programCourseModel } from "@repo/db/schemas/models/course-design";
import {
  feeStructureModel,
  feeStructureComponentModel,
} from "@repo/db/schemas";
import XLSX from "xlsx";
import fs from "fs";
import * as studentService from "@/features/user/services/student.service.js";
import { socketService } from "@/services/socketService.js";
import { scheduleFeesDashboardBroadcast } from "../fees-dashboard.socket.js";
import { feeStudentMappingModel } from "@repo/db/schemas";
import { FeeGroupPromotionMappingDto } from "@repo/db/dtos/fees";
import { PromotionDto } from "@repo/db/dtos/batches";
import {
  religionModel,
  categoryModel,
} from "@repo/db/schemas/models/resources";
import * as programCourseService from "@/features/course-design/services/program-course.service.js";
import * as userService from "@/features/user/services/user.service.js";
import {
  getFeeGroupTotalsForPromotion,
  getFeeGroupTotalsForPromotions,
} from "./fee-group.service.js";

type FsmPaymentRow = {
  totalPayable: number | null;
  amountPaid: number | null;
};

/**
 * Display total for a fee-group promotion mapping: one slab total for the promotion's
 * fee structure(s), not the sum of every fee_student_mapping row (which multi-counts
 * when multiple receipt types / structures exist for the same slab).
 */
function resolveMappingTotalPayableAmount(
  expectedFromStructure: number,
  fsmRows: FsmPaymentRow[],
): number {
  const fsmSum = fsmRows.reduce((sum, r) => sum + (r.totalPayable || 0), 0);
  return expectedFromStructure > 0 ? expectedFromStructure : fsmSum;
}

function resolveMappingAmountToPay(
  expectedFromStructure: number,
  fsmRows: FsmPaymentRow[],
): number {
  if (expectedFromStructure > 0) {
    const paid = fsmRows.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
    return Math.max(0, expectedFromStructure - paid);
  }
  return fsmRows.reduce(
    (sum, r) => sum + Math.max(0, (r.totalPayable || 0) - (r.amountPaid || 0)),
    0,
  );
}

/**
 * Converts a Promotion model to PromotionDto
 */
async function promotionToDto(
  promotion: typeof promotionModel.$inferSelect | null,
): Promise<PromotionDto | null> {
  if (!promotion) return null;

  const [
    // promStatus,
    boardResStatus,
    sess,
    cls,
    sec,
    shf,
    progCourse,
    studentWithDetails,
  ] = await Promise.all([
    promotion.boardResultStatusId
      ? db
          .select()
          .from(boardResultStatusModel)
          .where(eq(boardResultStatusModel.id, promotion.boardResultStatusId))
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    db
      .select()
      .from(sessionModel)
      .where(eq(sessionModel.id, promotion.sessionId))
      .then(async (r) => {
        const session = r[0] ?? null;
        if (session && session.academicYearId) {
          const [academicYear] = await db
            .select()
            .from(academicYearModel)
            .where(eq(academicYearModel.id, session.academicYearId));

          return {
            ...session,
            academicYear: academicYear || null,
          };
        }
        return session;
      }),
    db
      .select()
      .from(classModel)
      .where(eq(classModel.id, promotion.classId))
      .then((r) => r[0] ?? null),
    promotion.sectionId
      ? db
          .select()
          .from(sectionModel)
          .where(eq(sectionModel.id, promotion.sectionId))
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    db
      .select()
      .from(shiftModel)
      .where(eq(shiftModel.id, promotion.shiftId))
      .then((r) => r[0] ?? null),
    programCourseService.findById(promotion.programCourseId),
    // Student + personal details (for name, UID, religion, category, community)
    db
      .select({
        uid: studentModel.uid,
        community: studentModel.community,
        firstName: personalDetailsModel.firstName,
        middleName: personalDetailsModel.middleName,
        lastName: personalDetailsModel.lastName,
        religionName: religionModel.name,
        categoryName: categoryModel.name,
      })
      .from(studentModel)
      .leftJoin(
        personalDetailsModel,
        eq(personalDetailsModel.userId, studentModel.userId),
      )
      .leftJoin(
        religionModel,
        eq(religionModel.id, personalDetailsModel.religionId),
      )
      .leftJoin(
        categoryModel,
        eq(categoryModel.id, personalDetailsModel.categoryId),
      )
      .where(eq(studentModel.id, promotion.studentId))
      .then((r) => r[0] ?? null),
  ]);

  // Section can be optional; allow promotions without a section.
  if (!sess || !cls || !shf || !progCourse) {
    return null;
  }

  const fullName = studentWithDetails
    ? [
        studentWithDetails.firstName,
        studentWithDetails.middleName,
        studentWithDetails.lastName,
      ]
        .filter(Boolean)
        .join(" ")
    : null;

  return {
    id: promotion.id,
    legacyHistoricalRecordId: promotion.legacyHistoricalRecordId ?? null,
    studentId: promotion.studentId,
    isAlumni: promotion.isAlumni,
    dateOfJoining: promotion.dateOfJoining,
    classRollNumber: promotion.classRollNumber,
    rollNumber: promotion.rollNumber ?? null,
    rollNumberSI: promotion.rollNumberSI ?? null,
    examNumber: promotion.examNumber ?? null,
    examSerialNumber: promotion.examSerialNumber ?? null,
    startDate: promotion.startDate ?? null,
    endDate: promotion.endDate ?? null,
    remarks: promotion.remarks ?? null,
    createdAt: promotion.createdAt ?? new Date(),
    updatedAt: promotion.updatedAt ?? new Date(),
    // promotionStatus: promStatus,
    boardResultStatus: boardResStatus!,
    session: sess,
    class: cls,
    section: sec,
    shift: shf,
    programCourse: progCourse!,
    // Extra display fields used on the frontend table
    // (these extend PromotionDto structurally)
    studentName: fullName,
    uid: studentWithDetails?.uid ?? null,
    religionName: studentWithDetails?.religionName ?? null,
    categoryName: studentWithDetails?.categoryName ?? null,
    communityName: studentWithDetails?.community ?? null,
    academicYearName:
      // Prefer academic year name if available on session
      (sess as any)?.academicYear?.year ?? null,
  } as PromotionDto & {
    studentName?: string | null;
    uid?: string | null;
    religionName?: string | null;
    categoryName?: string | null;
    communityName?: string | null;
    academicYearName?: string | null;
  };
}

type PromotionRow = typeof promotionModel.$inferSelect;

/**
 * Batch version of promotionToDto — avoids N×(6–8) DB round-trips when loading lists.
 */
async function promotionsToDtoBatch(
  promotions: PromotionRow[],
): Promise<Map<number, PromotionDto>> {
  const map = new Map<number, PromotionDto>();
  if (promotions.length === 0) return map;

  const boardIds = [
    ...new Set(
      promotions
        .map((p) => p.boardResultStatusId)
        .filter((id): id is number => id != null),
    ),
  ];
  const sessionIds = [...new Set(promotions.map((p) => p.sessionId))];
  const classIds = [...new Set(promotions.map((p) => p.classId))];
  const sectionIds = [
    ...new Set(
      promotions
        .map((p) => p.sectionId)
        .filter((id): id is number => id != null),
    ),
  ];
  const shiftIds = [...new Set(promotions.map((p) => p.shiftId))];
  const programCourseIds = [
    ...new Set(promotions.map((p) => p.programCourseId)),
  ];
  const studentIds = [...new Set(promotions.map((p) => p.studentId))];

  const [
    boardRows,
    sessionRows,
    classRows,
    sectionRows,
    shiftRows,
    studentDetailRows,
  ] = await Promise.all([
    boardIds.length
      ? db
          .select()
          .from(boardResultStatusModel)
          .where(inArray(boardResultStatusModel.id, boardIds))
      : Promise.resolve([]),
    sessionIds.length
      ? db
          .select()
          .from(sessionModel)
          .where(inArray(sessionModel.id, sessionIds))
      : Promise.resolve([]),
    classIds.length
      ? db.select().from(classModel).where(inArray(classModel.id, classIds))
      : Promise.resolve([]),
    sectionIds.length
      ? db
          .select()
          .from(sectionModel)
          .where(inArray(sectionModel.id, sectionIds))
      : Promise.resolve([]),
    shiftIds.length
      ? db.select().from(shiftModel).where(inArray(shiftModel.id, shiftIds))
      : Promise.resolve([]),
    studentIds.length
      ? db
          .select({
            studentId: studentModel.id,
            uid: studentModel.uid,
            community: studentModel.community,
            firstName: personalDetailsModel.firstName,
            middleName: personalDetailsModel.middleName,
            lastName: personalDetailsModel.lastName,
            religionName: religionModel.name,
            categoryName: categoryModel.name,
          })
          .from(studentModel)
          .leftJoin(
            personalDetailsModel,
            eq(personalDetailsModel.userId, studentModel.userId),
          )
          .leftJoin(
            religionModel,
            eq(religionModel.id, personalDetailsModel.religionId),
          )
          .leftJoin(
            categoryModel,
            eq(categoryModel.id, personalDetailsModel.categoryId),
          )
          .where(inArray(studentModel.id, studentIds))
      : Promise.resolve([]),
  ]);

  const programCourseDtos =
    programCourseIds.length > 0
      ? await Promise.all(
          programCourseIds.map((id) => programCourseService.findById(id)),
        )
      : [];

  const ayIds = [
    ...new Set(
      sessionRows
        .map((s) => s.academicYearId)
        .filter((id): id is number => id != null),
    ),
  ];
  const academicYearRows =
    ayIds.length > 0
      ? await db
          .select()
          .from(academicYearModel)
          .where(inArray(academicYearModel.id, ayIds))
      : [];
  const ayMap = new Map(academicYearRows.map((ay) => [ay.id, ay]));

  const boardMap = new Map(boardRows.map((b) => [b.id, b]));
  const sessionMap = new Map(
    sessionRows.map((s) => {
      const ay = s.academicYearId
        ? (ayMap.get(s.academicYearId) ?? null)
        : null;
      return [s.id, { ...s, academicYear: ay }] as const;
    }),
  );
  const classMap = new Map(classRows.map((c) => [c.id, c]));
  const sectionMap = new Map(sectionRows.map((s) => [s.id, s]));
  const shiftMap = new Map(shiftRows.map((s) => [s.id, s]));
  const pcMap = new Map(
    programCourseDtos
      .filter((pc): pc is NonNullable<typeof pc> => pc != null)
      .map((pc) => [pc.id, pc] as const),
  );
  const studentMap = new Map(
    studentDetailRows.map((r) => [r.studentId, r] as const),
  );

  for (const promotion of promotions) {
    const boardResStatus = promotion.boardResultStatusId
      ? (boardMap.get(promotion.boardResultStatusId) ?? null)
      : null;
    const sess = sessionMap.get(promotion.sessionId) ?? null;
    const cls = classMap.get(promotion.classId) ?? null;
    const sec = promotion.sectionId
      ? (sectionMap.get(promotion.sectionId) ?? null)
      : null;
    const shf = shiftMap.get(promotion.shiftId) ?? null;
    const progCourse = pcMap.get(promotion.programCourseId) ?? null;
    const studentWithDetails = studentMap.get(promotion.studentId) ?? null;

    if (!sess || !cls || !shf || !progCourse) continue;

    const fullName = studentWithDetails
      ? [
          studentWithDetails.firstName,
          studentWithDetails.middleName,
          studentWithDetails.lastName,
        ]
          .filter(Boolean)
          .join(" ")
      : null;

    map.set(promotion.id, {
      id: promotion.id,
      legacyHistoricalRecordId: promotion.legacyHistoricalRecordId ?? null,
      studentId: promotion.studentId,
      isAlumni: promotion.isAlumni,
      dateOfJoining: promotion.dateOfJoining,
      classRollNumber: promotion.classRollNumber,
      rollNumber: promotion.rollNumber ?? null,
      rollNumberSI: promotion.rollNumberSI ?? null,
      examNumber: promotion.examNumber ?? null,
      examSerialNumber: promotion.examSerialNumber ?? null,
      startDate: promotion.startDate ?? null,
      endDate: promotion.endDate ?? null,
      remarks: promotion.remarks ?? null,
      createdAt: promotion.createdAt ?? new Date(),
      updatedAt: promotion.updatedAt ?? new Date(),
      boardResultStatus: boardResStatus!,
      session: sess,
      class: cls,
      section: sec,
      shift: shf,
      programCourse: progCourse,
      studentName: fullName,
      uid: studentWithDetails?.uid ?? null,
      religionName: studentWithDetails?.religionName ?? null,
      categoryName: studentWithDetails?.categoryName ?? null,
      communityName: studentWithDetails?.community ?? null,
      academicYearName:
        (sess as { academicYear?: { year?: string } | null }).academicYear
          ?.year ?? null,
    } as PromotionDto & {
      studentName?: string | null;
      uid?: string | null;
      religionName?: string | null;
      categoryName?: string | null;
      communityName?: string | null;
      academicYearName?: string | null;
    });
  }

  return map as Map<number, PromotionDto>;
}

/**
 * Converts a FeeGroupPromotionMapping model to FeeGroupPromotionMappingDto
 */
async function modelToDto(
  model: typeof feeGroupPromotionMappingModel.$inferSelect | null,
): Promise<FeeGroupPromotionMappingDto | null> {
  if (!model) return null;

  const [feeGroup, promotion] = await Promise.all([
    db
      .select()
      .from(feeGroupModel)
      .where(eq(feeGroupModel.id, model.feeGroupId))
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(promotionModel)
      .where(eq(promotionModel.id, model.promotionId))
      .then((r) => r[0] ?? null),
  ]);

  if (!feeGroup || !promotion) {
    return null;
  }

  // Fetch feeCategory and feeSlab for the feeGroup
  const [feeCategory, feeSlab] = await Promise.all([
    db
      .select()
      .from(feeCategoryModel)
      .where(eq(feeCategoryModel.id, feeGroup.feeCategoryId))
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(feeSlabModel)
      .where(eq(feeSlabModel.id, feeGroup.feeSlabId))
      .then((r) => r[0] ?? null),
  ]);

  if (!feeCategory || !feeSlab) {
    return null;
  }

  const promotionDto = await promotionToDto(promotion);
  if (!promotionDto) {
    return null;
  }

  return {
    ...model,
    feeGroup: {
      ...feeGroup,
      feeCategory,
      feeSlab,
    },
    promotion: promotionDto,
  };
}

/**
 * Services should accept validated DTOs (controller validates via zod) and
 * return raw rows / arrays / null. Do not catch errors here — controller will handle them.
 */

function activePromotionCondition(...extra: SQL[]): SQL {
  const parts: SQL[] = [
    isNull(promotionModel.endDate),
    sql`COALESCE(${promotionModel.isDeprecated}, false) = false`,
  ];
  if (extra.length) parts.push(...extra);
  return and(...parts)!;
}

export const createFeeGroupPromotionMapping = async (
  data: Omit<
    typeof createFeeGroupPromotionMappingSchema._type,
    "id" | "createdAt" | "updatedAt" | "createdByUserId" | "updatedByUserId"
  >,
  userId: number,
): Promise<FeeGroupPromotionMappingDto> => {
  const [created] = await db
    .insert(feeGroupPromotionMappingModel)
    .values({
      ...data,
    })
    .returning();

  const dto = await modelToDto(created);

  // Emit socket event for fee group promotion mapping creation
  const io = socketService.getIO();
  if (io && dto) {
    // Get user name for notification
    const user = await userService.findById(userId);
    const userName = user?.name || "Unknown User";

    io.emit("fee_group_promotion_mapping_created", {
      mappingId: dto.id,
      type: "creation",
      message: "A new student fee group mapping has been created",
      timestamp: new Date().toISOString(),
    });

    // Emit notification to all staff/admin users
    io.emit("notification", {
      id: `fee_group_promotion_mapping_created_${dto.id}_${Date.now()}`,
      type: "info",
      userId: userId.toString(),
      userName,
      message: `created a new student fee group mapping (ID: ${dto.id})`,
      createdAt: new Date(),
      read: false,
      meta: { mappingId: dto.id, type: "creation" },
    });
  }

  return dto!;
};

type FeeGroupPromotionMappingRow =
  typeof feeGroupPromotionMappingModel.$inferSelect;

/**
 * Expands raw mapping rows into full DTOs (fee group + promotion + payment status
 * + payable amounts) using batched lookups. Output preserves the order of `rows`,
 * so callers control sorting.
 */
async function hydrateMappingRows(
  rows: FeeGroupPromotionMappingRow[],
): Promise<FeeGroupPromotionMappingDto[]> {
  if (rows.length === 0) return [];

  // Batch fetch fee groups and promotions to reduce queries
  const feeGroupIds = [...new Set(rows.map((r) => r.feeGroupId))];
  const promotionIds = [...new Set(rows.map((r) => r.promotionId))];

  const [feeGroups, promotions] = await Promise.all([
    feeGroupIds.length > 0
      ? db
          .select()
          .from(feeGroupModel)
          .where(inArray(feeGroupModel.id, feeGroupIds))
      : Promise.resolve([]),
    promotionIds.length > 0
      ? db
          .select()
          .from(promotionModel)
          .where(inArray(promotionModel.id, promotionIds))
      : Promise.resolve([]),
  ]);

  const feeGroupMap = new Map(feeGroups.map((fg) => [fg.id, fg]));

  // Batch fetch fee categories and slabs
  const feeCategoryIds = [...new Set(feeGroups.map((fg) => fg.feeCategoryId))];
  const feeSlabIds = [...new Set(feeGroups.map((fg) => fg.feeSlabId))];

  const [feeCategories, feeSlabs] = await Promise.all([
    feeCategoryIds.length > 0
      ? db
          .select()
          .from(feeCategoryModel)
          .where(inArray(feeCategoryModel.id, feeCategoryIds))
      : Promise.resolve([]),
    feeSlabIds.length > 0
      ? db
          .select()
          .from(feeSlabModel)
          .where(inArray(feeSlabModel.id, feeSlabIds))
      : Promise.resolve([]),
  ]);

  const feeCategoryMap = new Map(feeCategories.map((fc) => [fc.id, fc]));
  const feeSlabMap = new Map(feeSlabs.map((fs) => [fs.id, fs]));

  // Batch fetch all promotion-related data (single batched round-trip set vs N×promotionToDto)
  const promotionDtoMap = await promotionsToDtoBatch(promotions);

  // Batch fetch fee student mappings for payment status and amount to pay
  const mappingIds = rows
    .map((r) => r.id)
    .filter((id): id is number => id != null);
  const feeStudentMappings =
    mappingIds.length > 0
      ? await db
          .select({
            feeGroupPromotionMappingId:
              feeStudentMappingModel.feeGroupPromotionMappingId,
            totalPayable: feeStudentMappingModel.totalPayable,
            amountPaid: feeStudentMappingModel.amountPaid,
            linkedPaymentStatus: paymentModel.status,
          })
          .from(feeStudentMappingModel)
          .leftJoin(
            paymentModel,
            and(
              eq(paymentModel.feeStudentMappingId, feeStudentMappingModel.id),
              eq(paymentModel.isLinked, true),
            ),
          )
          .where(
            inArray(
              feeStudentMappingModel.feeGroupPromotionMappingId,
              mappingIds,
            ),
          )
      : [];

  const uniquePromotionIds = [...new Set(rows.map((r) => r.promotionId))];

  // How many mappings each promotion has in total — the UI only offers delete when a
  // promotion has more than one. This must be counted across the whole table, not just
  // the rows in hand, because a promotion's mappings can fall on different pages.
  const mappingCountRows =
    uniquePromotionIds.length > 0
      ? await db
          .select({
            promotionId: feeGroupPromotionMappingModel.promotionId,
            total: count(),
          })
          .from(feeGroupPromotionMappingModel)
          .where(
            inArray(
              feeGroupPromotionMappingModel.promotionId,
              uniquePromotionIds,
            ),
          )
          .groupBy(feeGroupPromotionMappingModel.promotionId)
      : [];
  const mappingCountByPromotionId = new Map(
    mappingCountRows.map((r) => [r.promotionId, Number(r.total ?? 0)]),
  );

  const totalsByPromotion =
    await getFeeGroupTotalsForPromotions(uniquePromotionIds);
  const structureTotalByPromotion = new Map<number, Map<number, number>>();
  for (const [promotionId, totals] of totalsByPromotion) {
    structureTotalByPromotion.set(
      promotionId,
      new Map(totals.map((t) => [t.feeGroupId, t.totalPayable])),
    );
  }

  const paymentByMappingId = new Map<
    number,
    {
      paymentStatus: "Paid" | "Pending" | "Unpaid";
      amountToPay: number;
      totalPayableAmount: number;
      saveBlockedForEdit: boolean;
    }
  >();
  const relatedByFgpmId = new Map<number, typeof feeStudentMappings>();
  for (const fsm of feeStudentMappings) {
    const mid = fsm.feeGroupPromotionMappingId;
    if (mid == null) continue;
    const list = relatedByFgpmId.get(mid);
    if (list) list.push(fsm);
    else relatedByFgpmId.set(mid, [fsm]);
  }
  for (const row of rows) {
    if (row.id == null) continue;
    const mappingId = row.id;
    const related = relatedByFgpmId.get(mappingId) ?? [];
    const expectedFromStructure =
      structureTotalByPromotion.get(row.promotionId)?.get(row.feeGroupId) ?? 0;
    const totalPayableAmount = resolveMappingTotalPayableAmount(
      expectedFromStructure,
      related,
    );
    const amountToPay = resolveMappingAmountToPay(
      expectedFromStructure,
      related,
    );
    const hasSuccessfulPayment = related.some(
      (r) => r.linkedPaymentStatus === "SUCCESS",
    );
    // Only lock the mapping edit UI after a completed (SUCCESS) payment — pending/challan still editable
    const saveBlockedForEdit = hasSuccessfulPayment;
    let paymentStatus: "Paid" | "Pending" | "Unpaid";
    if (hasSuccessfulPayment) {
      paymentStatus = "Paid";
    } else if (related.length === 0) {
      paymentStatus = "Unpaid";
    } else {
      paymentStatus = "Pending";
    }
    paymentByMappingId.set(mappingId, {
      paymentStatus,
      amountToPay,
      totalPayableAmount,
      saveBlockedForEdit,
    });
  }

  // Build DTOs using cached data
  const dtos: FeeGroupPromotionMappingDto[] = [];
  for (const row of rows) {
    const feeGroup = feeGroupMap.get(row.feeGroupId);
    const promotionDto = promotionDtoMap.get(row.promotionId);

    if (!feeGroup || !promotionDto) continue;

    const feeCategory = feeCategoryMap.get(feeGroup.feeCategoryId);
    const feeSlab = feeSlabMap.get(feeGroup.feeSlabId);

    if (!feeCategory || !feeSlab) continue;

    const payment = row.id ? paymentByMappingId.get(row.id) : undefined;

    dtos.push({
      ...row,
      feeGroup: {
        ...feeGroup,
        feeCategory,
        feeSlab,
      },
      promotion: promotionDto,
      paymentStatus: payment?.paymentStatus ?? "Pending",
      amountToPay: payment?.amountToPay ?? 0,
      totalPayableAmount: payment?.totalPayableAmount ?? 0,
      saveBlockedForEdit: payment?.saveBlockedForEdit ?? false,
      promotionMappingCount:
        mappingCountByPromotionId.get(row.promotionId) ?? 1,
    });
  }

  return dtos;
}

export const getAllFeeGroupPromotionMappings = async (
  limit: number = 10000,
): Promise<FeeGroupPromotionMappingDto[]> => {
  // Order by id DESC to maintain consistent ordering (updated items stay in place)
  const rows = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .orderBy(desc(feeGroupPromotionMappingModel.id))
    .limit(limit);

  return hydrateMappingRows(rows);
};

export type FeeGroupPromotionMappingListFilters = {
  page: number;
  limit: number;
  search?: string;
  academicYear?: string;
  semesterOrClass?: string;
  programCourse?: string;
  shift?: string;
  religion?: string;
  community?: string;
  category?: string;
  feeCategory?: string;
  feeSlab?: string;
};

export type FeeGroupPromotionMappingListResult = {
  rows: FeeGroupPromotionMappingDto[];
  total: number;
  page: number;
  limit: number;
};

/** Student's display name, matching the `firstName middleName lastName` join used in the DTOs. */
const STUDENT_FULL_NAME_SQL = sql<string>`TRIM(BOTH ' ' FROM CONCAT_WS(' ', ${personalDetailsModel.firstName}, ${personalDetailsModel.middleName}, ${personalDetailsModel.lastName}))`;

function buildListWhere(
  filters: Omit<FeeGroupPromotionMappingListFilters, "page" | "limit">,
): SQL | undefined {
  const parts: SQL[] = [];

  const search = filters.search?.trim();
  if (search) {
    const term = `%${search}%`;
    const searchParts: SQL[] = [
      // Anchored so this branch can use the existing UNIQUE btree on students.uid.
      // NOTE: it only pays off when the surrounding OR is removed — see the comment
      // on buildListWhere about why the 12-branch OR cannot use any index.
      ilike(studentModel.uid, `${search}%`),
      ilike(STUDENT_FULL_NAME_SQL, term),
      ilike(promotionModel.classRollNumber, term),
      ilike(promotionModel.rollNumber, term),
      ilike(programCourseModel.name, term),
      ilike(classModel.name, term),
      ilike(shiftModel.name, term),
      ilike(categoryModel.name, term),
      ilike(religionModel.name, term),
      ilike(feeCategoryModel.name, term),
      ilike(feeSlabModel.name, term),
      // Mapping id is numeric; cast so a typed id still matches as it did client-side.
      ilike(
        sql<string>`CAST(${feeGroupPromotionMappingModel.id} AS TEXT)`,
        term,
      ),
    ];
    const searchOr = or(...searchParts);
    if (searchOr) parts.push(searchOr);
  }

  // Filters arrive as display-name strings from the UI dropdowns, and the previous
  // client-side implementation compared them with exact, case-sensitive equality.
  // Matching on names here keeps that behaviour and avoids reworking the dropdowns.
  if (filters.academicYear) {
    parts.push(eq(academicYearModel.year, filters.academicYear));
  }
  if (filters.semesterOrClass) {
    parts.push(eq(classModel.name, filters.semesterOrClass));
  }
  if (filters.programCourse) {
    parts.push(eq(programCourseModel.name, filters.programCourse));
  }
  if (filters.shift) {
    parts.push(eq(shiftModel.name, filters.shift));
  }
  if (filters.religion) {
    parts.push(eq(religionModel.name, filters.religion));
  }
  if (filters.category) {
    parts.push(eq(categoryModel.name, filters.category));
  }
  if (filters.community) {
    parts.push(
      eq(
        studentModel.community,
        filters.community as (typeof studentModel.community.enumValues)[number],
      ),
    );
  }
  if (filters.feeCategory) {
    parts.push(eq(feeCategoryModel.name, filters.feeCategory));
  }
  if (filters.feeSlab) {
    parts.push(eq(feeSlabModel.name, filters.feeSlab));
  }

  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
}

/**
 * Paginated + searchable list for the Student Fee Group Mapping table.
 *
 * Search, filtering, ordering and paging all happen in SQL so only one page of rows
 * is ever hydrated — previously the endpoint built and shipped every matching row
 * (up to 10,000) and the browser did the filtering.
 */
export const getFeeGroupPromotionMappingsPaginated = async (
  filters: FeeGroupPromotionMappingListFilters,
): Promise<FeeGroupPromotionMappingListResult> => {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);

  // The join chain is spelled out twice rather than shared through a helper:
  // Drizzle's fluent builder types do not survive a generic wrapper, and the casts
  // needed to force it would suppress genuine type errors in these queries.
  const runCountQuery = () =>
    db
      .select({ total: count() })
      .from(feeGroupPromotionMappingModel)
      .innerJoin(
        promotionModel,
        eq(promotionModel.id, feeGroupPromotionMappingModel.promotionId),
      )
      .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
      .innerJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
      .innerJoin(classModel, eq(classModel.id, promotionModel.classId))
      .innerJoin(shiftModel, eq(shiftModel.id, promotionModel.shiftId))
      .innerJoin(
        programCourseModel,
        eq(programCourseModel.id, promotionModel.programCourseId),
      )
      .innerJoin(
        feeGroupModel,
        eq(feeGroupModel.id, feeGroupPromotionMappingModel.feeGroupId),
      )
      .innerJoin(
        feeCategoryModel,
        eq(feeCategoryModel.id, feeGroupModel.feeCategoryId),
      )
      .innerJoin(feeSlabModel, eq(feeSlabModel.id, feeGroupModel.feeSlabId))
      .leftJoin(
        academicYearModel,
        eq(academicYearModel.id, sessionModel.academicYearId),
      )
      .leftJoin(
        personalDetailsModel,
        eq(personalDetailsModel.userId, studentModel.userId),
      )
      .leftJoin(
        religionModel,
        eq(religionModel.id, personalDetailsModel.religionId),
      )
      .leftJoin(
        categoryModel,
        eq(categoryModel.id, personalDetailsModel.categoryId),
      )
      .where(whereClause);

  const idRows = await db
    .select({ id: feeGroupPromotionMappingModel.id })
    .from(feeGroupPromotionMappingModel)
    .innerJoin(
      promotionModel,
      eq(promotionModel.id, feeGroupPromotionMappingModel.promotionId),
    )
    .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .innerJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
    .innerJoin(classModel, eq(classModel.id, promotionModel.classId))
    .innerJoin(shiftModel, eq(shiftModel.id, promotionModel.shiftId))
    .innerJoin(
      programCourseModel,
      eq(programCourseModel.id, promotionModel.programCourseId),
    )
    .innerJoin(
      feeGroupModel,
      eq(feeGroupModel.id, feeGroupPromotionMappingModel.feeGroupId),
    )
    .innerJoin(
      feeCategoryModel,
      eq(feeCategoryModel.id, feeGroupModel.feeCategoryId),
    )
    .innerJoin(feeSlabModel, eq(feeSlabModel.id, feeGroupModel.feeSlabId))
    .leftJoin(
      academicYearModel,
      eq(academicYearModel.id, sessionModel.academicYearId),
    )
    .leftJoin(
      personalDetailsModel,
      eq(personalDetailsModel.userId, studentModel.userId),
    )
    .leftJoin(
      religionModel,
      eq(religionModel.id, personalDetailsModel.religionId),
    )
    .leftJoin(
      categoryModel,
      eq(categoryModel.id, personalDetailsModel.categoryId),
    )
    .where(whereClause)
    // Mirrors the previous client-side sort: semester, then student name, then id.
    // `class.sequence` is nullable; the old client code fell back to parsing an
    // ordinal out of the class name. Ordering unsequenced classes last and then by
    // name keeps them grouped, but is not identical to that parse — classes with a
    // NULL sequence will appear in a different position than they used to.
    .orderBy(
      sql`${classModel.sequence} ASC NULLS LAST`,
      asc(classModel.name),
      asc(STUDENT_FULL_NAME_SQL),
      asc(feeGroupPromotionMappingModel.id),
    )
    .limit(limit)
    .offset(offset);

  // The count repeats the same joins and the same WHERE as the row query, so it costs
  // roughly as much again. When this page came back short, the page itself proves the
  // total (offset + what we got) and the second pass is pure waste — which is exactly
  // the narrow-search case, where one student is found and there is nothing to count.
  const isLastPage = idRows.length < limit;
  const countRows = isLastPage ? null : await runCountQuery();
  const total = isLastPage
    ? offset + idRows.length
    : Number(countRows?.[0]?.total ?? 0);

  const orderedIds = idRows
    .map((r) => r.id)
    .filter((id): id is number => id != null);

  if (orderedIds.length === 0) {
    return { rows: [], total, page, limit };
  }

  const unorderedRows = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .where(inArray(feeGroupPromotionMappingModel.id, orderedIds));

  // `inArray` does not preserve order — restore the sort the id query established.
  const rowById = new Map(unorderedRows.map((r) => [r.id, r]));
  const rows = orderedIds
    .map((id) => rowById.get(id))
    .filter((r): r is FeeGroupPromotionMappingRow => r != null);

  return {
    rows: await hydrateMappingRows(rows),
    total,
    page,
    limit,
  };
};

export const getFeeGroupPromotionMappingById = async (
  id: number,
): Promise<FeeGroupPromotionMappingDto | null> => {
  const [row] = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .where(eq(feeGroupPromotionMappingModel.id, id));

  return await modelToDto(row ?? null);
};

export const getFeeGroupPromotionMappingsByFeeGroupId = async (
  feeGroupId: number,
): Promise<FeeGroupPromotionMappingDto[]> => {
  const rows = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .where(eq(feeGroupPromotionMappingModel.feeGroupId, feeGroupId));

  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter((dto): dto is FeeGroupPromotionMappingDto => dto !== null);
};

export const getFeeGroupPromotionMappingsByPromotionId = async (
  promotionId: number,
): Promise<FeeGroupPromotionMappingDto[]> => {
  const rows = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .where(eq(feeGroupPromotionMappingModel.promotionId, promotionId));

  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter((dto): dto is FeeGroupPromotionMappingDto => dto !== null);
};

export const updateFeeGroupPromotionMapping = async (
  id: number,
  data: Partial<typeof createFeeGroupPromotionMappingSchema._type>,
  userId?: number,
): Promise<FeeGroupPromotionMappingDto | null> => {
  // Get the existing mapping to check if feeGroupId is being changed
  const [existing] = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .where(eq(feeGroupPromotionMappingModel.id, id));

  if (!existing) {
    return null;
  }

  const [updated] = await db
    .update(feeGroupPromotionMappingModel)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(feeGroupPromotionMappingModel.id, id))
    .returning();

  if (!updated) {
    return null;
  }

  // If feeGroupId was changed, recalculate totalPayable for all related fee-student-mappings
  const feeGroupChanged =
    data.feeGroupId !== undefined && data.feeGroupId !== existing.feeGroupId;

  if (feeGroupChanged) {
    // Do not block API response on potentially large recalculation.
    // Recalculation still runs, but in background.
    void recalculateFeeStudentMappingsForPromotionMapping(id, updated);
  }

  const dto = await modelToDto(updated);

  // Emit socket event for fee group promotion mapping update
  const io = socketService.getIO();
  if (io && dto && userId) {
    // Get user name for notification
    const user = await userService.findById(userId);
    const userName = user?.name || "Unknown User";

    io.emit("fee_group_promotion_mapping_updated", {
      mappingId: dto.id,
      type: "update",
      message: "A student fee group mapping has been updated",
      timestamp: new Date().toISOString(),
    });

    // Emit notification to all staff/admin users
    io.emit("notification", {
      id: `fee_group_promotion_mapping_updated_${dto.id}_${Date.now()}`,
      type: "update",
      userId: userId.toString(),
      userName,
      message: `updated student fee group mapping (ID: ${dto.id})`,
      createdAt: new Date(),
      read: false,
      meta: { mappingId: dto.id, type: "update" },
    });
  }

  return dto;
};

async function recalculateFeeStudentMappingsForPromotionMapping(
  mappingId: number,
  updatedMapping: typeof feeGroupPromotionMappingModel.$inferSelect,
): Promise<void> {
  console.log("in recalculateFeeStudentMappingsForPromotionMapping()");
  try {
    const [updatedFeeGroup] = await db
      .select({ feeSlabId: feeGroupModel.feeSlabId })
      .from(feeGroupModel)
      .where(eq(feeGroupModel.id, updatedMapping.feeGroupId));

    if (!updatedFeeGroup?.feeSlabId) {
      return;
    }

    const relatedFeeStudentMappings = await db
      .select({
        id: feeStudentMappingModel.id,
        feeStructureId: feeStudentMappingModel.feeStructureId,
        isWaivedOff: feeStudentMappingModel.isWaivedOff,
        waivedOffAmount: feeStudentMappingModel.waivedOffAmount,
      })
      .from(feeStudentMappingModel)
      .where(eq(feeStudentMappingModel.feeGroupPromotionMappingId, mappingId));

    if (relatedFeeStudentMappings.length === 0) {
      return;
    }

    const feeStructureIds = Array.from(
      new Set(relatedFeeStudentMappings.map((m) => m.feeStructureId)),
    );

    const relevantComponents =
      feeStructureIds.length > 0
        ? await db
            .select({
              feeStructureId: feeStructureComponentModel.feeStructureId,
              amount: feeStructureComponentModel.amount,
            })
            .from(feeStructureComponentModel)
            .where(
              and(
                inArray(
                  feeStructureComponentModel.feeStructureId,
                  feeStructureIds,
                ),
                eq(
                  feeStructureComponentModel.feeSlabId,
                  updatedFeeGroup.feeSlabId,
                ),
              ),
            )
        : [];

    const totalByFeeStructureId = new Map<number, number>();
    for (const component of relevantComponents) {
      totalByFeeStructureId.set(
        component.feeStructureId,
        (totalByFeeStructureId.get(component.feeStructureId) ?? 0) +
          (component.amount || 0),
      );
    }

    const chunkSize = 100;
    for (let i = 0; i < relatedFeeStudentMappings.length; i += chunkSize) {
      const chunk = relatedFeeStudentMappings.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (feeStudentMapping) => {
          const baseTotal = Math.round(
            totalByFeeStructureId.get(feeStudentMapping.feeStructureId) ?? 0,
          );
          const waivedOffAmount = feeStudentMapping.isWaivedOff
            ? feeStudentMapping.waivedOffAmount || 0
            : 0;
          const finalTotalPayable = Math.max(0, baseTotal - waivedOffAmount);

          await db
            .update(feeStudentMappingModel)
            .set({
              totalPayable: finalTotalPayable,
              // New slab / fee group -> challan format (e.g. category code) may differ; re-issue on next download
              receiptNumber: null,
              challanGeneratedAt: null,
              updatedAt: new Date(),
            })
            .where(eq(feeStudentMappingModel.id, feeStudentMapping.id!));
        }),
      );
    }

    // Re-emit update event once recalculation completes so clients refetch
    // and reflect latest payable amounts without manual page refresh.
    const refreshedMappings = await db
      .select({
        totalPayable: feeStudentMappingModel.totalPayable,
        amountPaid: feeStudentMappingModel.amountPaid,
        linkedPaymentStatus: paymentModel.status,
      })
      .from(feeStudentMappingModel)
      .leftJoin(
        paymentModel,
        and(
          eq(paymentModel.feeStudentMappingId, feeStudentMappingModel.id),
          eq(paymentModel.isLinked, true),
        ),
      )
      .where(eq(feeStudentMappingModel.feeGroupPromotionMappingId, mappingId));

    const slabTotals = await getFeeGroupTotalsForPromotion(
      updatedMapping.promotionId,
    );
    const expectedFromStructure =
      slabTotals.find((t) => t.feeGroupId === updatedMapping.feeGroupId)
        ?.totalPayable ?? 0;
    const totalPayableAmount = resolveMappingTotalPayableAmount(
      expectedFromStructure,
      refreshedMappings,
    );
    const amountToPay = resolveMappingAmountToPay(
      expectedFromStructure,
      refreshedMappings,
    );
    const hasSuccessfulPayment = refreshedMappings.some(
      (row) => row.linkedPaymentStatus === "SUCCESS",
    );
    const paymentStatus: "Paid" | "Pending" | "Unpaid" = hasSuccessfulPayment
      ? "Paid"
      : refreshedMappings.length === 0
        ? "Unpaid"
        : "Pending";
    const saveBlockedForEdit = hasSuccessfulPayment;

    scheduleFeesDashboardBroadcast("fee_group_promotion_mapping_updated");

    const io = socketService.getIO();
    if (io) {
      io.emit("fee_group_promotion_mapping_updated", {
        mappingId,
        type: "recalculation_completed",
        message:
          "Student fee mapping recalculation completed after fee-group update",
        timestamp: new Date().toISOString(),
        paymentStatus,
        amountToPay,
        totalPayableAmount,
        saveBlockedForEdit,
      });
    }
  } catch (error) {
    console.error(
      `Failed async fee-student recalculation for feeGroupPromotionMapping ${mappingId}:`,
      error,
    );
  }
}

export const deleteFeeGroupPromotionMapping = async (
  id: number,
  userId?: number,
): Promise<FeeGroupPromotionMappingDto | null> => {
  // Get the mapping before deletion for socket event
  // const [existing] = await db
  //   .select()
  //   .from(feeGroupPromotionMappingModel)
  //   .where(eq(feeGroupPromotionMappingModel.id, id));

  const [deleted] = await db
    .delete(feeGroupPromotionMappingModel)
    .where(eq(feeGroupPromotionMappingModel.id, id))
    .returning();

  const dto = await modelToDto(deleted ?? null);

  // Emit socket event for fee group promotion mapping deletion
  const io = socketService.getIO();
  if (io && dto) {
    // Get user name for notification if userId provided
    let userName = "Unknown User";
    if (userId) {
      const user = await userService.findById(userId);
      userName = user?.name || "Unknown User";
    }

    io.emit("fee_group_promotion_mapping_deleted", {
      mappingId: id,
      type: "deletion",
      message: "A student fee group mapping has been deleted",
      timestamp: new Date().toISOString(),
    });

    // Emit notification to all staff/admin users
    io.emit("notification", {
      id: `fee_group_promotion_mapping_deleted_${id}_${Date.now()}`,
      type: "update",
      userId: userId ? userId.toString() : undefined,
      userName,
      message: `deleted student fee group mapping (ID: ${id})`,
      createdAt: new Date(),
      read: false,
      meta: { mappingId: id, type: "deletion" },
    });
  }

  return dto;
};

export interface FeeGroupPromotionFilter {
  academicYearId?: number;
  programCourseId?: number;
  classId?: number;
  shiftId?: number;
  religionId?: number;
  categoryId?: number;
  community?: string;
  feeGroupId: number;
  page?: number;
}

export interface FilteredFeeGroupPromotionMapping {
  promotionId: number;
  studentId: number;
  feeGroupId: number;
  exists: boolean;
}

export const getFilteredFeeGroupPromotionMappings = async (
  filters: FeeGroupPromotionFilter,
): Promise<FilteredFeeGroupPromotionMapping[]> => {
  const conditions = [];

  if (filters.academicYearId) {
    conditions.push(eq(academicYearModel.id, filters.academicYearId));
  }
  if (filters.programCourseId) {
    conditions.push(
      eq(promotionModel.programCourseId, filters.programCourseId),
    );
  }
  if (filters.classId) {
    conditions.push(eq(promotionModel.classId, filters.classId));
  }
  if (filters.shiftId) {
    conditions.push(eq(promotionModel.shiftId, filters.shiftId));
  }
  if (filters.religionId) {
    conditions.push(eq(personalDetailsModel.religionId, filters.religionId));
  }
  if (filters.categoryId) {
    conditions.push(eq(personalDetailsModel.categoryId, filters.categoryId));
  }
  if (filters.community) {
    conditions.push(eq(studentModel.community, filters.community as any));
  }

  if (conditions.length === 0) {
    // Require at least one filter to avoid scanning entire promotions table
    return [];
  }

  conditions.push(activePromotionCondition());

  const baseQuery = db
    .select({
      promotionId: promotionModel.id,
      studentId: promotionModel.studentId,
    })
    .from(promotionModel)
    .innerJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
    .innerJoin(
      academicYearModel,
      eq(academicYearModel.id, sessionModel.academicYearId),
    )
    .innerJoin(classModel, eq(classModel.id, promotionModel.classId))
    .innerJoin(shiftModel, eq(shiftModel.id, promotionModel.shiftId))
    .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .leftJoin(
      personalDetailsModel,
      eq(personalDetailsModel.userId, studentModel.userId),
    )
    .where(and(...conditions))
    .limit(filters.page || 10);

  const promotionRows = await baseQuery;
  if (!promotionRows.length) {
    return [];
  }

  const promotionIds = promotionRows.map((row) => row.promotionId);

  const mappings = await db
    .select()
    .from(feeGroupPromotionMappingModel)
    .where(
      and(
        inArray(feeGroupPromotionMappingModel.promotionId, promotionIds),
        eq(feeGroupPromotionMappingModel.feeGroupId, filters.feeGroupId),
      ),
    );

  const mappingByPromotionId = new Map<
    number,
    typeof feeGroupPromotionMappingModel.$inferSelect
  >();
  for (const row of mappings) {
    mappingByPromotionId.set(row.promotionId, row);
  }

  return promotionRows.map((row) => ({
    promotionId: row.promotionId,
    studentId: row.studentId,
    feeGroupId: filters.feeGroupId,
    exists: mappingByPromotionId.has(row.promotionId),
  }));
};

/**
 * Calculate total payable amount for fee-student-mapping based on:
 * - Fee structure base amount
 * - Fee structure components (fee heads with percentages)
 * - Fee group's fee slab
 * - Fee structure slab's concession rate
 */
async function calculateTotalPayable(
  feeStructureId: number,
  feeGroupPromotionMapping: typeof feeGroupPromotionMappingModel.$inferSelect,
): Promise<number> {
  // Import the main calculation function
  const { calculateTotalPayableForFeeStudentMapping } =
    await import("./fee-structure.service.js");

  return await calculateTotalPayableForFeeStudentMapping(
    feeStructureId,
    feeGroupPromotionMapping,
  );
}

export interface BulkUploadRow {
  UID?: string;
  "Student Name"?: string;
  "Program Course Name"?: string;
  "Academic Year"?: string;
  Semester?: string;
  Shift?: string;
  "Fee Slab"?: string;
  "Fee Category"?: string;
  "Approved By User Email"?: string;
  "Approved Timestamp"?: string;
  Remarks?: string;
}

export interface BulkUploadResult {
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  errors: Array<{
    row: number;
    data: BulkUploadRow;
    error: string;
  }>;
  success: Array<{
    row: number;
    data: BulkUploadRow;
    mappingId: number;
  }>;
}

function getRowVal(row: Record<string, unknown>, key: string): string {
  const entry = Object.entries(row).find(
    ([k]) => k.trim().toLowerCase() === key.toLowerCase(),
  );
  return (entry?.[1] ?? "").toString().trim();
}

/**
 * Bulk upload fee group promotion mappings from Excel file
 * Excel format: UID, Student Name, Program Course Name, Academic Year, Semester, Shift,
 * Fee Slab, Fee Category, Approved By User Email, Approved Timestamp, Remarks (optional)
 */
export const bulkUploadFeeGroupPromotionMappings = async (
  filePath: string,
  userId: number,
  _uploadSessionId?: string,
): Promise<BulkUploadResult> => {
  const progressUserId = userId.toString();
  const result: BulkUploadResult = {
    summary: { total: 0, successful: 0, failed: 0 },
    errors: [],
    success: [],
  };

  const emitProgress = (
    message: string,
    progress: number,
    status: "started" | "in_progress" | "completed" | "error",
    meta?: Record<string, unknown>,
  ) => {
    const update = socketService.createExportProgressUpdate(
      progressUserId,
      message,
      progress,
      status,
      undefined,
      undefined,
      undefined,
      {
        operation: "fee_group_promotion_bulk_upload",
        ...meta,
      },
    );
    socketService.sendProgressUpdate(progressUserId, update);
  };

  try {
    emitProgress("Reading Excel file...", 0, "started");

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0] ?? "Sheet1";
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      emitProgress("Failed to read worksheet", 100, "error");
      throw new Error("Failed to read worksheet from Excel file");
    }

    const rawData =
      XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
    result.summary.total = rawData.length;

    if (rawData.length === 0) {
      emitProgress("Excel file is empty", 100, "error");
      return result;
    }

    emitProgress("Loading lookup data...", 5, "in_progress");

    // Pre-load lookup data
    const [
      allFeeCategories,
      allFeeSlabs,
      allFeeGroups,
      allProgramCourses,
      allClasses,
      allShifts,
      allAcademicYears,
    ] = await Promise.all([
      db.select().from(feeCategoryModel),
      db.select().from(feeSlabModel),
      db.select().from(feeGroupModel),
      db.select().from(programCourseModel),
      db.select().from(classModel).where(eq(classModel.type, "SEMESTER")),
      db.select().from(shiftModel),
      db.select().from(academicYearModel),
    ]);

    const feeCategoryMap = new Map<string, number>();
    allFeeCategories.forEach((fc) => {
      if (fc.name) feeCategoryMap.set(fc.name.toLowerCase().trim(), fc.id!);
    });
    const feeSlabMap = new Map<string, number>();
    allFeeSlabs.forEach((fs) => {
      if (fs.name) feeSlabMap.set(fs.name.toLowerCase().trim(), fs.id!);
    });
    const feeGroupMap = new Map<string, number>();
    allFeeGroups.forEach((fg) => {
      if (fg.feeCategoryId && fg.feeSlabId && fg.id) {
        feeGroupMap.set(`${fg.feeCategoryId}:${fg.feeSlabId}`, fg.id);
      }
    });
    const programCourseMap = new Map<string, number>();
    allProgramCourses.forEach((pc) => {
      if (pc.name) programCourseMap.set(pc.name.toLowerCase().trim(), pc.id!);
    });
    const classMap = new Map<string, number>();
    allClasses.forEach((c) => {
      if (c.name) classMap.set(c.name.toLowerCase().trim(), c.id!);
    });
    const shiftMap = new Map<string, number>();
    allShifts.forEach((s) => {
      if (s.name) shiftMap.set(s.name.toLowerCase().trim(), s.id!);
    });
    const academicYearMap = new Map<string, number>();
    allAcademicYears.forEach((ay) => {
      const key = ay.year?.toString().toLowerCase().trim();
      if (key) academicYearMap.set(key, ay.id!);
    });

    emitProgress("Validating rows...", 10, "in_progress");

    for (let i = 0; i < rawData.length; i++) {
      const pct = 10 + Math.round((i / rawData.length) * 85);
      if (i % 10 === 0 || i === rawData.length - 1) {
        emitProgress(
          `Processing row ${i + 1} of ${rawData.length}...`,
          pct,
          "in_progress",
          {
            processed: i,
            total: rawData.length,
          },
        );
      }

      const row = rawData[i];
      const rowNumber = i + 2;

      const uid = getRowVal(row, "UID");
      const programCourseName = getRowVal(row, "Program Course Name");
      const academicYear = getRowVal(row, "Academic Year");
      const semester = getRowVal(row, "Semester");
      const shift = getRowVal(row, "Shift");
      const feeSlabName = getRowVal(row, "Fee Slab");
      const feeCategoryName = getRowVal(row, "Fee Category");
      const approvedByEmail = getRowVal(row, "Approved By User Email");

      const rowData: BulkUploadRow = {
        UID: uid,
        "Student Name": getRowVal(row, "Student Name"),
        "Program Course Name": programCourseName,
        "Academic Year": academicYear,
        Semester: semester,
        Shift: shift,
        "Fee Slab": feeSlabName,
        "Fee Category": feeCategoryName,
        "Approved By User Email": approvedByEmail,
        "Approved Timestamp": getRowVal(row, "Approved Timestamp"),
        Remarks: getRowVal(row, "Remarks"),
      };

      if (
        !uid ||
        !programCourseName ||
        !academicYear ||
        !semester ||
        !shift ||
        !feeSlabName ||
        !feeCategoryName ||
        !approvedByEmail
      ) {
        const missing = [];
        if (!uid) missing.push("UID");
        if (!programCourseName) missing.push("Program Course Name");
        if (!academicYear) missing.push("Academic Year");
        if (!semester) missing.push("Semester");
        if (!shift) missing.push("Shift");
        if (!feeSlabName) missing.push("Fee Slab");
        if (!feeCategoryName) missing.push("Fee Category");
        if (!approvedByEmail) missing.push("Approved By User Email");
        result.errors.push({
          row: rowNumber,
          data: rowData,
          error: `Missing required fields: ${missing.join(", ")}`,
        });
        result.summary.failed++;
        continue;
      }

      try {
        // (b) Fee slab and fee category exist
        const feeSlabId = feeSlabMap.get(feeSlabName.toLowerCase());
        const feeCategoryId = feeCategoryMap.get(feeCategoryName.toLowerCase());
        if (!feeSlabId) {
          result.errors.push({
            row: rowNumber,
            data: rowData,
            error: `Fee slab "${feeSlabName}" not found`,
          });
          result.summary.failed++;
          continue;
        }
        if (!feeCategoryId) {
          result.errors.push({
            row: rowNumber,
            data: rowData,
            error: `Fee category "${feeCategoryName}" not found`,
          });
          result.summary.failed++;
          continue;
        }

        // (c) Fee slab + fee category combination exists in fee_groups
        const feeGroupId = feeGroupMap.get(`${feeCategoryId}:${feeSlabId}`);
        if (!feeGroupId) {
          result.errors.push({
            row: rowNumber,
            data: rowData,
            error: `No fee group found for fee slab "${feeSlabName}" and fee category "${feeCategoryName}"`,
          });
          result.summary.failed++;
          continue;
        }

        // (e) User exists for approval email
        const approvedByUser = await userService.findByEmail(approvedByEmail);
        if (!approvedByUser || !approvedByUser.id) {
          result.errors.push({
            row: rowNumber,
            data: rowData,
            error: `User with email "${approvedByEmail}" not found`,
          });
          result.summary.failed++;
          continue;
        }

        // (a) Student with uid + program course + semester + shift + academic year exists
        const programCourseId = programCourseMap.get(
          programCourseName.toLowerCase(),
        );
        const classId = classMap.get(semester.toLowerCase());
        const shiftId = shiftMap.get(shift.toLowerCase());
        const academicYearId = academicYearMap.get(academicYear.toLowerCase());

        if (!programCourseId || !classId || !shiftId || !academicYearId) {
          const missing = [];
          if (!programCourseId) missing.push("Program Course");
          if (!classId) missing.push("Semester");
          if (!shiftId) missing.push("Shift");
          if (!academicYearId) missing.push("Academic Year");
          result.errors.push({
            row: rowNumber,
            data: rowData,
            error: `Invalid lookup: ${missing.join(", ")} not found`,
          });
          result.summary.failed++;
          continue;
        }

        const student = await studentService.findByUid(uid);
        if (!student || !student.id) {
          result.errors.push({
            row: rowNumber,
            data: rowData,
            error: `Student with UID "${uid}" not found`,
          });
          result.summary.failed++;
          continue;
        }

        // (a) Promotion: student + program course + semester + shift + academic year
        const sessionsForYear = await db
          .select({ id: sessionModel.id })
          .from(sessionModel)
          .where(eq(sessionModel.academicYearId, academicYearId));
        const sessionIds = sessionsForYear.map((s) => s.id);
        if (sessionIds.length === 0) {
          result.errors.push({
            row: rowNumber,
            data: rowData,
            error: `No session found for academic year "${academicYear}"`,
          });
          result.summary.failed++;
          continue;
        }

        const [promotionRecord] = await db
          .select()
          .from(promotionModel)
          .where(
            and(
              eq(promotionModel.studentId, student.id),
              eq(promotionModel.programCourseId, programCourseId),
              eq(promotionModel.classId, classId),
              eq(promotionModel.shiftId, shiftId),
              inArray(promotionModel.sessionId, sessionIds),
              activePromotionCondition(),
            ),
          )
          .orderBy(desc(promotionModel.id))
          .limit(1);

        if (!promotionRecord || !promotionRecord.id) {
          result.errors.push({
            row: rowNumber,
            data: rowData,
            error: `No promotion found for student UID "${uid}" with program course "${programCourseName}", semester "${semester}", shift "${shift}", academic year "${academicYear}"`,
          });
          result.summary.failed++;
          continue;
        }

        // (d) Fee structure and fee structure component for fee slab exist
        const [matchingFs] = await db
          .select({ feeStructureId: feeStructureModel.id })
          .from(feeStructureModel)
          .innerJoin(
            feeStructureComponentModel,
            and(
              eq(
                feeStructureComponentModel.feeStructureId,
                feeStructureModel.id,
              ),
              eq(feeStructureComponentModel.feeSlabId, feeSlabId),
            ),
          )
          .where(
            and(
              eq(feeStructureModel.academicYearId, academicYearId),
              eq(feeStructureModel.programCourseId, programCourseId),
              eq(feeStructureModel.classId, classId),
              eq(feeStructureModel.shiftId, shiftId),
            ),
          )
          .limit(1);

        const feeStructureId = matchingFs?.feeStructureId;
        if (!feeStructureId) {
          result.errors.push({
            row: rowNumber,
            data: rowData,
            error: `No fee structure with fee slab "${feeSlabName}" found for academic year "${academicYear}", program course "${programCourseName}", semester "${semester}", shift "${shift}"`,
          });
          result.summary.failed++;
          continue;
        }

        // Create or get existing mapping
        const [existingMapping] = await db
          .select()
          .from(feeGroupPromotionMappingModel)
          .where(
            and(
              eq(feeGroupPromotionMappingModel.promotionId, promotionRecord.id),
              eq(feeGroupPromotionMappingModel.feeGroupId, feeGroupId),
            ),
          );

        let createdMappingId: number;
        if (existingMapping) {
          createdMappingId = existingMapping.id!;
          await db
            .update(feeGroupPromotionMappingModel)
            .set({
              updatedAt: new Date(),
              remarks: rowData.Remarks || existingMapping.remarks,
            })
            .where(eq(feeGroupPromotionMappingModel.id, existingMapping.id));
        } else {
          const [createdMapping] = await db
            .insert(feeGroupPromotionMappingModel)
            .values({
              feeGroupId,
              promotionId: promotionRecord.id,

              remarks: rowData.Remarks || null,
            })
            .returning();

          if (!createdMapping || !createdMapping.id) {
            result.errors.push({
              row: rowNumber,
              data: rowData,
              error: "Failed to create mapping",
            });
            result.summary.failed++;
            continue;
          }
          createdMappingId = createdMapping.id;
        }

        // Update fee-student-mapping
        const [selectedMappingFull] = await db
          .select()
          .from(feeGroupPromotionMappingModel)
          .where(eq(feeGroupPromotionMappingModel.id, createdMappingId));

        if (selectedMappingFull) {
          const totalPayable = await calculateTotalPayable(
            feeStructureId,
            selectedMappingFull,
          );
          const [existingFeeStudentMapping] = await db
            .select()
            .from(feeStudentMappingModel)
            .where(
              and(
                eq(feeStudentMappingModel.studentId, student.id),
                eq(feeStudentMappingModel.feeStructureId, feeStructureId),
              ),
            );

          if (existingFeeStudentMapping) {
            const promotionMappingChanged =
              existingFeeStudentMapping.feeGroupPromotionMappingId !==
              createdMappingId;
            await db
              .update(feeStudentMappingModel)
              .set({
                feeGroupPromotionMappingId: createdMappingId,
                totalPayable: Math.max(
                  0,
                  totalPayable -
                    (existingFeeStudentMapping.isWaivedOff
                      ? existingFeeStudentMapping.waivedOffAmount || 0
                      : 0),
                ),
                ...(promotionMappingChanged
                  ? { receiptNumber: null, challanGeneratedAt: null }
                  : {}),
                updatedAt: new Date(),
              })
              .where(
                eq(feeStudentMappingModel.id, existingFeeStudentMapping.id!),
              );
          } else {
            await db.insert(feeStudentMappingModel).values({
              studentId: student.id,
              feeStructureId,
              feeGroupPromotionMappingId: createdMappingId,
              totalPayable,
            });
          }
        }

        result.success.push({
          row: rowNumber,
          data: rowData,
          mappingId: createdMappingId,
        });
        result.summary.successful++;
      } catch (error) {
        result.errors.push({
          row: rowNumber,
          data: rowData,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error processing row",
        });
        result.summary.failed++;
      }
    }

    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.error("Failed to delete temporary file:", cleanupError);
    }

    const finalStatus = result.summary.failed > 0 ? "completed" : "completed";
    emitProgress(
      `Bulk upload completed: ${result.summary.successful} successful, ${result.summary.failed} failed`,
      100,
      finalStatus,
      {
        successful: result.summary.successful,
        failed: result.summary.failed,
      },
    );

    return result;
  } catch (error) {
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.error("Failed to delete temporary file:", cleanupError);
    }
    emitProgress(
      error instanceof Error ? error.message : "Bulk upload failed",
      100,
      "error",
    );
    throw error;
  }
};
