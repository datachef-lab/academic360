import { db, mysqlConnection } from "@/db";
import { OldStaff, OldStudent } from "@repo/db/legacy-system-types/users";
import {
  academicYearModel,
  addressModel,
  Board,
  boardModel,
  classModel,
  EmergencyContact,
  programCourseModel,
  promotionModel,
  sessionModel,
  shiftModel,
  Staff,
  staffModel,
  studentAcademicSubjectModel,
  studentModel,
  User,
  userModel,
  userTypeEnum,
} from "@repo/db/schemas";
import { and, count, eq, ilike, inArray, or } from "drizzle-orm";
import * as oldStudentPersonalDetailsHelper from "./old-student-helper";
import * as oldStudentAdmissionServices from "./old-student.service";
import bcrypt from "bcryptjs";
import {
  OldAcademicYear,
  OldSession,
  OldShift,
} from "@repo/db/legacy-system-types/academics";
import { OldAdmissionStats } from "@repo/db/legacy-system-types/admissions";

const BATCH_SIZE = 500;

const waitingTime: number = 2 * 60 * 60 * 1000; // 2 hours

async function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// Watermark for incremental runs
let lastRunCompletedAt: Date = new Date(0);

/*
 * This function is responsible for loading the students data from the old system to the new system
 *
 * This script will be start loading and thereby will maintain the auto sync between the old and new system
 */
export async function loadData(sinceDate?: Date) {
  const [oldSessions] = (await mysqlConnection.query(`
        SELECT * FROM currentsessionmaster;
    `)) as [OldSession[], any];

  for (let i = 0; i < oldSessions.length; i++) {
    const oldSession = oldSessions[i];

    const { foundSession } = await getMetadata(oldSession);

    const stats = await getOldAdmissionStatsByOldSessionId(oldSession.id!);

    for (let i = 0; i < stats.length; i++) {
      if (i == stats.length - 1) {
        console.log(`Done processing... Moving to next session`);
        continue;
      }

      const stat = stats[i];
      const [foundProgramCourse] = await db
        .select()
        .from(programCourseModel)
        .where(ilike(programCourseModel.name, stat.course.trim()));
      const [foundClass] = await db
        .select()
        .from(classModel)
        .where(ilike(classModel.name, "SEMESTER I")); // Fetch the `SEMESTER I` class only for now

      const [{ count: totalPromotions }] = await db
        .select({ count: count() })
        .from(promotionModel)
        .where(
          and(
            eq(promotionModel.programCourseId, foundProgramCourse?.id!),
            eq(promotionModel.classId, foundClass?.id!),
            eq(promotionModel.sessionId, foundSession?.id!),
          ),
        );

      if (stat.total === 0) {
        console.log(
          `No promotions found for ${stat.course} in ${oldSession.sessionName}`,
        );
        continue;
      }

      // If counts mismatch: backfill missing students
      if (totalPromotions !== stat.total) {
        console.log(
          `Promotion count (${totalPromotions}) != legacy total (${stat.total}) for ${stat.course} in ${oldSession.sessionName}. Backfilling missing students...`,
        );
        await backfillMissingStudents(stat, oldSession.id!);
        continue;
      }

      // Counts match: process only modified students since watermark
      console.log(
        `Promotion count matches for ${stat.course} in ${oldSession.sessionName}. Processing modified students${sinceDate ? ` since ${sinceDate.toISOString()}` : ""}...`,
      );
      await processModifiedStudents(stat, oldSession.id!, sinceDate);
    }
  }
}

// Continuously runs loadData, waits for 2 hours, then runs again
export async function startLoadDataScheduler() {
  // Infinite loop with delay between runs
  while (true) {
    try {
      const runStartedAt = new Date();
      await loadData(lastRunCompletedAt);
      lastRunCompletedAt = runStartedAt;
    } catch (error) {
      console.error("loadData run failed", error);
    }
    console.log(
      `loadData completed. Waiting ${waitingTime / (60 * 60 * 1000)} hours before next run...`,
    );
    await sleep(waitingTime);
  }
}

