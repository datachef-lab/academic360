import { db } from "@/db";
import {
  feeCategoryPromotionMappingModel,
  createFeeCategoryPromotionMappingSchema,
  feeCategoryModel,
  promotionModel,
  boardResultStatusModel,
} from "@repo/db/schemas";
import { promotionStatusModel } from "@repo/db/schemas/models/batches";
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
import { and, inArray, or, ilike, desc, eq } from "drizzle-orm";
import { programCourseModel } from "@repo/db/schemas/models/course-design";
import {
  feeStructureModel,
  feeStructureConcessionSlabModel,
} from "@repo/db/schemas";
import XLSX from "xlsx";
import fs from "fs";
import * as studentService from "@/features/user/services/student.service.js";
import * as classService from "@/features/academics/services/class.service.js";
import { socketService } from "@/services/socketService.js";
import { feeStudentMappingModel } from "@repo/db/schemas";
import {
  FeeCategoryPromotionMappingDto,
  FeeCategoryDto,
} from "@repo/db/dtos/fees";
import { PromotionDto } from "@repo/db/dtos/user";
import {
  religionModel,
  categoryModel,
} from "@repo/db/schemas/models/resources";
import * as programCourseService from "@/features/course-design/services/program-course.service.js";
import * as feeCategoryService from "./fee-category.service.js";

/**
 * Converts a Promotion model to PromotionDto
 */
