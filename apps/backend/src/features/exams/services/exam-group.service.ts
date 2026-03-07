import { db } from "@/db";
import { PaginatedResponse } from "@/utils/PaginatedResponse";
import { ExamGroupDto } from "@repo/db/dtos";
import {
  examCandidateModel,
  examGroupModel,
  examModel,
  examProgramCourseModel,
  examRoomModel,
  examShiftModel,
  examSubjectModel,
  examSubjectTypeModel,
  paperModel,
  promotionModel,
  studentModel,
} from "@repo/db/schemas";
import {
  paperComponentModel,
  examComponentModel,
} from "@repo/db/schemas/models/course-design";
import { and, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import * as examScheduleService from "./exam-schedule.service";
import { socketService } from "@/services/socketService";

export interface ExamGroupFilters {
  dateFrom?: string | null;
  dateTo?: string | null;
  academicYearId?: number | null;
}

function normalizeExamGroupName(name: string): string {
  return (name || "").trim().replace(/\s+/g, " ");
}

function normalizeExamCommencementDate(date: unknown): string {
  if (date instanceof Date) return date.toISOString().slice(0, 10);
  return String(date ?? "").slice(0, 10);
}

export async function findByName(name: string) {
  const normalizedName = normalizeExamGroupName(name);

  if (!normalizedName) return null;

  const [existing] = await db
    .select()
    .from(examGroupModel)
    .where(sql`LOWER(${examGroupModel.name}) = ${normalizedName.toLowerCase()}`)
    .limit(1);

  return existing ?? null;
}

/** Find exam group by name + commencement date (both required). Used for uniqueness validation. */
export async function findByNameAndCommencementDate(
  name: string,
  examCommencementDate: string,
) {
  const normalizedName = normalizeExamGroupName(name);
  const normalizedDate = normalizeExamCommencementDate(examCommencementDate);

  if (!normalizedName || !normalizedDate) return null;

  const [existing] = await db
    .select()
    .from(examGroupModel)
    .where(
      and(
        sql`LOWER(${examGroupModel.name}) = ${normalizedName.toLowerCase()}`,
        eq(examGroupModel.examCommencementDate, normalizedDate),
      ),
    )
    .limit(1);

  return existing ?? null;
}

export async function findAll(
  page: number = 1,
  pageSize: number = 10,
  filters?: ExamGroupFilters,
): Promise<PaginatedResponse<ExamGroupDto>> {
  pageSize = pageSize > 0 ? pageSize : 10;
  const offset = (page - 1) * pageSize;

  // Build where conditions for examCommencementDate filter
  const whereConditions = [];
  if (filters?.dateFrom && filters?.dateTo) {
    whereConditions.push(
      and(
        gte(examGroupModel.examCommencementDate, filters.dateFrom),
        lte(examGroupModel.examCommencementDate, filters.dateTo),
      )!,
    );
  } else if (filters?.dateFrom) {
    whereConditions.push(
      gte(examGroupModel.examCommencementDate, filters.dateFrom),
    );
  } else if (filters?.dateTo) {
    whereConditions.push(
      lte(examGroupModel.examCommencementDate, filters.dateTo),
    );
  }

  const whereClause =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // 1️⃣ Get total count with filters
  const [{ totalExamGroups }] = await db
    .select({ totalExamGroups: count() })
    .from(examGroupModel)
    .where(whereClause);

  const totalPages = Math.ceil(Number(totalExamGroups) / pageSize);

  // 2️⃣ Get paginated exam groups with filters
  const examGroups = await db
    .select()
    .from(examGroupModel)
    .where(whereClause)
    .limit(pageSize)
    .offset(offset)
    .orderBy(desc(examGroupModel.examCommencementDate));

  if (examGroups.length === 0) {
    return {
      page,
      pageSize,
      totalElements: Number(totalExamGroups),
      totalPages,
      content: [],
    };
  }

  // 3️⃣ Collect group IDs
  const groupIds = examGroups.map((g) => g.id);

  // 4️⃣ Fetch ALL exams in one query
  const examsResult = await db
    .select()
    .from(examModel)
    .where(inArray(examModel.examGroupId, groupIds));

  // 5️⃣ Convert exams to DTOs
  const examDtos = (
    await Promise.all(
      examsResult.map(async (exam) => examScheduleService.modelToDto(exam)),
    )
  ).filter((exam): exam is NonNullable<typeof exam> => exam !== null);

  // 6️⃣ Group exams by examGroupId
  const examsByGroup = new Map<number, typeof examDtos>();

  for (const exam of examDtos) {
    if (!exam.examGroupId) continue; // Just in case, should not happen

    if (!examsByGroup.has(exam.examGroupId)) {
      examsByGroup.set(exam.examGroupId, []);
    }
    examsByGroup.get(exam.examGroupId)!.push(exam);
  }

  // 7️⃣ Build final DTO
  const examGroupDtos: ExamGroupDto[] = examGroups.map((group) => ({
    ...group,
    exams: examsByGroup.get(group.id) ?? [],
  }));

  return {
    page,
    pageSize,
    totalElements: Number(totalExamGroups),
    totalPages,
    content: examGroupDtos,
  };
}

export async function findById(id: number): Promise<ExamGroupDto | null> {
  const [examGroup] = await db
    .select()
    .from(examGroupModel)
    .where(eq(examGroupModel.id, id))
    .limit(1);

  if (!examGroup) {
    return null;
  }

  const examsResult = await db
    .select()
    .from(examModel)
    .where(eq(examModel.examGroupId, id));

  const examDtos = (
    await Promise.all(
      examsResult.map(async (exam) => examScheduleService.modelToDto(exam)),
    )
  ).filter((exam): exam is NonNullable<typeof exam> => exam !== null);

  return {
    ...examGroup,
    exams: examDtos,
  };
}

export async function findByStudentId(
  studentId: number,
  page = 1,
  pageSize = 10,
): Promise<PaginatedResponse<ExamGroupDto>> {
  const offset = (page - 1) * pageSize;

  /**
   * STEP 1: Get DISTINCT examGroupIds for this student
   */
  const groupIdRows = await db
    .select({
      examGroupId: examModel.examGroupId,
    })
    .from(examCandidateModel)
    .innerJoin(
      promotionModel,
      eq(promotionModel.id, examCandidateModel.promotionId),
    )
    .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .innerJoin(examModel, eq(examModel.id, examCandidateModel.examId))
    .where(eq(studentModel.id, studentId))
    .groupBy(examModel.examGroupId)
    .limit(pageSize)
    .offset(offset);

  const groupIds = groupIdRows
    .map((r) => r.examGroupId)
    .filter((id): id is number => id !== null);

  if (groupIds.length === 0) {
    return {
      content: [],
      page,
      pageSize,
      totalElements: 0,
      totalPages: 0,
      totalSubjectCount: 0,
    };
  }

  /**
   * STEP 2: Total DISTINCT exam groups count
   */
  const [{ totalCount }] = await db
    .select({
      totalCount: sql<number>`COUNT(DISTINCT ${examModel.examGroupId})`,
    })
    .from(examCandidateModel)
    .innerJoin(
      promotionModel,
      eq(promotionModel.id, examCandidateModel.promotionId),
    )
    .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .innerJoin(examModel, eq(examModel.id, examCandidateModel.examId))
    .where(eq(studentModel.id, studentId));

  /**
   * STEP 2b: Total DISTINCT exam subjects count (papers the student is enrolled in via exam_candidates)
   */
  const [{ totalSubjectCount }] = await db
    .select({
      totalSubjectCount: sql<number>`COUNT(DISTINCT ${examCandidateModel.examSubjectId})`,
    })
    .from(examCandidateModel)
    .innerJoin(
      promotionModel,
      eq(promotionModel.id, examCandidateModel.promotionId),
    )
    .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .where(eq(studentModel.id, studentId));

  /**
   * STEP 3: Fetch exam groups
   */
  const examGroups = await db
    .select()
    .from(examGroupModel)
    .where(inArray(examGroupModel.id, groupIds))
    .orderBy(desc(examGroupModel.examCommencementDate));

  /**
   * STEP 4: Fetch exams inside those groups
   */
  const exams = await db
    .select()
    .from(examModel)
    .where(inArray(examModel.examGroupId, groupIds));

  const examDtos = (
    await Promise.all(exams.map((exam) => examScheduleService.modelToDto(exam)))
  ).filter((exam): exam is NonNullable<typeof exam> => exam !== null);

  /**
   * STEP 5: Group exams by examGroupId
   */
  const examsByGroup = new Map<number, typeof examDtos>();

  for (const exam of examDtos) {
    if (!exam.examGroupId) continue;

    if (!examsByGroup.has(exam.examGroupId)) {
      examsByGroup.set(exam.examGroupId, []);
    }
    examsByGroup.get(exam.examGroupId)!.push(exam);
  }

  /**
   * STEP 6: Build final ExamGroupDto[]
   */
  const content: ExamGroupDto[] = examGroups.map((group) => ({
    ...group,
    exams: examsByGroup.get(group.id) ?? [],
  }));

  return {
    content,
    page,
    pageSize,
    totalElements: Number(totalCount),
    totalPages: Math.ceil(Number(totalCount) / pageSize),
    totalSubjectCount: Number(totalSubjectCount ?? 0),
  };
}

/**
 * Delete an exam and all related rows.
 *
 * Deletion is allowed only if the earliest exam subject startTime is in the future.
 * (If the exam has no subjects, deletion is allowed.)
 */
export async function deleteExamGroupByIdIfUpcoming(
  examGroupId: number,
  userId?: number,
): Promise<null | {
  success: true;
  deletedExamGroupId: number;
}> {
  return await db.transaction(async (tx) => {
    const exams = await tx
      .select()
      .from(examModel)
      .where(eq(examModel.examGroupId, examGroupId));
    if (exams.length === 0) return null;

    const admitCardStart = exams[0].admitCardStartDownloadDate;
    if (!admitCardStart) {
      throw new Error(
        "Exam cannot be deleted because admit card start download date is not set.",
      );
    }

    const admitCardStartMs = new Date(admitCardStart as any).getTime();
    if (Number.isNaN(admitCardStartMs)) {
      throw new Error(
        "Exam cannot be deleted because admit card start download date is invalid.",
      );
    }

    // Allowed only if (admitCardStartDownloadDate - 1 day) >= now
    const now = Date.now();
    const deletionCutoff = admitCardStartMs - 24 * 60 * 60 * 1000;
    if (deletionCutoff < now) {
      throw new Error(
        "Exam cannot be deleted now. Deletion is allowed only up to 1 day before the admit card start download date.",
      );
    }

    // Delete in FK-safe order
    await tx.delete(examCandidateModel).where(
      inArray(
        examCandidateModel.examId,
        exams.map((e) => e.id),
      ),
    );
    await tx.delete(examRoomModel).where(
      inArray(
        examRoomModel.examId,
        exams.map((e) => e.id),
      ),
    );
    await tx.delete(examSubjectModel).where(
      inArray(
        examSubjectModel.examId,
        exams.map((e) => e.id),
      ),
    );
    await tx.delete(examShiftModel).where(
      inArray(
        examShiftModel.examId,
        exams.map((e) => e.id),
      ),
    );
    await tx.delete(examSubjectTypeModel).where(
      inArray(
        examSubjectTypeModel.examId,
        exams.map((e) => e.id),
      ),
    );
    await tx.delete(examProgramCourseModel).where(
      inArray(
        examProgramCourseModel.examId,
        exams.map((e) => e.id),
      ),
    );

    const [deleted] = await tx
      .delete(examModel)
      .where(
        inArray(
          examModel.id,
          exams.map((e) => e.id),
        ),
      )
      .returning({ id: examModel.id });

    if (!deleted) {
      throw new Error("Failed to delete exam.");
    }

    // Emit socket event for exam deletion
    const io = socketService.getIO();
    if (io) {
      io.emit("exam_group_deleted", {
        examGroupId,
        type: "deletion",
        message: "An exam group has been deleted",
        timestamp: new Date().toISOString(),
      });
      io.emit("notification", {
        id: `exam_group_deleted_${examGroupId}_${Date.now()}`,
        type: "info",
        message: `An exam group (ID: ${examGroupId}) has been deleted`,
        createdAt: new Date(),
        read: false,
        meta: {
          examGroupId,
          type: "deletion",
          deletedByUserId: userId ?? null,
        },
      });
    }

    return { success: true as const, deletedExamGroupId: examGroupId };
  });
}

export async function findExamGroupPaperStatsById(id: number) {
  const exams = await db
    .select()
    .from(examModel)
    .where(eq(examModel.examGroupId, id));

  const result = await Promise.all(
    exams.map(async (exam) => {
      const examPapers = await examScheduleService.findExamPapersByExamId(
        exam.id,
      );
      return {
        examId: exam.id,
        examPapers,
      };
    }),
  );

  return result;
}

export async function findExamCandidatesByStudentIdAndExamGroupId(
  studentId: number,
  examGroupId: number,
) {
  const examCandidates = await db
    .select({
      exam_candidates: examCandidateModel,
      paperComponentId: examSubjectModel.paperComponentId,
    })
    .from(examCandidateModel)
    .leftJoin(examModel, eq(examModel.id, examCandidateModel.examId))
    .leftJoin(examGroupModel, eq(examGroupModel.id, examModel.examGroupId))
    .leftJoin(
      promotionModel,
      eq(promotionModel.id, examCandidateModel.promotionId),
    )
    .leftJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .leftJoin(
      examSubjectModel,
      eq(examSubjectModel.id, examCandidateModel.examSubjectId),
    )
    .where(
      and(eq(studentModel.id, studentId), eq(examGroupModel.id, examGroupId)),
    );

  const result = await Promise.all(
    examCandidates.map(async (row) => {
      const examCandidate = row.exam_candidates;
      const paperComponentId = row.paperComponentId;
      const paper = await db
        .select()
        .from(paperModel)
        .where(eq(paperModel.id, examCandidate.paperId))
        .limit(1)
        .then((rows) => rows[0]);

      let examComponentName = "";
      if (paperComponentId) {
        const [pc] = await db
          .select()
          .from(paperComponentModel)
          .where(eq(paperComponentModel.id, paperComponentId))
          .limit(1);
        if (pc?.examComponentId) {
          const [ec] = await db
            .select()
            .from(examComponentModel)
            .where(eq(examComponentModel.id, pc.examComponentId))
            .limit(1);
          examComponentName = ec?.name || ec?.shortName || ec?.code || "";
        }
      }
      // Fallback: when exam_subject.paperComponentId is null, fetch from paper's components
      if (!examComponentName && examCandidate.paperId) {
        const [pc] = await db
          .select()
          .from(paperComponentModel)
          .where(eq(paperComponentModel.paperId, examCandidate.paperId))
          .limit(1);
        if (pc?.examComponentId) {
          const [ec] = await db
            .select()
            .from(examComponentModel)
            .where(eq(examComponentModel.id, pc.examComponentId))
            .limit(1);
          examComponentName = ec?.name || ec?.shortName || ec?.code || "";
        }
      }

      return {
        ...examCandidate,
        paper,
        examComponentName: examComponentName || undefined,
      };
    }),
  );

  return result;
}
