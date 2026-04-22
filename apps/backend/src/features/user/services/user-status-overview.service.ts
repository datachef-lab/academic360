import { db } from "@/db/index.js";
import { classModel } from "@repo/db/schemas/models/academics/class.model.js";
import { academicYearModel } from "@repo/db/schemas/models/academics/academic-year.model.js";
import { sessionModel } from "@repo/db/schemas/models/academics/session.model.js";
import { userStatusMasterModel } from "@repo/db/schemas/models/administration/user-status-master.model.js";
import { promotionStatusModel } from "@repo/db/schemas/models/batches/promotion-status.model.js";
import { promotionModel } from "@repo/db/schemas/models/batches/promotions.model.js";
import { programCourseModel } from "@repo/db/schemas/models/course-design/program-course.model.js";
import { examFormFillupModel } from "@repo/db/schemas/models/exams/exam-form-fillup.model.js";
import { studentModel } from "@repo/db/schemas/models/user/student.model.js";
import { and, asc, desc, eq } from "drizzle-orm";
import { userStatusMappingOverview } from "../models/user-status-overview.models.js";

/** Maps current `user_statuses_master` rows to the shape expected by main-console OverviewTab. */
function masterRowToFrontendDto(m: typeof userStatusMasterModel.$inferSelect): {
  id: number;
  status: string;
  tag: string;
  description: string;
  remarks: string;
  enrollmentStatus: string;
  domains: { domain: string }[];
  frequencies: { frequency: string }[];
  levels: { level: string }[];
} {
  const tag = (m.name ?? m.code ?? "").trim();
  return {
    id: m.id!,
    status: m.isActive ? "ACTIVE" : "IN_ACTIVE",
    tag,
    description: m.description ?? "",
    remarks: "",
    enrollmentStatus: (m.code ?? m.name ?? "").trim(),
    domains: [{ domain: "STUDENT" }],
    frequencies: [
      { frequency: "ALWAYS_NEW_ENTRY" },
      { frequency: "PER_SEMESTER" },
      { frequency: "PER_ACADEMIC_YEAR" },
      { frequency: "ONLY_ONCE" },
    ],
    levels: [{ level: "ACADEMIC" }],
  };
}

async function loadMasterDto(masterId: number) {
  const [m] = await db
    .select()
    .from(userStatusMasterModel)
    .where(eq(userStatusMasterModel.id, masterId));
  return m ? masterRowToFrontendDto(m) : null;
}

export async function getUserStatusMastersOverview() {
  const masters = await db.select().from(userStatusMasterModel);
  return masters
    .filter((row) => row.isActive !== false)
    .map((m) => masterRowToFrontendDto(m));
}

export async function getUserStatusMappingsByStudentIdOverview(
  studentId: number,
): Promise<unknown[]> {
  let mappings: (typeof userStatusMappingOverview.$inferSelect)[] = [];
  try {
    mappings = await db
      .select()
      .from(userStatusMappingOverview)
      .where(eq(userStatusMappingOverview.studentId, studentId));
  } catch (e) {
    console.warn(
      "[user-status-overview] user_status_mapping query failed (table may be absent):",
      e,
    );
    return [];
  }

  const results: unknown[] = [];

  for (const mapping of mappings) {
    const master = await loadMasterDto(mapping.userStatusMasterId);
    if (!master) continue;

    let sessionData: typeof sessionModel.$inferSelect | null = null;
    let academicYearData: typeof academicYearModel.$inferSelect | null = null;
    if (mapping.sessionId) {
      const [sess] = await db
        .select()
        .from(sessionModel)
        .where(eq(sessionModel.id, mapping.sessionId));
      sessionData = sess ?? null;
      if (sess?.academicYearId) {
        const [ay] = await db
          .select()
          .from(academicYearModel)
          .where(eq(academicYearModel.id, sess.academicYearId));
        academicYearData = ay ?? null;
      }
    }

    let classData: typeof classModel.$inferSelect | null = null;
    if (mapping.promotionId) {
      const [prom] = await db
        .select()
        .from(promotionModel)
        .where(eq(promotionModel.id, mapping.promotionId));
      if (prom?.classId) {
        const [cls] = await db
          .select()
          .from(classModel)
          .where(eq(classModel.id, prom.classId));
        classData = cls ?? null;
      }
    }

    results.push({
      id: mapping.id,
      sessionId: mapping.sessionId,
      userId: mapping.userId,
      studentId: mapping.studentId,
      promotionId: mapping.promotionId,
      suspendedReason: mapping.suspendedReason,
      suspendedTillDate: mapping.suspendedTillDate,
      remarks: mapping.remarks,
      isActive: mapping.isActive,
      createdAt: mapping.createdAt,
      updatedAt: mapping.updatedAt,
      userStatusMaster: master,
      session: sessionData
        ? {
            id: sessionData.id,
            name: sessionData.name,
            academicYearId: sessionData.academicYearId,
          }
        : null,
      academicYear: academicYearData
        ? {
            id: academicYearData.id,
            year: academicYearData.year,
            name: academicYearData.year,
          }
        : null,
      class: classData
        ? {
            id: classData.id,
            name: classData.name,
            type: classData.type ?? undefined,
          }
        : null,
    });
  }

  return results;
}