// Backfills students present in legacy for a course/session but missing in new DB (by legacyStudentId)
async function backfillMissingStudents(
  stats: OldAdmissionStats,
  oldSessionId: number,
) {
  const [[{ totalStudents }]] = (await mysqlConnection.query(`
        SELECT COUNT(sp.id) AS totalStudents
        FROM personaldetails pd
        JOIN coursedetails cd ON cd.parent_id = pd.id
        JOIN studentpersonaldetails sp ON sp.admissionId = cd.id
        JOIN currentsessionmaster sess ON sess.id = pd.sessionId
        JOIN course crs ON crs.id = cd.courseId
        JOIN classes c ON c.id = cd.classId
        JOIN shift sf ON sf.id = cd.shiftId
        WHERE cd.transferred = true
        AND sess.id = ${oldSessionId}
        AND crs.courseName = '${stats.course.trim()}'
    `)) as [{ totalStudents: number }[], any];

  const totalBatches = Math.ceil(totalStudents / BATCH_SIZE);
  for (let i = 0; i < totalBatches; i++) {
    const offset = i * BATCH_SIZE;
    const limit = BATCH_SIZE;
    const [oldStudentIds] = (await mysqlConnection.query(`
            SELECT sp.id AS legacyStudentId, sp.codeNumber
            FROM personaldetails pd
            JOIN coursedetails cd ON cd.parent_id = pd.id
            JOIN studentpersonaldetails sp ON sp.admissionId = cd.id
            JOIN currentsessionmaster sess ON sess.id = pd.sessionId
            JOIN course crs ON crs.id = cd.courseId
            WHERE cd.transferred = true
                AND sess.id = ${oldSessionId}
                AND crs.courseName = '${stats.course.trim()}'
            ORDER BY sp.id
            LIMIT ${limit}
            OFFSET ${offset};
        `)) as [{ legacyStudentId: number; codeNumber: string }[], any];

    if (oldStudentIds.length === 0) {
      continue;
    }

    const legacyIds = oldStudentIds.map((r) => r.legacyStudentId);
    const existing = await db
      .select({ legacyStudentId: studentModel.legacyStudentId })
      .from(studentModel)
      .where(inArray(studentModel.legacyStudentId, legacyIds));

    const existingSet = new Set(
      existing
        .map((r) => r.legacyStudentId)
        .filter((v): v is number => typeof v === "number"),
    );
    const missingIds = legacyIds.filter((id) => !existingSet.has(id));
    if (missingIds.length === 0) {
      console.log(
        `${stats.course}: batch ${i + 1}/${totalBatches} — no missing students`,
      );
      continue;
    }

    const [rows] = (await mysqlConnection.query(`
            SELECT sp.*
            FROM personaldetails pd
            JOIN coursedetails cd ON cd.parent_id = pd.id
            JOIN studentpersonaldetails sp ON sp.admissionId = cd.id
            JOIN currentsessionmaster sess ON sess.id = pd.sessionId
            JOIN course crs ON crs.id = cd.courseId
            WHERE cd.transferred = true
                AND sess.id = ${oldSessionId}
                AND crs.courseName = '${stats.course.trim()}'
                AND sp.id IN (${missingIds.join(", ")})
            ORDER BY sp.id;
        `)) as [OldStudent[], any];

    for (let j = 0; j < rows.length; j++) {
      const oldStudent = rows[j];
      const student = await processStudent(oldStudent);
      console.log("Backfilled student:", student?.uid);
    }

    console.log(
      `${stats.course} | Backfill batch ${i + 1}/${totalBatches}: processed ${rows.length} missing`,
    );
  }
}

