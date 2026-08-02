/**
 * Batch version of `getLibraryEntryExitPreviewByUserId` in
 * library-entry-exit.service.ts. Given an array of user IDs, returns a
 * `Map<userId, UserContext>` in TWO queries (users + latest promotion per
 * student) — safe to call inside export loops that would otherwise N+1.
 *
 * The context matches the 22-column layout the existing entry/exit Excel
 * exporter uses, extended with Patron category, Community and Gender for the
 * new library reports.
 */

import { db } from "@/db/index.js";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { userModel } from "@repo/db/schemas/models/user/user.model.js";
import { studentModel } from "@repo/db/schemas/models/user/student.model.js";
import { staffModel } from "@repo/db/schemas/models/user/staff.model.js";
import { personalDetailsModel } from "@repo/db/schemas/models/user/personalDetails.model.js";
import { promotionModel } from "@repo/db/schemas/models/batches/promotions.model.js";
import { classModel } from "@repo/db/schemas/models/academics/class.model.js";
import { shiftModel } from "@repo/db/schemas/models/academics/shift.model.js";
import { sectionModel } from "@repo/db/schemas/models/academics/section.model.js";
import { sessionModel } from "@repo/db/schemas/models/academics/session.model.js";
import { programCourseModel } from "@repo/db/schemas/models/course-design/program-course.model.js";
import { affiliationModel } from "@repo/db/schemas/models/course-design/affiliation.model.js";
import { regulationTypeModel } from "@repo/db/schemas/models/course-design/regulation-type.model.js";

export type UserContext = {
  userId: number;
  userType: string | null;
  name: string;
  active: boolean | null;
  uid: string | null;
  rfid: string | null;
  patronCategory: string | null;
  rollNumber: string | null;
  registrationNumber: string | null;
  classRollNumber: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  staffCode: string | null;
  attendanceCode: string | null;
  community: string | null;
  gender: string | null;
  // Batch info (via the covering-window promotion pick — falls back to latest)
  classOrSemester: string | null;
  shift: string | null;
  section: string | null;
  session: string | null;
  programCourse: string | null;
  affiliation: string | null;
  regulation: string | null;
};

const EMPTY_MAP = new Map<number, UserContext>();

export async function enrichUsersForReport(
  userIds: number[],
): Promise<Map<number, UserContext>> {
  if (userIds.length === 0) return EMPTY_MAP;

  // De-dupe — the same user may appear on many circulation / footfall rows.
  const uniqueIds = Array.from(
    new Set(userIds.filter((n) => Number.isFinite(n))),
  );
  if (uniqueIds.length === 0) return EMPTY_MAP;

  const baseRows = await db
    .select({
      userId: userModel.id,
      userType: userModel.type,
      name: userModel.name,
      active: userModel.isActive,
      email: userModel.email,
      phone: userModel.phone,
      whatsapp: userModel.whatsappNumber,
      studentId: studentModel.id,
      studentUid: studentModel.uid,
      studentRfid: studentModel.rfidNumber,
      community: studentModel.community,
      rollNumber: studentModel.rollNumber,
      registrationNumber: studentModel.registrationNumber,
      classRollNumber: studentModel.classRollNumber,
      staffUid: staffModel.uid,
      staffRfid: staffModel.rfidNumber,
      staffCode: staffModel.codeNumber,
      attendanceCode: staffModel.attendanceCode,
      gender: personalDetailsModel.gender,
    })
    .from(userModel)
    .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
    .leftJoin(staffModel, eq(staffModel.userId, userModel.id))
    .leftJoin(
      personalDetailsModel,
      eq(personalDetailsModel.userId, userModel.id),
    )
    .where(inArray(userModel.id, uniqueIds));

  // Fetch the latest promotion per student in one lateral pass so the batch
  // fields (class, shift, section, session, program course) are populated
  // without an N+1. Matches the single-user helper's ORDER BY id DESC LIMIT 1.
  const studentIds = baseRows
    .map((r) => r.studentId)
    .filter((id): id is number => id != null);
  const promotionRows =
    studentIds.length === 0
      ? []
      : await db
          .select({
            studentId: promotionModel.studentId,
            className: classModel.name,
            shiftName: shiftModel.name,
            sectionName: sectionModel.name,
            sessionName: sessionModel.name,
            programCourseName: programCourseModel.name,
            affiliationName: affiliationModel.name,
            regulationName: regulationTypeModel.name,
            promotionId: promotionModel.id,
          })
          .from(promotionModel)
          .leftJoin(classModel, eq(promotionModel.classId, classModel.id))
          .leftJoin(shiftModel, eq(promotionModel.shiftId, shiftModel.id))
          .leftJoin(sectionModel, eq(promotionModel.sectionId, sectionModel.id))
          .leftJoin(sessionModel, eq(promotionModel.sessionId, sessionModel.id))
          .leftJoin(
            programCourseModel,
            eq(promotionModel.programCourseId, programCourseModel.id),
          )
          .leftJoin(
            affiliationModel,
            eq(programCourseModel.affiliationId, affiliationModel.id),
          )
          .leftJoin(
            regulationTypeModel,
            eq(programCourseModel.regulationTypeId, regulationTypeModel.id),
          )
          .where(inArray(promotionModel.studentId, studentIds))
          .orderBy(desc(promotionModel.id));

  // Keep the FIRST promotion seen per student (rows come back ordered by id
  // DESC so first = latest).
  const promoByStudent = new Map<number, (typeof promotionRows)[number]>();
  for (const r of promotionRows) {
    if (r.studentId == null) continue;
    if (!promoByStudent.has(r.studentId)) promoByStudent.set(r.studentId, r);
  }

  // Staff shifts — separate query mirroring the single-user helper.
  const staffUserIds = baseRows
    .filter((r) => r.userType === "STAFF")
    .map((r) => r.userId);
  const staffShiftByUser = new Map<number, string | null>();
  if (staffUserIds.length > 0) {
    const rows = await db
      .select({
        userId: staffModel.userId,
        shiftName: shiftModel.name,
      })
      .from(staffModel)
      .leftJoin(shiftModel, eq(staffModel.shiftId, shiftModel.id))
      .where(inArray(staffModel.userId, staffUserIds));
    for (const r of rows) {
      if (r.userId != null) staffShiftByUser.set(r.userId, r.shiftName);
    }
  }

  // Patron category — join students → library_patron_category if that column
  // is ever added. Today students have no patronCategoryId FK per
  // packages/db/src/schemas/models/user/student.model.ts, so the value stays
  // null. Kept in the shape so the column doesn't move when the FK lands.
  void sql;

  const out = new Map<number, UserContext>();
  for (const r of baseRows) {
    const promo =
      r.studentId != null ? promoByStudent.get(r.studentId) : undefined;
    const shift =
      promo?.shiftName ??
      (r.userType === "STAFF"
        ? (staffShiftByUser.get(r.userId) ?? null)
        : null);
    out.set(r.userId, {
      userId: r.userId,
      userType: r.userType ?? null,
      name: r.name ?? "",
      active: r.active,
      uid: r.studentUid ?? r.staffUid ?? null,
      rfid: r.studentRfid ?? r.staffRfid ?? null,
      patronCategory: null,
      rollNumber: r.rollNumber ?? null,
      registrationNumber: r.registrationNumber ?? null,
      classRollNumber: r.classRollNumber ?? null,
      email: r.email ?? null,
      phone: r.phone ?? null,
      whatsapp: r.whatsapp ?? null,
      staffCode: r.staffCode ?? null,
      attendanceCode: r.attendanceCode ?? null,
      community: r.community ?? null,
      gender: r.gender ?? null,
      classOrSemester: promo?.className ?? null,
      shift,
      section: promo?.sectionName ?? null,
      session: promo?.sessionName ?? null,
      programCourse: promo?.programCourseName ?? null,
      affiliation: promo?.affiliationName ?? null,
      regulation: promo?.regulationName ?? null,
    });
  }
  return out;
}