async function promotionToDto(
  promotion: typeof promotionModel.$inferSelect | null,
): Promise<PromotionDto | null> {
  if (!promotion) return null;

  const [
    promStatus,
    boardResStatus,
    sess,
    cls,
    sec,
    shf,
    progCourse,
    studentWithDetails,
  ] = await Promise.all([
    db
      .select()
      .from(promotionStatusModel)
      .where(eq(promotionStatusModel.id, promotion.promotionStatusId))
      .then((r) => r[0] ?? null),
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
  if (!promStatus || !sess || !cls || !shf || !progCourse) {
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
    promotionStatus: promStatus,
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

/**
 * Converts a FeeCategoryPromotionMapping model to FeeCategoryPromotionMappingDto
 */
async function modelToDto(
  model: typeof feeCategoryPromotionMappingModel.$inferSelect | null,
): Promise<FeeCategoryPromotionMappingDto | null> {
  if (!model) return null;

  const [feeCategory, promotion] = await Promise.all([
    feeCategoryService.getFeeCategoryById(model.feeCategoryId),
    db
      .select()
      .from(promotionModel)
      .where(eq(promotionModel.id, model.promotionId))
      .then((r) => r[0] ?? null),
  ]);

  if (!feeCategory || !promotion) {
    return null;
  }

  const promotionDto = await promotionToDto(promotion);
  if (!promotionDto) {
    return null;
  }

  return {
    ...model,
    feeCategory,
    promotion: promotionDto,
  };
}

/**
 * Services should accept validated DTOs (controller validates via zod) and
 * return raw rows / arrays / null. Do not catch errors here — controller will handle them.
 */
export const createFeeCategoryPromotionMapping = async (
  data: Omit<
    typeof createFeeCategoryPromotionMappingSchema._type,
    "id" | "createdAt" | "updatedAt" | "createdByUserId" | "updatedByUserId"
  >,
  userId: number,
): Promise<FeeCategoryPromotionMappingDto> => {
  const [created] = await db
    .insert(feeCategoryPromotionMappingModel)
    .values({
      ...data,
      createdByUserId: userId,
      updatedByUserId: userId,
    })
    .returning();

  const dto = await modelToDto(created);
  return dto!;
};

export const getAllFeeCategoryPromotionMappings = async (): Promise<
  FeeCategoryPromotionMappingDto[]
> => {
  const rows = await db.select().from(feeCategoryPromotionMappingModel);
  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter(
    (dto): dto is FeeCategoryPromotionMappingDto => dto !== null,
  );
};

export const getFeeCategoryPromotionMappingById = async (
  id: number,
): Promise<FeeCategoryPromotionMappingDto | null> => {
  const [row] = await db
    .select()
    .from(feeCategoryPromotionMappingModel)
    .where(eq(feeCategoryPromotionMappingModel.id, id));

  return await modelToDto(row ?? null);
};

export const getFeeCategoryPromotionMappingsByFeeCategoryId = async (
  feeCategoryId: number,
): Promise<FeeCategoryPromotionMappingDto[]> => {
  const rows = await db
    .select()
    .from(feeCategoryPromotionMappingModel)
    .where(eq(feeCategoryPromotionMappingModel.feeCategoryId, feeCategoryId));

  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter(
    (dto): dto is FeeCategoryPromotionMappingDto => dto !== null,
  );
};

export const getFeeCategoryPromotionMappingsByPromotionId = async (
  promotionId: number,
): Promise<FeeCategoryPromotionMappingDto[]> => {
  const rows = await db
    .select()
    .from(feeCategoryPromotionMappingModel)
    .where(eq(feeCategoryPromotionMappingModel.promotionId, promotionId));

  const dtos = await Promise.all(rows.map((row) => modelToDto(row)));
  return dtos.filter(
    (dto): dto is FeeCategoryPromotionMappingDto => dto !== null,
  );
};

export const updateFeeCategoryPromotionMapping = async (
  id: number,
  data: Partial<typeof createFeeCategoryPromotionMappingSchema._type>,
  userId: number,
): Promise<FeeCategoryPromotionMappingDto | null> => {
  // Get the existing mapping to check if feeCategoryId is being changed
  const [existing] = await db
    .select()
    .from(feeCategoryPromotionMappingModel)
    .where(eq(feeCategoryPromotionMappingModel.id, id));

  if (!existing) {
    return null;
  }

  const [updated] = await db
    .update(feeCategoryPromotionMappingModel)
    .set({
      ...data,
      updatedAt: new Date(),
      updatedByUserId: userId,
    })
    .where(eq(feeCategoryPromotionMappingModel.id, id))
    .returning();

  if (!updated) {
    return null;
  }

  // If feeCategoryId was changed, recalculate totalPayable for all related fee-student-mappings
  const feeCategoryChanged =
    data.feeCategoryId !== undefined &&
    data.feeCategoryId !== existing.feeCategoryId;

  if (feeCategoryChanged) {
    // Import the calculateTotalPayableForFeeStudentMapping function from fee-structure service
    const { calculateTotalPayableForFeeStudentMapping } =
      await import("./fee-structure.service.js");

    // Find all fee-student-mappings that use this fee-category-promotion-mapping
    const relatedFeeStudentMappings = await db
      .select()
      .from(feeStudentMappingModel)
      .where(eq(feeStudentMappingModel.feeCategoryPromotionMappingId, id));

    // Update each fee-student-mapping with recalculated totalPayable
    for (const feeStudentMapping of relatedFeeStudentMappings) {
      const newTotalPayable = await calculateTotalPayableForFeeStudentMapping(
        feeStudentMapping.feeStructureId,
        updated.feeCategoryId,
      );

      // Recalculate final totalPayable accounting for waived off amount
      const waivedOffAmount = feeStudentMapping.isWaivedOff
        ? feeStudentMapping.waivedOffAmount || 0
        : 0;
      const finalTotalPayable = Math.max(0, newTotalPayable - waivedOffAmount);

      await db
        .update(feeStudentMappingModel)
        .set({
          totalPayable: finalTotalPayable,
          updatedAt: new Date(),
        })
        .where(eq(feeStudentMappingModel.id, feeStudentMapping.id!));
    }
  }

  return await modelToDto(updated);
};

export const deleteFeeCategoryPromotionMapping = async (
  id: number,
): Promise<FeeCategoryPromotionMappingDto | null> => {
  const [deleted] = await db
    .delete(feeCategoryPromotionMappingModel)
    .where(eq(feeCategoryPromotionMappingModel.id, id))
    .returning();

  return await modelToDto(deleted ?? null);
};

export interface FeeCategoryPromotionFilter {
  academicYearId?: number;
  programCourseId?: number;
  classId?: number;
  shiftId?: number;
  religionId?: number;
  categoryId?: number;
  community?: string;
  feeCategoryId: number;
}

export interface FilteredFeeCategoryPromotionMapping {
  promotionId: number;
  studentId: number;
  feeCategoryId: number;
  exists: boolean;
}

export const getFilteredFeeCategoryPromotionMappings = async (
  filters: FeeCategoryPromotionFilter,
): Promise<FilteredFeeCategoryPromotionMapping[]> => {
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
    .where(and(...conditions));

  const promotionRows = await baseQuery;
  if (!promotionRows.length) {
    return [];
  }

  const promotionIds = promotionRows.map((row) => row.promotionId);

  const mappings = await db
    .select()
    .from(feeCategoryPromotionMappingModel)
    .where(
      and(
        inArray(feeCategoryPromotionMappingModel.promotionId, promotionIds),
        eq(
          feeCategoryPromotionMappingModel.feeCategoryId,
          filters.feeCategoryId,
        ),
      ),
    );

  const mappingByPromotionId = new Map<
    number,
    typeof feeCategoryPromotionMappingModel.$inferSelect
  >();
  for (const row of mappings) {
    mappingByPromotionId.set(row.promotionId, row);
  }

  return promotionRows.map((row) => ({
    promotionId: row.promotionId,
    studentId: row.studentId,
    feeCategoryId: filters.feeCategoryId,
    exists: mappingByPromotionId.has(row.promotionId),
  }));
};

/**
 * Calculate total payable amount for fee-student-mapping based on:
 * - Fee structure base amount
 * - Fee category's concession slab
 * - Fee structure concession slab's concession rate
 */
async function calculateTotalPayable(
  feeStructureId: number,
  feeCategoryId: number,
): Promise<number> {
  // Get fee structure
  const [feeStructure] = await db
    .select()
    .from(feeStructureModel)
    .where(eq(feeStructureModel.id, feeStructureId));

  if (!feeStructure || !feeStructure.baseAmount) {
    return 0;
  }

  // Get fee category to get feeConcessionSlabId
  const [feeCategory] = await db
    .select()
    .from(feeCategoryModel)
    .where(eq(feeCategoryModel.id, feeCategoryId));

  if (!feeCategory || !feeCategory.feeConcessionSlabId) {
    // If no concession slab, return base amount
    return Math.round(feeStructure.baseAmount);
  }

  // Get fee structure concession slab for this fee structure and concession slab
  const [feeStructureConcessionSlab] = await db
    .select()
    .from(feeStructureConcessionSlabModel)
    .where(
      and(
        eq(feeStructureConcessionSlabModel.feeStructureId, feeStructureId),
        eq(
          feeStructureConcessionSlabModel.feeConcessionSlabId,
          feeCategory.feeConcessionSlabId,
        ),
      ),
    );

  if (
    !feeStructureConcessionSlab ||
    !feeStructureConcessionSlab.concessionRate
  ) {
    // If no concession slab mapping found, return base amount
    return Math.round(feeStructure.baseAmount);
  }

  // Calculate total payable: baseAmount - (baseAmount * concessionRate / 100)
  const concessionAmount =
    (feeStructure.baseAmount * feeStructureConcessionSlab.concessionRate) / 100;
  const totalPayable = feeStructure.baseAmount - concessionAmount;

  return Math.round(totalPayable);
}

export interface BulkUploadRow {
  UID: string;
  Semester: string;
  "Fee Category Name": string;
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

/**
 * Bulk upload fee category promotion mappings from Excel file
 * Excel format: UID, Semester, Fee Category Name
 */
export const bulkUploadFeeCategoryPromotionMappings = async (
  filePath: string,
  userId: number,
  uploadSessionId?: string,
): Promise<BulkUploadResult> => {
  const io = socketService.getIO();
  const result: BulkUploadResult = {
    summary: { total: 0, successful: 0, failed: 0 },
    errors: [],
    success: [],
  };

  try {
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<BulkUploadRow>(worksheet);

    result.summary.total = data.length;

    // Get all fee categories once for lookup (with priority)
    const allFeeCategories = await db.select().from(feeCategoryModel);
    const feeCategoryMap = new Map<string, { id: number; priority: number }>();
    allFeeCategories.forEach((fc) => {
      if (fc.name) {
        feeCategoryMap.set(fc.name.toLowerCase().trim(), {
          id: fc.id!,
          priority: fc.priority,
        });
      }
    });

    // Process each row
    for (let i = 0; i < data.length; i++) {
      // Emit progress update
      if (io && uploadSessionId) {
        io.to(uploadSessionId).emit("bulk-upload-progress", {
          processed: i,
          total: data.length,
          percent: Math.round((i / data.length) * 100),
        });
      }
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel is 1-indexed and we skip header

      try {
        // Validate required fields
        const uid = row.UID?.toString()?.trim();
        const semester = row.Semester?.toString()?.trim();
        const feeCategoryName = row["Fee Category Name"]?.toString()?.trim();

        if (!uid || !semester || !feeCategoryName) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error:
              "UID, Semester, and Fee Category Name are required (no blanks allowed)",
          });
          result.summary.failed++;
          continue;
        }

        // Verify fee category exists
        const feeCategoryInfo = feeCategoryMap.get(
          feeCategoryName.toLowerCase(),
        );
        if (!feeCategoryInfo) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: `Fee category "${feeCategoryName}" not found`,
          });
          result.summary.failed++;
          continue;
        }
        const feeCategoryId = feeCategoryInfo.id;

        // Get student by UID
        const student = await studentService.findByUid(uid);
        if (!student || !student.id) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: `Student with UID "${uid}" not found`,
          });
          result.summary.failed++;
          continue;
        }

        // Get class by semester name
        const [foundClass] = await db
          .select()
          .from(classModel)
          .where(
            and(eq(classModel.name, semester), eq(classModel.type, "SEMESTER")),
          );

        if (!foundClass || !foundClass.id) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: `Class/Semester "${semester}" not found`,
          });
          result.summary.failed++;
          continue;
        }

        // Get promotion by studentId and classId
        const [promotion] = await db
          .select()
          .from(promotionModel)
          .where(
            and(
              eq(promotionModel.studentId, student.id),
              eq(promotionModel.classId, foundClass.id),
            ),
          )
          .orderBy(desc(promotionModel.id))
          .limit(1);

        if (!promotion || !promotion.id) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: `No promotion found for student UID "${uid}" in semester "${semester}"`,
          });
          result.summary.failed++;
          continue;
        }

        // Check if mapping already exists - if it does, skip creating but still update fee-student-mapping
        const [existingMapping] = await db
          .select()
          .from(feeCategoryPromotionMappingModel)
          .where(
            and(
              eq(feeCategoryPromotionMappingModel.promotionId, promotion.id),
              eq(feeCategoryPromotionMappingModel.feeCategoryId, feeCategoryId),
            ),
          );

        let createdMappingId: number;
        if (existingMapping) {
          // Mapping already exists, skip creating but use existing ID for fee-student-mapping update
          createdMappingId = existingMapping.id!;
          // Don't add to errors, just skip creating
        } else {
          // Create fee-category-promotion-mapping
          const [createdMapping] = await db
            .insert(feeCategoryPromotionMappingModel)
            .values({
              feeCategoryId,
              promotionId: promotion.id,
              createdByUserId: userId,
              updatedByUserId: userId,
            })
            .returning();

          if (!createdMapping || !createdMapping.id) {
            result.errors.push({
              row: rowNumber,
              data: row,
              error: "Failed to create mapping",
            });
            result.summary.failed++;
            continue;
          }

          createdMappingId = createdMapping.id;
        }

        // After creating/checking fee-category-promotion-mapping, update fee-student-mapping
        // Get all fee-category-promotion-mappings for this promotion ID
        const allMappingsForPromotion = await db
          .select({
            id: feeCategoryPromotionMappingModel.id,
            feeCategoryId: feeCategoryPromotionMappingModel.feeCategoryId,
          })
          .from(feeCategoryPromotionMappingModel)
          .where(
            eq(feeCategoryPromotionMappingModel.promotionId, promotion.id),
          );

        if (allMappingsForPromotion.length > 0) {
          // Get fee categories with priorities for these mappings
          const feeCategoryIds = allMappingsForPromotion.map(
            (m) => m.feeCategoryId,
          );
          const feeCategoriesForMappings = await db
            .select({
              id: feeCategoryModel.id,
              priority: feeCategoryModel.priority,
            })
            .from(feeCategoryModel)
            .where(inArray(feeCategoryModel.id, feeCategoryIds));

          // Create a map of fee category ID to priority
          const priorityMap = new Map<number, number>();
          feeCategoriesForMappings.forEach((fc) => {
            priorityMap.set(fc.id!, fc.priority);
          });

          // Select mapping with highest priority (lowest priority number = highest priority)
          const selectedMapping = allMappingsForPromotion.reduce(
            (prev, curr) => {
              const prevPriority =
                priorityMap.get(prev.feeCategoryId) ?? Infinity;
              const currPriority =
                priorityMap.get(curr.feeCategoryId) ?? Infinity;
              return currPriority < prevPriority ? curr : prev;
            },
          );

          // Get promotion's session to get academic year for matching fee structures
          const [promotionSession] = await db
            .select()
            .from(sessionModel)
            .where(eq(sessionModel.id, promotion.sessionId));

          if (
            promotionSession &&
            promotionSession.academicYearId !== null &&
            promotionSession.academicYearId !== undefined
          ) {
            // Find fee structures that match this promotion's context
            const matchingFeeStructures = await db
              .select()
              .from(feeStructureModel)
              .where(
                and(
                  eq(
                    feeStructureModel.academicYearId,
                    promotionSession.academicYearId!,
                  ),
                  eq(feeStructureModel.classId, promotion.classId),
                  eq(
                    feeStructureModel.programCourseId,
                    promotion.programCourseId,
                  ),
                  eq(feeStructureModel.shiftId, promotion.shiftId),
                ),
              );

            // Get the fee category for the selected mapping to calculate totalPayable
            const [selectedMappingFull] = await db
              .select()
              .from(feeCategoryPromotionMappingModel)
              .where(
                eq(feeCategoryPromotionMappingModel.id, selectedMapping.id),
              );

            if (selectedMappingFull) {
              // Update or create fee-student-mapping for each matching fee structure
              for (const feeStructure of matchingFeeStructures) {
                // Calculate total payable based on concession rate
                const totalPayable = await calculateTotalPayable(
                  feeStructure.id!,
                  selectedMappingFull.feeCategoryId,
                );

                // Check if fee-student-mapping already exists for this combination
                const [existingFeeStudentMapping] = await db
                  .select()
                  .from(feeStudentMappingModel)
                  .where(
                    and(
                      eq(feeStudentMappingModel.studentId, student.id),
                      eq(
                        feeStudentMappingModel.feeStructureId,
                        feeStructure.id!,
                      ),
                    ),
                  );

                if (existingFeeStudentMapping) {
                  // Update existing mapping
                  await db
                    .update(feeStudentMappingModel)
                    .set({
                      feeCategoryPromotionMappingId: selectedMapping.id,
                      totalPayable,
                      updatedAt: new Date(),
                    })
                    .where(
                      eq(
                        feeStudentMappingModel.id,
                        existingFeeStudentMapping.id!,
                      ),
                    );
                } else {
                  // Create new fee-student-mapping
                  await db.insert(feeStudentMappingModel).values({
                    studentId: student.id,
                    feeStructureId: feeStructure.id!,
                    feeCategoryPromotionMappingId: selectedMapping.id,
                    totalPayable,
                  });
                }
              }
            }
          }
        }

        result.success.push({
          row: rowNumber,
          data: row,
          mappingId: createdMappingId,
        });
        result.summary.successful++;
      } catch (error) {
        result.errors.push({
          row: rowNumber,
          data: row,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error processing row",
        });
        result.summary.failed++;
      }
    }

    // Clean up file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.error("Failed to delete temporary file:", cleanupError);
    }

    // Emit completion
    if (io && uploadSessionId) {
      if (result.summary.failed > 0) {
        io.to(uploadSessionId).emit("bulk-upload-failed", {
          errorCount: result.summary.failed,
          successCount: result.summary.successful,
        });
      } else {
        io.to(uploadSessionId).emit("bulk-upload-done", {
          successCount: result.summary.successful,
        });
      }
    }

    return result;
  } catch (error) {
    // Clean up file on error
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.error("Failed to delete temporary file:", cleanupError);
    }

    throw error;
  }
};