// Processes only students modified since a given date for a course/session
async function processModifiedStudents(
  stats: OldAdmissionStats,
  oldSessionId: number,
  sinceDate?: Date,
) {
  if (!sinceDate || sinceDate.getTime() === 0) {
    console.log(
      `${stats.course}: no sinceDate provided, skipping modified-only run.`,
    );
    return;
  }

  const sinceIso = sinceDate.toISOString().slice(0, 19).replace("T", " ");

  const [rows] = (await mysqlConnection.query(`
        SELECT sp.*
        FROM personaldetails pd
        JOIN coursedetails cd ON cd.parent_id = pd.id
        JOIN studentpersonaldetails sp ON sp.admissionId = cd.id
        JOIN currentsessionmaster sess ON sess.id = pd.sessionId
        JOIN course crs ON crs.id = cd.courseId
        WHERE cd.transferred = true
            AND sess.id = ${oldSessionId}
            AND crs.courseName = '${stats.course.trim()}'
            AND sp.modifydt > '${sinceIso}'
        ORDER BY sp.id;
    `)) as [OldStudent[], any];

  if (rows.length === 0) {
    console.log(`${stats.course}: no modified students since ${sinceIso}`);
    return;
  }

  for (let j = 0; j < rows.length; j++) {
    const oldStudent = rows[j];
    const student = await processStudent(oldStudent);
    console.log("Updated student:", student?.uid);
  }

  console.log(
    `${stats.course}: processed ${rows.length} modified students since ${sinceIso}`,
  );
}

export async function processDataFetching(
  stats: OldAdmissionStats,
  oldSessionId: number,
) {
  const [[{ totalStudents }]] = (await mysqlConnection.query(`
        SELECT COUNT(sp.id) AS totalStudents
        FROM personaldetails pd
        JOIN coursedetails cd ON cd.parent_id = pd.id
        JOIN studentpersonaldetails sp ON sp.admissionId = cd.id
        JOIN currentsessionmaster sess ON sess.id = pd.sessionId
        JOIN course crs ON crs.id = cd.courseId
        JOIN classes c ON c.id = cd.classId
        JOIN shift sf ON sf.id = cd.shiftId
        WHERE cd.transferred = true
        AND sess.id = ${oldSessionId}
        AND crs.courseName = ${stats.course.trim()};
    `)) as [{ totalStudents: number }[], any];

  console.log(`Total students: ${totalStudents}`);

  const totalBatches = Math.ceil(totalStudents / BATCH_SIZE);

  console.log(`Total batches: ${totalBatches}`);
  console.log(`Batch size: ${BATCH_SIZE}`);

  for (let i = 0; i < totalBatches; i++) {
    const offset = i * BATCH_SIZE;
    const limit = BATCH_SIZE;

    const [rows] = (await mysqlConnection.query(`
            SELECT sp.*
            FROM personaldetails pd
            JOIN coursedetails cd ON cd.parent_id = pd.id
            JOIN studentpersonaldetails sp ON sp.admissionId = cd.id
            JOIN currentsessionmaster sess ON sess.id = pd.sessionId
            JOIN course crs ON crs.id = cd.courseId
            JOIN classes c ON c.id = cd.classId
            JOIN shift sf ON sf.id = cd.shiftId
            WHERE cd.transferred = true
                AND sess.id = ${oldSessionId}
                AND crs.courseName = ${stats.course.trim()}
            ORDER BY sp.id
            LIMIT ${limit}
            OFFSET ${offset};
        `)) as [OldStudent[], any];

    for (let j = 0; j < rows.length; j++) {
      const oldStudent = rows[j];
      const student = await processStudent(oldStudent);
      console.log("Created student:", student?.uid);
    }

    console.log(
      `${stats.course} (${stats.total}) | Done loading batch ${i + 1}/${totalBatches}: ${rows.length} students`,
    );
  }
}

