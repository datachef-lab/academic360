import { db } from "@/db/index.js";
import { classModel } from "@repo/db/schemas/models/academics/class.model.js";
import { academicYearModel } from "@repo/db/schemas/models/academics/academic-year.model.js";
import { sessionModel } from "@repo/db/schemas/models/academics/session.model.js";
import { shiftModel } from "@repo/db/schemas/models/academics/shift.model.js";
import { sectionModel } from "@repo/db/schemas/models/academics/section.model.js";
import { userStatusMasterModel } from "@repo/db/schemas/models/administration/user-status-master.model.js";
import { promotionStatusModel } from "@repo/db/schemas/models/batches/promotion-status.model.js";
import { promotionModel } from "@repo/db/schemas/models/batches/promotions.model.js";
import { programCourseModel } from "@repo/db/schemas/models/course-design/program-course.model.js";
import { examFormFillupModel } from "@repo/db/schemas/models/exams/exam-form-fillup.model.js";
import { studentModel } from "@repo/db/schemas/models/user/student.model.js";
import { asc, eq, inArray } from "drizzle-orm";
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

  if (mappings.length === 0) return [];

  // Bulk-fetch every FK referenced across all mappings (instead of a
  // per-mapping sequential await chain), then assemble identical output.
  const masterIds = [...new Set(mappings.map((m) => m.userStatusMasterId))];
  const sessionIds = [
    ...new Set(
      mappings
        .map((m) => m.sessionId)
        .filter((id): id is number => id !== null && id !== undefined),
    ),
  ];
  const promotionIds = [
    ...new Set(
      mappings
        .map((m) => m.promotionId)
        .filter((id): id is number => id !== null && id !== undefined),
    ),
  ];

  const [masterRows, sessionRows, promotionRows] = await Promise.all([
    masterIds.length > 0
      ? db
          .select()
          .from(userStatusMasterModel)
          .where(inArray(userStatusMasterModel.id, masterIds))
      : Promise.resolve([] as (typeof userStatusMasterModel.$inferSelect)[]),
    sessionIds.length > 0
      ? db
          .select()
          .from(sessionModel)
          .where(inArray(sessionModel.id, sessionIds))
      : Promise.resolve([] as (typeof sessionModel.$inferSelect)[]),
    promotionIds.length > 0
      ? db
          .select()
          .from(promotionModel)
          .where(inArray(promotionModel.id, promotionIds))
      : Promise.resolve([] as (typeof promotionModel.$inferSelect)[]),
  ]);

  const masterMap = new Map(
    masterRows.map((m) => [m.id, masterRowToFrontendDto(m)]),
  );
  const sessionMap = new Map(sessionRows.map((s) => [s.id, s]));
  const promotionMap = new Map(promotionRows.map((p) => [p.id, p]));

  // Second-hop FKs (session -> academicYear, promotion -> class) depend on
  // the rows just fetched, so resolve them in a second bulk round.
  const academicYearIds = [
    ...new Set(
      sessionRows
        .map((s) => s.academicYearId)
        .filter((id): id is number => id !== null && id !== undefined),
    ),
  ];
  const classIds = [
    ...new Set(
      promotionRows
        .map((p) => p.classId)
        .filter((id): id is number => id !== null && id !== undefined),
    ),
  ];

  const [academicYearRows, classRows] = await Promise.all([
    academicYearIds.length > 0
      ? db
          .select()
          .from(academicYearModel)
          .where(inArray(academicYearModel.id, academicYearIds))
      : Promise.resolve([] as (typeof academicYearModel.$inferSelect)[]),
    classIds.length > 0
      ? db.select().from(classModel).where(inArray(classModel.id, classIds))
      : Promise.resolve([] as (typeof classModel.$inferSelect)[]),
  ]);

  const academicYearMap = new Map(academicYearRows.map((ay) => [ay.id, ay]));
  const classMap = new Map(classRows.map((c) => [c.id, c]));

  const results: unknown[] = [];

  for (const mapping of mappings) {
    const master = masterMap.get(mapping.userStatusMasterId) ?? null;
    if (!master) continue;

    let sessionData: typeof sessionModel.$inferSelect | null = null;
    let academicYearData: typeof academicYearModel.$inferSelect | null = null;
    if (mapping.sessionId) {
      sessionData = sessionMap.get(mapping.sessionId) ?? null;
      if (sessionData?.academicYearId) {
        academicYearData =
          academicYearMap.get(sessionData.academicYearId) ?? null;
      }
    }

    let classData: typeof classModel.$inferSelect | null = null;
    if (mapping.promotionId) {
      const prom = promotionMap.get(mapping.promotionId);
      if (prom?.classId) {
        classData = classMap.get(prom.classId) ?? null;
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
  // promotions and student are independent lookups - fetch concurrently.
  const [promotions, [student]] = await Promise.all([
    db
      .select()
      .from(promotionModel)
      .where(eq(promotionModel.studentId, studentId))
      .orderBy(asc(promotionModel.id)),
    db.select().from(studentModel).where(eq(studentModel.id, studentId)),
  ]);

  let programCourse: typeof programCourseModel.$inferSelect | null = null;
  if (student?.programCourseId) {
    const [pc] = await db
      .select()
      .from(programCourseModel)
      .where(eq(programCourseModel.id, student.programCourseId));
    programCourse = pc ?? null;
  }

  // A shift change rotates students.uid (old value saved to previousUid) and is
  // the only thing that changes the uid. Since the uid tracks the shift, a
  // promotion belongs to the previous-uid era iff its shift differs from the
  // student's CURRENT (active) shift. This keeps old-shift promotions on the
  // previous uid while later same-shift semesters stay on the current uid.
  const currentShiftId =
    (
      promotions.find((p) => p.endDate == null && p.isDeprecated !== true) ??
      promotions[promotions.length - 1]
    )?.shiftId ?? null;
  const previousUid = student?.previousUid?.trim() || null;
  const uidForPromotion = (promotionShiftId: number | null) =>
    previousUid && currentShiftId != null && promotionShiftId !== currentShiftId
      ? previousUid
      : (student?.uid ?? null);

  if (promotions.length === 0) {
    return {
      promotions: [],
      meta: {
        totalSemesters: programCourse?.totalSemesters ?? null,
        completedSemesters: 0,
      },
    };
  }

  // Bulk-fetch every FK referenced across all promotions (instead of a
  // per-promotion sequential await chain).
  const sessionIds = [...new Set(promotions.map((p) => p.sessionId))];
  const classIds = [...new Set(promotions.map((p) => p.classId))];
  const shiftIds = [...new Set(promotions.map((p) => p.shiftId))];
  const sectionIds = [
    ...new Set(
      promotions
        .map((p) => p.sectionId)
        .filter((id): id is number => id !== null && id !== undefined),
    ),
  ];
  const examFormFillupIds = [
    ...new Set(
      promotions
        .map((p) => p.examFormFillupId)
        .filter((id): id is number => id !== null && id !== undefined),
    ),
  ];

  const [
    sessionRows,
    classRows,
    shiftRows,
    sectionRows,
    fillupByIdRows,
    studentFillupRows,
  ] = await Promise.all([
    sessionIds.length > 0
      ? db
          .select()
          .from(sessionModel)
          .where(inArray(sessionModel.id, sessionIds))
      : Promise.resolve([] as (typeof sessionModel.$inferSelect)[]),
    classIds.length > 0
      ? db.select().from(classModel).where(inArray(classModel.id, classIds))
      : Promise.resolve([] as (typeof classModel.$inferSelect)[]),
    shiftIds.length > 0
      ? db.select().from(shiftModel).where(inArray(shiftModel.id, shiftIds))
      : Promise.resolve([] as (typeof shiftModel.$inferSelect)[]),
    sectionIds.length > 0
      ? db
          .select()
          .from(sectionModel)
          .where(inArray(sectionModel.id, sectionIds))
      : Promise.resolve([] as (typeof sectionModel.$inferSelect)[]),
    // Direct examFormFillupId -> row lookup (matches original eq(id, ...) fetch)
    examFormFillupIds.length > 0
      ? db
          .select()
          .from(examFormFillupModel)
          .where(inArray(examFormFillupModel.id, examFormFillupIds))
      : Promise.resolve([] as (typeof examFormFillupModel.$inferSelect)[]),
    // All of this student's exam form fillups, used for the by-keys fallback
    // (matches original eq(studentId, promotion.studentId) fallback filter -
    // all promotions here already share this same studentId).
    db
      .select()
      .from(examFormFillupModel)
      .where(eq(examFormFillupModel.studentId, studentId)),
  ]);

  const sessionMap = new Map(sessionRows.map((s) => [s.id, s]));
  const classMap = new Map(classRows.map((c) => [c.id, c]));
  const shiftMap = new Map(shiftRows.map((s) => [s.id, s]));
  const sectionMap = new Map(sectionRows.map((s) => [s.id, s]));
  const fillupByIdMap = new Map(fillupByIdRows.map((f) => [f.id, f]));

  // Fallback lookup mirrors: where(studentId, sessionId, programCourseId, classId)
  // orderBy(desc(id)).limit(1) - keep only the highest-id row per key.
  const fillupByKeyMap = new Map<
    string,
    typeof examFormFillupModel.$inferSelect
  >();
  for (const row of studentFillupRows) {
    const key = `${row.sessionId}|${row.programCourseId}|${row.classId}`;
    const existing = fillupByKeyMap.get(key);
    if (!existing || (row.id ?? 0) > (existing.id ?? 0)) {
      fillupByKeyMap.set(key, row);
    }
  }

  // Resolve fillupRow per promotion (in-memory, id-else-by-keys fallback
  // preserved exactly) and collect appearTypeIds for a bulk lookup.
  const fillupRowByPromotionId = new Map<
    number,
    typeof examFormFillupModel.$inferSelect | undefined
  >();
  const appearTypeIds = new Set<number>();
  for (const promotion of promotions) {
    let fillupRow = promotion.examFormFillupId
      ? fillupByIdMap.get(promotion.examFormFillupId)
      : undefined;
    if (!fillupRow) {
      const key = `${promotion.sessionId}|${promotion.programCourseId}|${promotion.classId}`;
      fillupRow = fillupByKeyMap.get(key);
    }
    fillupRowByPromotionId.set(promotion.id!, fillupRow);
    if (fillupRow?.appearTypeId) {
      appearTypeIds.add(fillupRow.appearTypeId);
    }
  }

  // Second-hop FKs (session -> academicYear, fillup -> promotionStatus).
  const academicYearIds = [
    ...new Set(
      sessionRows
        .map((s) => s.academicYearId)
        .filter((id): id is number => id !== null && id !== undefined),
    ),
  ];

  const [academicYearRows, promotionStatusRows] = await Promise.all([
    academicYearIds.length > 0
      ? db
          .select()
          .from(academicYearModel)
          .where(inArray(academicYearModel.id, academicYearIds))
      : Promise.resolve([] as (typeof academicYearModel.$inferSelect)[]),
    appearTypeIds.size > 0
      ? db
          .select()
          .from(promotionStatusModel)
          .where(inArray(promotionStatusModel.id, [...appearTypeIds]))
      : Promise.resolve([] as (typeof promotionStatusModel.$inferSelect)[]),
  ]);

  const academicYearMap = new Map(academicYearRows.map((ay) => [ay.id, ay]));
  const promotionStatusMap = new Map(promotionStatusRows.map((p) => [p.id, p]));

  const results: unknown[] = [];

  for (const promotion of promotions) {
    const session = sessionMap.get(promotion.sessionId);
    const academicYear = session?.academicYearId
      ? (academicYearMap.get(session.academicYearId) ?? null)
      : null;
    const cls = classMap.get(promotion.classId);
    const shf = shiftMap.get(promotion.shiftId);
    const sec = promotion.sectionId
      ? sectionMap.get(promotion.sectionId)
      : undefined;

    const fillupRow = fillupRowByPromotionId.get(promotion.id!);
    const appearTypeName = fillupRow?.appearTypeId
      ? (promotionStatusMap.get(fillupRow.appearTypeId)?.name?.trim() ?? null)
      : null;

    results.push({
      id: promotion.id,
      studentId: promotion.studentId,
      sessionId: promotion.sessionId,
      classId: promotion.classId,
      shiftId: promotion.shiftId,
      uid: uidForPromotion(promotion.shiftId),
      classRollNumber: promotion.classRollNumber ?? null,
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
      shift: shf ? { id: shf.id, name: shf.name ?? undefined } : null,
      section: sec ? { id: sec.id, name: sec.name ?? undefined } : null,
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
