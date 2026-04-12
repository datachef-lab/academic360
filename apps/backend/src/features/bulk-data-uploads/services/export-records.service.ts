import { db } from "@/db/index.js";
import { examFormFillupModel } from "@repo/db/schemas/models/exams/exam-form-fillup.model.js";
import { promotionModel } from "@repo/db/schemas/models/batches/promotions.model.js";
import { promotionStatusModel } from "@repo/db/schemas/models/batches/promotion-status.model.js";
import { programCourseModel } from "@repo/db/schemas/models/course-design/program-course.model.js";
import { sessionModel } from "@repo/db/schemas/models/academics/session.model.js";
import { studentModel } from "@repo/db/schemas/models/user/student.model.js";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

export type BulkExportMode = "cu-reg-roll" | "exam-form-fillup";

/** Must match template columns in `index.ts` / `bulk-data-upload-template.controller.ts` */
const CU_REG_ROLL_EXPORT_HEADERS = [
  "UID",
  "CU Reg Number",
  "CU Roll Number",
] as const;
const EXAM_FORM_FILLUP_EXPORT_HEADERS = [
  "CU Reg Number",
  "CU Roll Number",
  "Appear Type",
  "Form Fill Up Status",
] as const;

export type FetchBulkExportResult =
  | { ok: true; headers: string[]; rows: string[][] }
  | { ok: false; message: string };

export async function fetchBulkExportRows(params: {
  affiliationId: number;
  regulationTypeId: number;
  academicYearId: number;
  classId?: number;
  mode: BulkExportMode;
}): Promise<FetchBulkExportResult> {
  const { affiliationId, regulationTypeId, academicYearId, classId, mode } =
    params;

  const sessions = await db
    .select({ id: sessionModel.id })
    .from(sessionModel)
    .where(eq(sessionModel.academicYearId, academicYearId))
    .orderBy(desc(sessionModel.isCurrentSession));

  if (sessions.length === 0) {
    return {
      ok: false,
      message: "No session found for the selected academic year.",
    };
  }

  const sessionId = sessions[0].id!;

  const eligibleProgramCourseRows = await db
    .select({ id: programCourseModel.id })
    .from(programCourseModel)
    .where(
      and(
        eq(programCourseModel.affiliationId, affiliationId),
        eq(programCourseModel.regulationTypeId, regulationTypeId),
        eq(programCourseModel.isActive, true),
      ),
    );

  const eligibleProgramCourseIds = eligibleProgramCourseRows
    .map((r) => r.id)
    .filter((id): id is number => id != null);

  if (eligibleProgramCourseIds.length === 0) {
    return {
      ok: false,
      message:
        "No active program course found for the selected affiliation and regulation.",
    };
  }

  const promoFilters = [
    eq(promotionModel.sessionId, sessionId),
    inArray(promotionModel.programCourseId, eligibleProgramCourseIds),
  ];
  if (classId != null) {
    promoFilters.push(eq(promotionModel.classId, classId));
  }

  if (mode === "cu-reg-roll") {
    const data = await db
      .select({
        uid: studentModel.uid,
        reg: studentModel.registrationNumber,
        roll: studentModel.rollNumber,
      })
      .from(promotionModel)
      .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
      .where(and(...promoFilters))
      .orderBy(asc(studentModel.uid));

    const rows = data.map((r) => [
      r.uid ?? "",
      (r.reg ?? "").trim(),
      (r.roll ?? "").trim(),
    ]);

    return {
      ok: true,
      headers: [...CU_REG_ROLL_EXPORT_HEADERS],
      rows,
    };
  }

  /** Only promotions that already have an `exam_form_fillup` row (`exam_form_fillup.id` / `promotion_id_fk` is set). No synthetic rows. */
  const data = await db
    .select({
      reg: studentModel.registrationNumber,
      roll: studentModel.rollNumber,
      appearType: promotionStatusModel.name,
      fillupStatus: examFormFillupModel.status,
    })
    .from(promotionModel)
    .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .innerJoin(
      promotionStatusModel,
      eq(promotionStatusModel.id, promotionModel.promotionStatusId),
    )
    .innerJoin(
      examFormFillupModel,
      eq(examFormFillupModel.promotionId, promotionModel.id),
    )
    .where(and(...promoFilters))
    .orderBy(asc(studentModel.uid));

  const rows = data.map((r) => [
    (r.reg ?? "").trim(),
    (r.roll ?? "").trim(),
    (r.appearType ?? "").trim(),
    String(r.fillupStatus).toUpperCase(),
  ]);

  return {
    ok: true,
    headers: [...EXAM_FORM_FILLUP_EXPORT_HEADERS],
    rows,
  };
}