export async function getOldAdmissionStatsByOldSessionId(oldSessionId: number) {
  const [stats] = (await mysqlConnection.query(`
        SELECT 
            crs.courseName AS course,
            SUSELECT 
            crs.courseName AS course,
            SUM(CASE WHEN sf.shiftName = 'Afternoon' THEN 1 ELSE 0 END) AS afternoon,
            SUM(CASE WHEN sf.shiftName = 'Day' THEN 1 ELSE 0 END) AS day,
            SUM(CASE WHEN sf.shiftName = 'Evening' THEN 1 ELSE 0 END) AS evening,
            SUM(CASE WHEN sf.shiftName = 'Morning' THEN 1 ELSE 0 END) AS morning,
            COUNT(sp.id) AS total
        FROM personaldetails pd
        JOIN coursedetails cd ON cd.parent_id = pd.id
        JOIN studentpersonaldetails sp ON sp.admissionId = cd.id
        JOIN currentsessionmaster sess ON sess.id = pd.sessionId
        JOIN course crs ON crs.id = cd.courseId
        JOIN classes c ON c.id = cd.classId
        JOIN shift sf ON sf.id = cd.shiftId
        WHERE cd.transferred = true
        AND sess.id = ${oldSessionId}
        GROUP BY crs.courseName

        UNION ALL

        SELECT 
            'Grand Total' AS course,
            SUM(CASE WHEN sf.shiftName = 'Afternoon' THEN 1 ELSE 0 END),
            SUM(CASE WHEN sf.shiftName = 'Day' THEN 1 ELSE 0 END),
            SUM(CASE WHEN sf.shiftName = 'Evening' THEN 1 ELSE 0 END),
            SUM(CASE WHEN sf.shiftName = 'Morning' THEN 1 ELSE 0 END),
            COUNT(sp.id)
        FROM personaldetails pd
        JOIN coursedetails cd ON cd.parent_id = pd.id
        JOIN studentpersonaldetails sp ON sp.admissionId = cd.id
        JOIN currentsessionmaster sess ON sess.id = pd.sessionId
        JOIN course crs ON crs.id = cd.courseId
        JOIN classes c ON c.id = cd.classId
        JOIN shift sf ON sf.id = cd.shiftId
        WHERE cd.transferred = true
        AND sess.id = ${oldSessionId}

        ORDER BY 
            CASE WHEN course = 'Grand Total' THEN 2 ELSE 1 END,
            course;M(CASE WHEN sf.shiftName = 'Afternoon' THEN 1 ELSE 0 END) AS afternoon,
            SUM(CASE WHEN sf.shiftName = 'Day' THEN 1 ELSE 0 END) AS day,
            SUM(CASE WHEN sf.shiftName = 'Evening' THEN 1 ELSE 0 END) AS evening,
            SUM(CASE WHEN sf.shiftName = 'Morning' THEN 1 ELSE 0 END) AS morning,
            COUNT(sp.id) AS total
        FROM personaldetails pd
        JOIN coursedetails cd ON cd.parent_id = pd.id
        JOIN studentpersonaldetails sp ON sp.admissionId = cd.id
        JOIN currentsessionmaster sess ON sess.id = pd.sessionId
        JOIN course crs ON crs.id = cd.courseId
        JOIN classes c ON c.id = cd.classId
        JOIN shift sf ON sf.id = cd.shiftId
        WHERE cd.transferred = true
        AND sess.id = ${oldSessionId}
        GROUP BY crs.courseName

        UNION ALL

        SELECT 
            'Grand Total' AS course,
            SUM(CASE WHEN sf.shiftName = 'Afternoon' THEN 1 ELSE 0 END),
            SUM(CASE WHEN sf.shiftName = 'Day' THEN 1 ELSE 0 END),
            SUM(CASE WHEN sf.shiftName = 'Evening' THEN 1 ELSE 0 END),
            SUM(CASE WHEN sf.shiftName = 'Morning' THEN 1 ELSE 0 END),
            COUNT(sp.id)
        FROM personaldetails pd
        JOIN coursedetails cd ON cd.parent_id = pd.id
        JOIN studentpersonaldetails sp ON sp.admissionId = cd.id
        JOIN currentsessionmaster sess ON sess.id = pd.sessionId
        JOIN course crs ON crs.id = cd.courseId
        JOIN classes c ON c.id = cd.classId
        JOIN shift sf ON sf.id = cd.shiftId
        WHERE cd.transferred = true
        AND sess.id = ${oldSessionId}

        ORDER BY 
            CASE WHEN course = 'Grand Total' THEN 2 ELSE 1 END,
            course;
    `)) as [OldAdmissionStats[], any];

  return stats;
}