export async function getPromotionsByStudentIdOverview(studentId: number) {
  const promotions = await db
    .select()
    .from(promotionModel)
    .where(eq(promotionModel.studentId, studentId))
    .orderBy(asc(promotionModel.id));

  const [student] = await db
    .select()
    .from(studentModel)
    .where(eq(studentModel.id, studentId));

  let programCourse: typeof programCourseModel.$inferSelect | null = null;
  if (student?.programCourseId) {
    const [pc] = await db
      .select()
      .from(programCourseModel)
      .where(eq(programCourseModel.id, student.programCourseId));
    programCourse = pc ?? null;
  }

  const results: unknown[] = [];

  for (const promotion of promotions) {
    const [session] = await db
      .select()
      .from(sessionModel)
      .where(eq(sessionModel.id, promotion.sessionId));

    let academicYear: typeof academicYearModel.$inferSelect | null = null;
    if (session?.academicYearId) {
      const [ay] = await db
        .select()
        .from(academicYearModel)
        .where(eq(academicYearModel.id, session.academicYearId));
      academicYear = ay ?? null;
    }

    const [cls] = await db
      .select()
      .from(classModel)
      .where(eq(classModel.id, promotion.classId));

    let appearTypeName: string | null = null;
    let fillupRow: typeof examFormFillupModel.$inferSelect | undefined;
    if (promotion.examFormFillupId) {
      const [fillup] = await db
        .select()
        .from(examFormFillupModel)
        .where(eq(examFormFillupModel.id, promotion.examFormFillupId));
      fillupRow = fillup;
    }
    if (!fillupRow) {
      const [byKeys] = await db
        .select()
        .from(examFormFillupModel)
        .where(
          and(
            eq(examFormFillupModel.studentId, promotion.studentId),
            eq(examFormFillupModel.sessionId, promotion.sessionId),
            eq(examFormFillupModel.programCourseId, promotion.programCourseId),
            eq(examFormFillupModel.classId, promotion.classId),
          ),
        )
        .orderBy(desc(examFormFillupModel.id))
        .limit(1);
      fillupRow = byKeys;
    }
    if (fillupRow?.appearTypeId) {
      const [appearStatus] = await db
        .select()
        .from(promotionStatusModel)
        .where(eq(promotionStatusModel.id, fillupRow.appearTypeId));
      appearTypeName = appearStatus?.name?.trim() ?? null;
    }

    results.push({
      id: promotion.id,
      studentId: promotion.studentId,
      sessionId: promotion.sessionId,
      classId: promotion.classId,
      academicYear: academicYear
        ? {
            id: academicYear.id,
            year: academicYear.year,
            name: academicYear.year,
          }
        : null,
      class: cls
        ? { id: cls.id, name: cls.name, type: cls.type ?? undefined }
        : null,
      appearTypeName,
      dateOfJoining: promotion.dateOfJoining,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      remarks: promotion.remarks,
    });
  }

  return {
    promotions: results,
    meta: {
      totalSemesters: programCourse?.totalSemesters ?? null,
      completedSemesters: promotions.length,
    },
  };
}

type CreateUserStatusPayload = {
  userId: number;
  studentId: number;
  sessionId: number;
  promotionId: number;
  byUserId: number;
  remarks?: string | null;
  suspendedTillDate?: string | null;
  suspendedReason?: string | null;
  isActive?: boolean;
  userStatusMaster: { id: number; tag?: string };
};

export async function createUserStatusMappingOverview(
  payload: CreateUserStatusPayload,
) {
  const now = new Date();
  const [created] = await db
    .insert(userStatusMappingOverview)
    .values({
      userId: payload.userId,
      studentId: payload.studentId,
      sessionId: payload.sessionId,
      promotionId: payload.promotionId,
      userStatusMasterId: payload.userStatusMaster.id,
      byUserId: payload.byUserId,
      remarks: payload.remarks ?? null,
      suspendedTillDate: payload.suspendedTillDate
        ? new Date(payload.suspendedTillDate)
        : null,
      suspendedReason: payload.suspendedReason ?? null,
      isActive: payload.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return created ?? null;
}

export async function updateUserStatusMappingOverview(
  id: number,
  payload: Partial<CreateUserStatusPayload> & {
    isActive?: boolean;
    remarks?: string | null;
  },
) {
  const [existing] = await db
    .select()
    .from(userStatusMappingOverview)
    .where(eq(userStatusMappingOverview.id, id));

  if (!existing) return null;

  const [updated] = await db
    .update(userStatusMappingOverview)
    .set({
      remarks:
        payload.remarks !== undefined ? payload.remarks : existing.remarks,
      suspendedTillDate:
        payload.suspendedTillDate !== undefined
          ? payload.suspendedTillDate
            ? new Date(payload.suspendedTillDate)
            : null
          : existing.suspendedTillDate,
      suspendedReason:
        payload.suspendedReason !== undefined
          ? payload.suspendedReason
          : existing.suspendedReason,
      isActive:
        payload.isActive !== undefined ? payload.isActive : existing.isActive,
      updatedAt: new Date(),
    })
    .where(eq(userStatusMappingOverview.id, id))
    .returning();

  return updated ?? null;
}