/**
 * Push the user block onto an ExcelJS row object. Every report exporter uses
 * this so column names stay identical across every workbook.
 *
 * Column order is scan-optimised: **Name and UID come first**, then Class /
 * Program course (what the reader most often uses to pigeon-hole the entry),
 * then contact fields, then the rarely-scanned admin fields. Older layouts
 * put RFID + patron category up front — those live near the end now.
 */
export function userContextRow(
  u: UserContext | undefined,
): Record<string, unknown> {
  const empty = <T>(v: T | null | undefined): T | "" => (v == null ? "" : v);
  return {
    Name: empty(u?.name),
    UID: empty(u?.uid),
    "User type": empty(u?.userType),
    "Class/Semester": empty(u?.classOrSemester),
    "Program course": empty(u?.programCourse),
    "Roll number": empty(u?.rollNumber),
    Section: empty(u?.section),
    Shift: empty(u?.shift),
    "Registration number": empty(u?.registrationNumber),
    Email: empty(u?.email),
    "Patron category": empty(u?.patronCategory),
    RFID: empty(u?.rfid),
    Community: empty(u?.community),
    Gender: empty(u?.gender),
    Affiliation: empty(u?.affiliation),
    Regulation: empty(u?.regulation),
    Active: u?.active == null ? "" : u.active ? "Active" : "Inactive",
  };
}

export const USER_COLUMN_DEFS: Array<{
  header: string;
  key: string;
  width: number;
}> = [
  { header: "Name", key: "Name", width: 34 },
  { header: "UID", key: "UID", width: 20 },
  { header: "User type", key: "User type", width: 16 },
  { header: "Class/Semester", key: "Class/Semester", width: 24 },
  { header: "Program course", key: "Program course", width: 34 },
  { header: "Roll number", key: "Roll number", width: 20 },
  { header: "Section", key: "Section", width: 16 },
  { header: "Shift", key: "Shift", width: 16 },
  { header: "Registration number", key: "Registration number", width: 24 },
  { header: "Email", key: "Email", width: 34 },
  { header: "Patron category", key: "Patron category", width: 22 },
  { header: "RFID", key: "RFID", width: 20 },
  { header: "Community", key: "Community", width: 18 },
  { header: "Gender", key: "Gender", width: 14 },
  { header: "Affiliation", key: "Affiliation", width: 24 },
  { header: "Regulation", key: "Regulation", width: 24 },
  { header: "Active", key: "Active", width: 14 },
];