export async function getMetadata(oldSession: OldSession) {
  const [[oldAcademicYear]] = (await mysqlConnection.query(`
        SELECT * FROM accademicyear WHERE sessionId = ${oldSession.id!};
    `)) as [OldAcademicYear[], any];

  const academicYearName = `${oldAcademicYear.accademicYearName}-${(Number(oldAcademicYear.accademicYearName) + 1) % 100}`;

  let [foundAcademicYear] = await db
    .select()
    .from(academicYearModel)
    .where(
      or(
        eq(academicYearModel.legacyAcademicYearId, oldAcademicYear.id!),
        ilike(academicYearModel.year, academicYearName),
      ),
    );

  console.log("foundAcademicYear", foundAcademicYear);
  if (!foundAcademicYear) {
    foundAcademicYear = (
      await db
        .insert(academicYearModel)
        .values({
          legacyAcademicYearId: oldAcademicYear.id!,
          year: academicYearName,
          isCurrentYear: oldAcademicYear.presentAcademicYear,
        })
        .returning()
    )[0];
  }

  let [foundSession] = await db
    .select()
    .from(sessionModel)
    .where(
      and(
        ilike(sessionModel.name, oldSession.sessionName.trim()),
        eq(sessionModel.academicYearId, foundAcademicYear.id!),
      ),
    );
  if (!foundSession) {
    foundSession = (
      await db
        .insert(sessionModel)
        .values({
          legacySessionId: oldSession.id!,
          name: oldSession.sessionName.trim(),
          from: new Date(oldSession.fromDate as any).toISOString().slice(0, 10),
          to: new Date(oldSession.toDate as any).toISOString().slice(0, 10),
          isCurrentSession: oldSession.iscurrentsession,
          codePrefix: oldSession.codeprefix,
          academicYearId: foundAcademicYear.id!,
        })
        .returning()
    )[0];
  }

  return { oldAcademicYear, foundAcademicYear, foundSession };
}

export async function upsertUser(
  oldData: OldStudent | OldStaff,
  type: (typeof userTypeEnum.enumValues)[number],
) {
  if (!oldData) {
    return undefined;
  }

  if (
    type === "STUDENT" &&
    (!(oldData as OldStudent).codeNumber ||
      (oldData as OldStudent).codeNumber.trim() === "")
  ) {
    throw new Error("UID is required for student");
  }

  if (type !== "STAFF" && type !== "STUDENT") {
    throw new Error("Invalid old details type");
  }

  let phone: string | undefined =
    oldData.contactNo?.trim() || oldData.phoneMobileNo?.trim();
  let whatsappNumber: string | undefined = oldData.contactNo?.trim();

  const cleanString = (value: unknown): string | undefined => {
    if (typeof value === "string") {
      return value.replace(/[\s\-\/]/g, "").trim();
    }
    return undefined;
  };

  const hashedPassword = await bcrypt.hash("default", 10);

  // Check if user already exists by legacyId OR email
  let existingUser;
  const email =
    type === "STUDENT"
      ? `${cleanString((oldData as OldStudent).codeNumber)}@thebges.edu.in`
      : oldData.email?.trim();
  if (email) {
    // Check by legacyId email and type
    [existingUser] = await db
      .select()
      .from(userModel)
      .where(and(eq(userModel.email, email), eq(userModel.type, type)));
  } else {
    throw Error("Email is required for user");
  }

  if (existingUser) {
    console.log(
      `User with legacy ID ${oldData.id} or email ${oldData?.email} already exists, skipping creation`,
    );

    const [updatedUser] = await db
      .update(userModel)
      .set({
        name: oldData.name ?? "",
        phone,
        type,
        whatsappNumber,
      })
      .where(eq(userModel.id, existingUser.id as number))
      .returning();

    return updatedUser;
  }

  // Create the new user
  let newUser: User | undefined;

  try {
    [newUser] = await db
      .insert(userModel)
      .values({
        name: oldData.name ?? "",
        email: email!,
        password: hashedPassword,
        phone,
        type,
        whatsappNumber,
      })
      .returning();
  } catch (error: any) {
    // If there's a duplicate key error, try to find the existing user
    throw error;
  }

  if (!newUser) {
    throw new Error("Failed to create or find user");
  }

  if (type === "STAFF") {
    if (oldData.id) {
      await upsertStaff(oldData.id, newUser);
      await db
        .update(userModel)
        .set({
          isActive: !!(oldData as OldStaff).active,
        })
        .where(eq(userModel.id, newUser.id as number));
    }
  }

  return newUser;
}

