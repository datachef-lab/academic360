import { and, desc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
import ExcelJS from "exceljs";
import { applyStandardExcelReportTableStyling } from "@/utils/excel-report-styling.js";
import { toSentenceCase } from "@/utils/helper.js";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/index.js";
import { studentModel } from "@repo/db/schemas/models/user/student.model.js";
import { userModel } from "@repo/db/schemas/models/user/user.model.js";
import { programCourseModel } from "@repo/db/schemas/models/course-design/program-course.model.js";
import { promotionModel } from "@repo/db/schemas/models/batches/promotions.model.js";
import {
  classModel,
  sectionModel,
  shiftModel,
} from "@repo/db/schemas/models/academics";
import { admissionAcademicInfoModel } from "@repo/db/schemas/models/admissions/admission-academic-info.model.js";
import { tempAdmitCardDistributionsModel } from "@repo/db/schemas/models/exams/index.js";
import type { AdmitCardSearchResponse } from "@/types/exams/admit-card.type.js";

// This cycle distributes admit cards for the Semester II exams: student
// details (program/semester/shift/section) must come from the ACTIVE Sem II
// promotion — endDate still NULL and not deprecated (same semantics as the CU
// Semester II exam-form flow) — never from stale/deprecated promotion rows.
const SEMESTER_TWO_CLASS_ID = 2;
const activeSem2PromotionOn = (studentIdCol: typeof studentModel.id) =>
  and(
    eq(promotionModel.studentId, studentIdCol),
    eq(promotionModel.classId, SEMESTER_TWO_CLASS_ID),
    isNull(promotionModel.endDate),
    eq(promotionModel.isDeprecated, false),
  );

export async function searchCandidate(
  examGroupId: number | undefined,
  searchTerm: string,
): Promise<AdmitCardSearchResponse | null> {
  const normalizeRollNumber = (value: unknown): string | null => {
    if (value == null) return null;
    const s = String(value).trim();
    return s ? s : null;
  };

  const term = `%${searchTerm}%`;

  const distributedByUser = alias(userModel, "distributed_by_user");

  const rows = await db
    .select({
      studentId: studentModel.id,
      studentUid: studentModel.uid,
      studentRollNumber: studentModel.rollNumber,
      promotionRollNumber: promotionModel.rollNumber,
      promotionClassRollNumber: promotionModel.classRollNumber,
      studentRegistrationNumber: studentModel.registrationNumber,
      admissionRegistrationNumber:
        admissionAcademicInfoModel.registrationNumber,
      admissionCuRegistrationNumber:
        admissionAcademicInfoModel.cuRegistrationNumber,
      studentRfid: studentModel.rfidNumber,
      userName: userModel.name,
      userIsActive: userModel.isActive,
      programCourseName: programCourseModel.name,
      semesterName: classModel.name,
      shiftName: shiftModel.name,
      sectionName: sectionModel.name,
      distributionCreatedAt: tempAdmitCardDistributionsModel.createdAt,
      distributedByUserName: distributedByUser.name,
      distributedByUserImage: distributedByUser.image,
    })
    .from(studentModel)
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(promotionModel, activeSem2PromotionOn(studentModel.id))
    .leftJoin(
      programCourseModel,
      eq(programCourseModel.id, promotionModel.programCourseId),
    )
    .leftJoin(classModel, eq(classModel.id, promotionModel.classId))
    .leftJoin(shiftModel, eq(shiftModel.id, promotionModel.shiftId))
    .leftJoin(sectionModel, eq(sectionModel.id, promotionModel.sectionId))
    .leftJoin(
      tempAdmitCardDistributionsModel,
      and(
        eq(tempAdmitCardDistributionsModel.studentId, studentModel.id),
        // Current cycle only: the distribution must belong to the active Sem II
        // promotion. Legacy Sem I rows have promotionId NULL and never match.
        eq(tempAdmitCardDistributionsModel.promotionId, promotionModel.id),
      ),
    )
    .leftJoin(
      distributedByUser,
      eq(
        distributedByUser.id,
        tempAdmitCardDistributionsModel.distributedByUserId,
      ),
    )
    .leftJoin(
      admissionAcademicInfoModel,
      eq(admissionAcademicInfoModel.studentId, studentModel.id),
    )
    .where(
      and(
        or(
          ilike(studentModel.rollNumber, term),
          ilike(studentModel.registrationNumber, term),
          ilike(studentModel.rfidNumber, term),
          ilike(studentModel.uid, term),
          ilike(studentModel.previousUid, term),
          ilike(promotionModel.rollNumber, term),
          ilike(promotionModel.classRollNumber, term),
          ilike(admissionAcademicInfoModel.registrationNumber, term),
          ilike(admissionAcademicInfoModel.cuRegistrationNumber, term),
        ),
      ),
    );

  if (!rows.length) {
    return null;
  }

  const first = rows[0];

  // Important: some DB columns store "" (empty string) instead of NULL.
  // `??` doesn't treat "" as missing, so normalize first to ensure fallback works.
  // As requested, use ONLY student roll number (not promotion roll numbers).
  const rollNumber = normalizeRollNumber(first.studentRollNumber) ?? null;

  // As requested, use ONLY student registration number (not admission table values).
  const registrationNumber =
    normalizeRollNumber(first.studentRegistrationNumber) ?? null;

  const collectionDate = first.distributionCreatedAt
    ? first.distributionCreatedAt.toISOString()
    : null;

  return {
    candidate: {
      id: first.studentId,
      examId: 0,
      studentId: first.studentId,
      name: first.userName,
      uid: first.studentUid,
      rollNumber,
      registrationNumber,
      rfid: first.studentRfid,
      programCourse: first.programCourseName ?? null,
      semester: first.semesterName ?? null,
      shift: first.shiftName ?? null,
      section: first.sectionName ?? null,
      examName: null,
    },
    papers: [],
    alreadyDistributed: !!first.distributionCreatedAt,
    isUserInactive: !first.userIsActive,
    collectionDate,
    distributedByName: first.distributedByUserName ?? null,
    distributedByUserImage: first.distributedByUserImage ?? null,
    venueOfExamination: null,
    roomName: null,
    seatNumber: null,
  };
}

export async function distributeAdmitCard(
  studentId: number,
  distributedByUserId: number,
) {
  // Distribution is only for students in this cycle: an active Semester II
  // promotion must exist.
  const [activePromotion] = await db
    .select({ id: promotionModel.id })
    .from(promotionModel)
    .where(
      and(
        eq(promotionModel.studentId, studentId),
        eq(promotionModel.classId, SEMESTER_TWO_CLASS_ID),
        isNull(promotionModel.endDate),
        eq(promotionModel.isDeprecated, false),
      ),
    )
    .limit(1);
  if (!activePromotion) {
    throw new Error(
      "Student has no active Semester II promotion; admit card distribution is not allowed.",
    );
  }

  // Server-side duplicate guard — per CYCLE (promotion), so last cycle's rows
  // don't block this one. Previously only the UI prevented double inserts.
  const [existing] = await db
    .select({ id: tempAdmitCardDistributionsModel.id })
    .from(tempAdmitCardDistributionsModel)
    .where(
      and(
        eq(tempAdmitCardDistributionsModel.studentId, studentId),
        eq(tempAdmitCardDistributionsModel.promotionId, activePromotion.id),
      ),
    )
    .limit(1);
  if (existing) {
    throw new Error(
      "Admit card is already marked as distributed for this student.",
    );
  }

  const [inserted] = await db
    .insert(tempAdmitCardDistributionsModel)
    .values({
      studentId,
      distributedByUserId: distributedByUserId,
      promotionId: activePromotion.id,
    })
    .returning({
      id: tempAdmitCardDistributionsModel.id,
      createdAt: tempAdmitCardDistributionsModel.createdAt,
    });

  return inserted;
}

export interface AdmitCardReportFilters {
  programCourseIds?: number[];
  affiliationIds?: number[];
  regulationTypeIds?: number[];
  classIds?: number[];
}

export async function listAdmitCardDistributions(
  examGroupId?: number,
  filters?: AdmitCardReportFilters,
): Promise<
  Array<{
    studentId: number;
    studentName: string;
    uid: string;
    rollNumber: string | null;
    registrationNumber: string | null;
    programCourse: string | null;
    semester: string | null;
    shift: string | null;
    appearType: string | null;
    collectionDate: string;
    savedByName: string | null;
  }>
> {
  const distributedByUser = alias(userModel, "distribution_user");
  const normalizeRollNumber = (value: unknown): string | null => {
    if (value == null) return null;
    const s = String(value).trim();
    return s ? s : null;
  };

  const rows = await db
    .select({
      studentId: studentModel.id,
      studentName: userModel.name,
      uid: studentModel.uid,
      studentRollNumber: studentModel.rollNumber,
      promotionRollNumber: promotionModel.rollNumber,
      promotionClassRollNumber: promotionModel.classRollNumber,
      studentRegistrationNumber: studentModel.registrationNumber,
      admissionRegistrationNumber:
        admissionAcademicInfoModel.registrationNumber,
      admissionCuRegistrationNumber:
        admissionAcademicInfoModel.cuRegistrationNumber,
      programCourse: programCourseModel.name,
      semester: classModel.name,
      shift: shiftModel.name,
      collectionDate: tempAdmitCardDistributionsModel.createdAt,
      savedByName: distributedByUser.name,
    })
    .from(tempAdmitCardDistributionsModel)
    .innerJoin(
      studentModel,
      eq(studentModel.id, tempAdmitCardDistributionsModel.studentId),
    )
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    // Current cycle only: join via the distribution's own promotion (legacy
    // Sem I rows with NULL promotionId drop out of the report here).
    .innerJoin(
      promotionModel,
      and(
        eq(promotionModel.id, tempAdmitCardDistributionsModel.promotionId),
        activeSem2PromotionOn(studentModel.id),
      ),
    )
    .innerJoin(
      programCourseModel,
      eq(programCourseModel.id, promotionModel.programCourseId),
    )
    .innerJoin(classModel, eq(classModel.id, promotionModel.classId))
    .innerJoin(shiftModel, eq(shiftModel.id, promotionModel.shiftId))
    .leftJoin(
      admissionAcademicInfoModel,
      eq(admissionAcademicInfoModel.studentId, studentModel.id),
    )
    .leftJoin(
      distributedByUser,
      eq(
        distributedByUser.id,
        tempAdmitCardDistributionsModel.distributedByUserId,
      ),
    )
    .where(
      and(
        ...(filters?.programCourseIds?.length
          ? [inArray(promotionModel.programCourseId, filters.programCourseIds)]
          : []),
        ...(filters?.affiliationIds?.length
          ? [inArray(programCourseModel.affiliationId, filters.affiliationIds)]
          : []),
        ...(filters?.regulationTypeIds?.length
          ? [
              inArray(
                programCourseModel.regulationTypeId,
                filters.regulationTypeIds,
              ),
            ]
          : []),
        ...(filters?.classIds?.length
          ? [inArray(promotionModel.classId, filters.classIds)]
          : []),
      ),
    )
    .orderBy(desc(tempAdmitCardDistributionsModel.createdAt));

  return rows.map((row) => {
    // As requested, use ONLY student roll number (not promotion roll numbers).
    const rollNumber = normalizeRollNumber(row.studentRollNumber) ?? null;

    // As requested, use ONLY student registration number (not admission table values).
    const registrationNumber =
      normalizeRollNumber(row.studentRegistrationNumber) ?? null;

    return {
      studentId: row.studentId,
      studentName: row.studentName,
      uid: row.uid,
      rollNumber,
      registrationNumber,
      programCourse: row.programCourse,
      semester: row.semester,
      shift: row.shift,
      appearType: "REGULAR",
      collectionDate: row.collectionDate?.toISOString() ?? "",
      savedByName: row.savedByName ?? null,
    };
  });
}

/**
 * "Admit Card Collection Report" — same Excel formatting as the other reports
 * (standard table styling, sentence-case headers, fitted column widths) and
 * the same toolbar export filters (program course / affiliation / regulation /
 * class). Rows come from the current-cycle collection list.
 */
export async function exportAdmitCardDistributionsReport(
  filters?: AdmitCardReportFilters,
): Promise<{ buffer: Buffer; fileName: string }> {
  const rows = await listAdmitCardDistributions(undefined, filters);

  const displayRows = rows.map((row) => ({
    student_name: row.studentName ?? "",
    uid: row.uid ?? "",
    roll_number: row.rollNumber ?? "",
    registration_no: row.registrationNumber ?? "",
    program_course: row.programCourse ?? "",
    semester: row.semester ?? "",
    shift: row.shift ?? "",
    appear_type: row.appearType ?? "",
    date_of_collection: row.collectionDate
      ? new Date(row.collectionDate).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "",
    admit_card_saved_by: row.savedByName ?? "",
  }));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("admit-card-collections");

  if (displayRows.length > 0) {
    const headers = Object.keys(
      displayRows[0],
    ) as (keyof (typeof displayRows)[0])[];
    const columnWidth = (header: string, data: unknown[]): number => {
      const maxData = data.reduce<number>(
        (max, v) => Math.max(max, String(v ?? "").length),
        0,
      );
      return Math.min(Math.max(header.length, maxData) + 4, 45);
    };

    sheet.columns = headers.map((header) => ({
      header: toSentenceCase(String(header)),
      key: String(header),
      width: columnWidth(
        toSentenceCase(String(header)),
        displayRows.map((r) => r[header]),
      ),
    }));
    displayRows.forEach((row) => sheet.addRow(row));
    applyStandardExcelReportTableStyling(sheet);
  } else {
    sheet.columns = [{ header: "message", key: "message", width: 20 }];
    sheet.addRow({ message: "No data available" });
  }

  const excelBuffer = await workbook.xlsx.writeBuffer();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return {
    buffer: Buffer.isBuffer(excelBuffer)
      ? excelBuffer
      : Buffer.from(excelBuffer),
    fileName: `admit-card-collection-report-${timestamp}.xlsx`,
  };
}