export async function upsertStaff(oldStaffId: number, user: User) {
  const [[oldStaff]] = (await mysqlConnection.query(`
          SELECT *
          FROM staffpersonaldetails
          WHERE id = ${oldStaffId}
          `)) as [OldStaff[], any];

  if (!oldStaff) {
    return null;
  }

  const shift = await upsertShift(oldStaff.empShiftId);

  const personalDetails =
    await oldStudentAdmissionServices.upsertPersonalDetails(
      oldStaff,
      user.id as number,
    );

  await oldStudentAdmissionServices.upsertFamily2(oldStaff, user.id as number);

  const studentCategory = await oldStudentAdmissionServices.addStudentCategory(
    oldStaff.studentCategoryId,
  );

  await oldStudentAdmissionServices.upsertHealth(oldStaff, user.id as number);

  await oldStudentAdmissionServices.upsertEmergencyContact(
    {
      personName: oldStaff.emergencyname ?? undefined,
      havingRelationAs: oldStaff.emergencyrelationship ?? undefined,
      email: undefined,
      phone: oldStaff.emergencytelmobile ?? undefined,
      officePhone: oldStaff.emergencytellandno ?? undefined,
      residentialPhone: undefined,
    } as EmergencyContact,
    user.id as number,
  );

  await oldStudentAdmissionServices.addBank(oldStaff.bankid);
  let board: Board | undefined = undefined;
  if (oldStaff.board) {
    const [existingBoard] = await db
      .select()
      .from(boardModel)
      .where(eq(boardModel.name, oldStaff.board.trim()));
    if (!existingBoard) {
      const [newBoard] = await db
        .insert(boardModel)
        .values({
          name: oldStaff.board.trim(),
        })
        .returning();
      board = newBoard;
    } else {
      board = existingBoard;
    }
  }

  let existingStaff = (
    await db
      .select()
      .from(staffModel)
      .where(eq(staffModel.userId, user.id as number))
  )[0];

  if (existingStaff) {
    const [updatedStaff] = await db
      .update(staffModel)
      .set({
        boardId: board?.id ?? undefined,
        attendanceCode: oldStaff.staffAttendanceCode ?? undefined,
        uid: oldStaff.uid ? String(oldStaff.uid) : undefined,
        codeNumber: oldStaff.codeNumber ?? undefined,
        shiftId: shift?.id ?? undefined,
        gratuityNumber: oldStaff.gratuityno ?? undefined,
        // personalDetailsId: personalDetails?.id ?? undefined,
        // familyDetailsId: familyDetails?.id ?? undefined,
        studentCategoryId: studentCategory?.id ?? undefined,
        // healthId: health?.id ?? undefined,
        // emergencyContactId: emergencyContact?.id ?? undefined,
        computerOperationKnown: !!oldStaff.computeroperationknown,
        bankBranchId: undefined,
        // Optional academic links not resolvable from legacy staff payload
        bankAccountNumber: oldStaff.bankAccNo ?? undefined,
        banlIfscCode: oldStaff.bankifsccode ?? undefined,
        bankAccountType: oldStaff.bankacctype
          ? (((t) =>
              t === "SAVINGS" ||
              t === "CURRENT" ||
              t === "FIXED_DEPOSIT" ||
              t === "RECURRING_DEPOSIT" ||
              t === "OTHER"
                ? t
                : "OTHER")(String(oldStaff.bankacctype).trim()) as any)
          : undefined,
        providentFundAccountNumber: oldStaff.providentFundAccNo ?? undefined,
        panNumber: oldStaff.panNo ?? undefined,
        esiNumber: oldStaff.esiNo ?? undefined,
        impNumber: oldStaff.impNo ?? undefined,
        clinicAddress: oldStaff.clinicAddress ?? undefined,
        hasPfNomination: !!oldStaff.pfnomination,
        childrens: oldStaff.childrens ?? undefined,
        majorChildName: oldStaff.majorChildName ?? undefined,
        majorChildPhone: oldStaff.majorChildContactNo ?? undefined,
        previousEmployeeName: oldStaff.privempnm ?? undefined,
        previousEmployeePhone: undefined,
        // previousEmployeeAddressId: previousEmployeeAddressId,
        gratuityNominationDate: oldStaff.gratuitynominationdt
          ? new Date(oldStaff.gratuitynominationdt as any)
          : undefined,
        univAccountNumber: oldStaff.univAccNo ?? undefined,
        dateOfConfirmation: oldStaff.dateofconfirmation
          ? new Date(oldStaff.dateofconfirmation)
          : undefined,
        dateOfProbation: oldStaff.dateofprobation
          ? new Date(oldStaff.dateofprobation)
          : undefined,
      })
      .where(eq(staffModel.id, existingStaff.id!))
      .returning();

    existingStaff = updatedStaff;
  } else {
    const [newStaff] = await db
      .insert(staffModel)
      .values({
        legacyStaffId: oldStaff.id,
        userId: user.id as number,
        boardId: board?.id ?? undefined,
        attendanceCode: oldStaff.staffAttendanceCode ?? undefined,
        uid: oldStaff.uid ? String(oldStaff.uid) : undefined,
        codeNumber: oldStaff.codeNumber ?? undefined,
        shiftId: shift?.id ?? undefined,
        gratuityNumber: oldStaff.gratuityno ?? undefined,
        // personalDetailsId: personalDetails?.id ?? undefined,
        // familyDetailsId: familyDetails?.id ?? undefined,
        studentCategoryId: studentCategory?.id ?? undefined,
        // healthId: health?.id ?? undefined,
        // emergencyContactId: emergencyContact?.id ?? undefined,
        computerOperationKnown: !!oldStaff.computeroperationknown,
        bankBranchId: undefined,
        // Optional academic links not resolvable from legacy staff payload
        bankAccountNumber: oldStaff.bankAccNo ?? undefined,
        banlIfscCode: oldStaff.bankifsccode ?? undefined,
        bankAccountType: oldStaff.bankacctype
          ? (((t) =>
              t === "SAVINGS" ||
              t === "CURRENT" ||
              t === "FIXED_DEPOSIT" ||
              t === "RECURRING_DEPOSIT" ||
              t === "OTHER"
                ? t
                : "OTHER")(String(oldStaff.bankacctype).trim()) as any)
          : undefined,
        providentFundAccountNumber: oldStaff.providentFundAccNo ?? undefined,
        panNumber: oldStaff.panNo ?? undefined,
        esiNumber: oldStaff.esiNo ?? undefined,
        impNumber: oldStaff.impNo ?? undefined,
        clinicAddress: oldStaff.clinicAddress ?? undefined,
        hasPfNomination: !!oldStaff.pfnomination,
        childrens: oldStaff.childrens ?? undefined,
        majorChildName: oldStaff.majorChildName ?? undefined,
        majorChildPhone: oldStaff.majorChildContactNo ?? undefined,
        previousEmployeeName: oldStaff.privempnm ?? undefined,
        previousEmployeePhone: undefined,
        // previousEmployeeAddressId: previousEmployeeAddressId,
        gratuityNominationDate: oldStaff.gratuitynominationdt
          ? new Date(oldStaff.gratuitynominationdt as any)
          : undefined,
        univAccountNumber: oldStaff.univAccNo ?? undefined,
        dateOfConfirmation: oldStaff.dateofconfirmation
          ? new Date(oldStaff.dateofconfirmation)
          : undefined,
        dateOfProbation: oldStaff.dateofprobation
          ? new Date(oldStaff.dateofprobation)
          : undefined,
      })
      .returning();
    existingStaff = newStaff;
  }

  // Previous employer address if present
  let previousEmployeeAddressId: number | undefined = undefined;
  if (oldStaff.privempaddrs) {
    const [addr] = await db
      .insert(addressModel)
      .values({
        staffId: existingStaff.id!,
        addressLine: oldStaff.privempaddrs.trim(),
        localityType: null,
      })
      .returning();
    previousEmployeeAddressId = addr.id as number;
  }

  let name = oldStaff.name ?? "";
  if (personalDetails?.middleName) {
    name += `${personalDetails?.middleName}`;
  }
  if (personalDetails?.lastName) {
    name += ` ${personalDetails?.lastName}`;
  }

  await db
    .update(userModel)
    .set({
      name,
    })
    .where(eq(userModel.id, user.id as number));

  return existingStaff;
}

async function processStudent(oldStudent: OldStudent) {
  const user = await upsertUser(oldStudent, "STUDENT");
  if (!user) {
    console.log("User not created for student", oldStudent.id);
    return;
  }

  const student = await oldStudentPersonalDetailsHelper.processStudent(
    oldStudent,
    user,
  );

  return student;
}

export async function upsertShift(oldShiftId: number | null) {
  if (!oldShiftId) return null;

  const [[shiftRow]] = (await mysqlConnection.query(
    `SELECT * FROM shift WHERE id = ${oldShiftId}`,
  )) as [OldShift[], any];

  if (!shiftRow) return null;

  const [foundShift] = await db
    .select()
    .from(shiftModel)
    .where(ilike(shiftModel.name, shiftRow.shiftName.trim()));

  if (foundShift) {
    const [updatedShift] = await db
      .update(shiftModel)
      .set({
        name: shiftRow.shiftName.trim(),
        codePrefix: shiftRow.codeprefix?.trim(),
      })
      .where(eq(shiftModel.id, foundShift.id as number))
      .returning();

    return updatedShift;
  }

  return (
    await db
      .insert(shiftModel)
      .values({
        legacyShiftId: oldShiftId,
        name: shiftRow.shiftName.trim(),
        codePrefix: shiftRow.codeprefix?.trim(),
      })
      .returning()
  )[0];
}

// Gives the list of students who are missing from the new system
// export async function brainstormOldMigration() {
//     const [[{ totalStudents }]] = (await mysqlConnection.query(`
//         SELECT COUNT(spd.id) AS totalStudents
//         FROM
//             studentpersonaldetails spd,
//             personaldetails pd,
//             coursedetails cd
//         WHERE
//             spd.admissionId = cd.id
//             AND pd.id = cd.parent_id
//             AND pd.sessionId = 18
//             AND cd.transferred = true;
//     `)) as [{ totalStudents: number }[], any];
//     console.log(`Total students: ${totalStudents}`);

//     const totalBatches = Math.ceil(totalStudents / BATCH_SIZE);

//     console.log(`Total batches: ${totalBatches}`);
//     console.log(`Batch size: ${BATCH_SIZE}`);
//     let grandMissingCount = 0;
//     for (let i = 0; i < totalBatches; i++) {
//         const offset = i * BATCH_SIZE;
//         const limit = BATCH_SIZE;

//         const [oldStudentIds] = (await mysqlConnection.query(`
//             SELECT
//                 id AS legacyStudentId,
//                 codeNumber
//             FROM studentpersonaldetails
//             WHERE admissionId IN (
//                 SELECT cd.id
//                 FROM
//                     coursedetails cd,
//                     personaldetails pd
//                 WHERE cd.parent_id = pd.id
//                 AND pd.sessionId = 18
//                 AND cd.transferred = true
//             )
//             ORDER BY id
//             LIMIT ${limit} OFFSET ${offset};
//         `)) as [{ legacyStudentId: number; codeNumber: string }[], any];

//         if (oldStudentIds.length === 0) {
//             console.log(`Batch ${i + 1}/${totalBatches}: no records`);
//             continue;
//         }

//         const legacyIds = oldStudentIds.map((r) => r.legacyStudentId);
//         const existing = await db
//             .select({ legacyStudentId: studentModel.legacyStudentId })
//             .from(studentModel)
//             .where(inArray(studentModel.legacyStudentId, legacyIds));

//         const existingSet = new Set(
//             existing
//                 .map((r) => r.legacyStudentId)
//                 .filter((v): v is number => typeof v === "number"),
//         );
//         const missing = legacyIds.filter((id) => !existingSet.has(id));

//         grandMissingCount += missing.length;
//         if (missing.length > 0) {
//             // Display the missing students code numbers
//             console.log(
//                 `Batch ${i + 1}/${totalBatches}: missing ${missing.length} students`,
//             );
//             console.log(
//                 oldStudentIds
//                     .filter((id) => missing.includes(id.legacyStudentId))
//                     .map((id) => id.codeNumber)
//                     .join("\n"),
//             );
//             //   console.log(missing.join(", "));
//         } else {
//             console.log(
//                 `Batch ${i + 1}/${totalBatches}: all ${legacyIds.length} present`,
//             );
//         }
//     }
//     console.log(`Total missing across all batches: ${grandMissingCount}`);
// }
