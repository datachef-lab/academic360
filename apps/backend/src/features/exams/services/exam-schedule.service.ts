import ExcelJS from "exceljs";
import { db, pool } from "@/db/index.js";
import JSZip from "jszip";
import fs from "fs/promises";
import * as programCourseServices from "@/features/course-design/services/program-course.service";
import * as paperServices from "@/features/course-design/services/paper.service";
import * as shiftService from "@/features/academics/services/shift.service";
import * as roomServices from "./room.service";
import { studentModel, userModel } from "@repo/db/schemas/models/user";
import { cuRegistrationCorrectionRequestModel } from "@repo/db/schemas/models/admissions/cu-registration-correction-request.model";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import {
  ExamDto,
  ExamProgramCourseDto,
  ExamRoomDto,
  ExamShiftDto,
  ExamSubjectDto,
  ExamSubjectTypeDto,
} from "@repo/db/dtos/exams";
import {
  academicYearModel,
  classModel,
  ExamCandidate,
  examCandidateModel,
  examModel,
  examProgramCourseModel,
  ExamRoom,
  examRoomModel,
  ExamRoomT,
  ExamShift,
  examShiftModel,
  ExamShiftT,
  ExamSubject,
  examSubjectModel,
  ExamSubjectType,
  examSubjectTypeModel,
  ExamT,
  examTypeModel,
  paperModel,
  programCourseModel,
  promotionModel,
  roomModel,
  sectionModel,
  sessionModel,
  shiftModel,
  subjectModel,
  subjectTypeModel,
} from "@repo/db/schemas";
import { CLIENT_RENEG_LIMIT } from "tls";
import { QRCodeService } from "@/services/qr-code.service";
import path from "path";
import { pdfGenerationService } from "@/services/pdf-generation.service";
import { findAcademicYearById } from "@/features/academics/services/academic-year.service";
import { findClassById } from "@/features/academics/services/class.service";
import { getShiftById } from "@/features/academics/controllers/shift.controller";
import { PaginatedResponse } from "@/utils/PaginatedResponse";
import { socketService } from "@/services/socketService";
import { PaperDto } from "@repo/db/dtos";
import { io } from "@/app";

export interface CountStudentsByPapersParams {
  classId: number;
  programCourseIds: number[];
  paperIds: number[];
  academicYearIds: number[];
  shiftIds?: number[];
}

/**
 * Count students eligible for exam based on selected papers
 * - For mandatory papers: count all students in program course + class
 * - For optional papers: count only students who selected that subject
 * - Only count active students (user.isActive = true)
 * - Get student IDs from latest promotions
 */
async function getEligibleStudentIds(
  params: CountStudentsByPapersParams,
): Promise<number[]> {
  const { classId, programCourseIds, paperIds, academicYearIds, shiftIds } =
    params;

  console.log("[EXAM-SCHEDULE] Getting eligible student IDs:", params);

  if (
    paperIds.length === 0 ||
    programCourseIds.length === 0 ||
    academicYearIds.length === 0
  ) {
    return [];
  }

  const shiftFilter =
    shiftIds && shiftIds.length > 0 ? "AND pr.shift_id_fk = ANY($5)" : "";

  //   const eligibleSql = `
  //         WITH filtered_papers AS (
  //             SELECT
  //                 p.id,
  //                 p.subject_id_fk,
  //                 p.subject_type_id_fk,
  //                 p.class_id_fk,
  //                 p.programe_course_id_fk,
  //                 p.academic_year_id_fk,
  //                 p.is_optional
  //             FROM papers p
  //             WHERE p.id = ANY($1)
  //               AND p.class_id_fk = $2
  //               AND p.programe_course_id_fk = ANY($3)
  //               AND p.academic_year_id_fk = ANY($4)
  //               AND p.is_active = TRUE
  //         ),
  //         latest_promotions AS (
  //             SELECT DISTINCT ON (pr.student_id_fk)
  //                    pr.student_id_fk,
  //                    pr.program_course_id_fk,
  //                    pr.session_id_fk,
  //                    pr.class_id_fk
  //             FROM promotions pr
  //             INNER JOIN sessions sess ON sess.id = pr.session_id_fk
  //             WHERE pr.class_id_fk = $2
  //               AND pr.program_course_id_fk = ANY($3)
  //               AND sess.academic_id_fk = ANY($4)
  //               ${shiftFilter}
  //             ORDER BY pr.student_id_fk,
  //                      pr.start_date DESC NULLS LAST,
  //                      pr.created_at DESC,
  //                      pr.id DESC
  //         ),
  //         latest_student_selections AS (
  //             SELECT id,
  //                    student_id_fk,
  //                    subject_id_fk,
  //                    subject_selection_meta_id_fk
  //             FROM (
  //                 SELECT sss.*,
  //                        ROW_NUMBER() OVER (
  //                          PARTITION BY sss.student_id_fk, sss.subject_selection_meta_id_fk
  //                          ORDER BY sss.version DESC,
  //                                   sss.updated_at DESC NULLS LAST,
  //                                   sss.created_at DESC,
  //                                   sss.id DESC
  //                        ) AS rn
  //                 FROM student_subject_selections sss
  //                 WHERE sss.is_active = TRUE
  //             ) ranked
  //             WHERE rn = 1
  //         ),
  //         mandatory AS (
  //             SELECT DISTINCT std.id AS student_id
  //             FROM filtered_papers fp
  //             JOIN latest_promotions pr
  //               ON pr.program_course_id_fk = fp.programe_course_id_fk
  //              AND pr.class_id_fk = fp.class_id_fk
  //             JOIN students std ON std.id = pr.student_id_fk
  //             JOIN users u ON u.id = std.user_id_fk
  //             WHERE fp.is_optional = FALSE
  //               AND u.is_active = TRUE
  //         ),
  //         optional AS (
  //             SELECT DISTINCT std.id AS student_id
  //             FROM filtered_papers fp
  //             JOIN latest_promotions pr
  //               ON pr.program_course_id_fk = fp.programe_course_id_fk
  //              AND pr.class_id_fk = fp.class_id_fk
  //             JOIN students std ON std.id = pr.student_id_fk
  //             JOIN users u ON u.id = std.user_id_fk
  //             JOIN latest_student_selections lss
  //               ON lss.student_id_fk = std.id
  //              AND lss.subject_id_fk = fp.subject_id_fk
  //             JOIN subject_selection_meta sm
  //               ON sm.id = lss.subject_selection_meta_id_fk
  //              AND sm.subject_type_id_fk = fp.subject_type_id_fk
  //             JOIN subject_selection_meta_classes smc
  //               ON smc.subject_selection_meta_id_fk = sm.id
  //              AND smc.class_id_fk = fp.class_id_fk
  //             WHERE fp.is_optional = TRUE
  //               AND u.is_active = TRUE
  //         )
  //         SELECT DISTINCT student_id
  //         FROM (
  //             SELECT * FROM mandatory
  //             UNION ALL
  //             SELECT * FROM optional
  //         ) eligible_students
  //     `;

  const eligibleSql = `
  WITH current_promotions AS (
    -- Get the latest promotion specifically for the requested class + academic year + program + shift
    SELECT DISTINCT ON (pr.student_id_fk)
        pr.student_id_fk AS student_id,
        pr.program_course_id_fk,
        pr.class_id_fk,
        pr.shift_id_fk
    FROM promotions pr
    JOIN sessions s ON s.id = pr.session_id_fk
    JOIN academic_years ay ON ay.id = s.academic_id_fk
    WHERE pr.is_alumni = FALSE
      AND pr.class_id_fk = $2                    -- requested class (e.g., Semester I)
      AND ay.id = ANY($3)                        -- requested academic year(s)
      AND pr.program_course_id_fk = ANY($4)      -- requested program course(s)
      ${shiftIds && shiftIds.length > 0 ? "AND pr.shift_id_fk = ANY($5)" : ""}
    ORDER BY pr.student_id_fk,
             pr.start_date DESC NULLS LAST,
             pr.created_at DESC
  ),

  filtered_papers AS (
    SELECT 
        p.id AS paper_id,
        p.subject_id_fk,
        p.subject_type_id_fk,
        p.is_optional
    FROM papers p
    WHERE p.id = ANY($1)
      AND p.class_id_fk = $2
      AND p.programe_course_id_fk = ANY($4)
      AND p.academic_year_id_fk = ANY($3)
      AND p.is_active = TRUE
  ),

  latest_student_selections AS (
    SELECT 
        student_id_fk, 
        subject_id_fk, 
        subject_selection_meta_id_fk
    FROM (
        SELECT sss.*,
               ROW_NUMBER() OVER (
                 PARTITION BY sss.student_id_fk, sss.subject_selection_meta_id_fk
                 ORDER BY sss.version DESC,
                          sss.updated_at DESC NULLS LAST,
                          sss.created_at DESC,
                          sss.id DESC
               ) AS rn
        FROM student_subject_selections sss
        WHERE sss.is_active = TRUE
    ) ranked
    WHERE rn = 1
  ),

  mandatory_students AS (
    SELECT DISTINCT cp.student_id
    FROM current_promotions cp
    CROSS JOIN filtered_papers fp
    WHERE fp.is_optional = FALSE
  ),

  optional_students AS (
    SELECT DISTINCT cp.student_id
    FROM current_promotions cp
    JOIN filtered_papers fp ON fp.is_optional = TRUE
    JOIN latest_student_selections lss
      ON lss.student_id_fk = cp.student_id
     AND lss.subject_id_fk = fp.subject_id_fk
    JOIN subject_selection_meta sm
      ON sm.id = lss.subject_selection_meta_id_fk
     AND sm.subject_type_id_fk = fp.subject_type_id_fk
    JOIN subject_selection_meta_classes smc
      ON smc.subject_selection_meta_id_fk = sm.id
     AND smc.class_id_fk = $2
  )

  SELECT DISTINCT student_id
  FROM (
    SELECT student_id FROM mandatory_students
    UNION
    SELECT student_id FROM optional_students
  ) eligible
  ORDER BY student_id;
`;

  const eligibleParams: any[] = [
    paperIds, // $1
    classId, // $2
    academicYearIds, // $3
    programCourseIds, // $4
  ];

  if (shiftIds && shiftIds.length > 0) {
    eligibleParams.push(shiftIds);
  }

  const { rows } = await pool.query(eligibleSql, eligibleParams);

  return rows
    .map((row: { student_id: number }) => Number(row.student_id))
    .filter((id: number) => !Number.isNaN(id));
}

export async function countStudentsByPapers(
  params: CountStudentsByPapersParams,
): Promise<number> {
  const eligibleIds = await getEligibleStudentIds(params);
  return eligibleIds.length;
}

export interface GetStudentsByPapersParams extends CountStudentsByPapersParams {
  assignBy: "UID" | "CU Reg. No.";
}

export interface StudentWithSeat {
  studentId: number;
  uid: string;
  name: string;
  email: string;
  whatsappPhone: string;
  cuRegistrationApplicationNumber: string | null;
  floorName: string | null;
  roomName: string;
  seatNumber: string;
}

/**
 * Get students eligible for exam with seat assignments
 * Returns students with their assigned floor, room, and seat numbers
 */
// export async function getStudentsByPapers(
//     params: GetStudentsByPapersParams,
//     roomAssignments: Array<{
//         roomId: number;
//         floorId: number | null;
//         floorName: string | null;
//         roomName: string;
//         maxStudentsPerBench: number;
//         numberOfBenches: number;
//     }>,
// ): Promise<StudentWithSeat[]> {
//     const {
//         classId,
//         programCourseIds,
//         paperIds,
//         academicYearIds,
//         shiftIds,
//         assignBy,
//     } = params;

//     if (
//         paperIds.length === 0 ||
//         programCourseIds.length === 0 ||
//         academicYearIds.length === 0
//     ) {
//         return [];
//     }

//     try {
//         const studentIdsArray = await getEligibleStudentIds(params);

//         if (studentIdsArray.length === 0) {
//             return [];
//         }

//         // Fetch student details with user info and CU registration application number
//         const students = await db
//             .select({
//                 studentId: studentModel.id,
//                 uid: studentModel.uid,
//                 userId: studentModel.userId,
//                 userName: userModel.name,
//                 userEmail: userModel.email,
//                 userWhatsappPhone: userModel.whatsappNumber,
//                 cuRegistrationApplicationNumber:
//                     cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
//             })
//             .from(studentModel)
//             .innerJoin(userModel, eq(userModel.id, studentModel.userId))
//             .leftJoin(
//                 cuRegistrationCorrectionRequestModel,
//                 eq(cuRegistrationCorrectionRequestModel.studentId, studentModel.id),
//             )
//             .where(inArray(studentModel.id, studentIdsArray));

//         // Sort students based on assignBy
//         students.sort((a, b) => {
//             if (assignBy === "UID") {
//                 return (a.uid || "").localeCompare(b.uid || "");
//             } else {
//                 // Sort by CU Registration Application Number
//                 const aAppNum = a.cuRegistrationApplicationNumber || "";
//                 const bAppNum = b.cuRegistrationApplicationNumber || "";
//                 return aAppNum.localeCompare(bAppNum);
//             }
//         });

//         // Assign seats to students
//         const studentsWithSeats: StudentWithSeat[] = [];
//         let studentIndex = 0;

//         for (const roomAssignment of roomAssignments) {
//             const {
//                 roomId,
//                 floorId,
//                 floorName,
//                 roomName,
//                 maxStudentsPerBench,
//                 numberOfBenches,
//             } = roomAssignment;
//             const roomCapacity = numberOfBenches * maxStudentsPerBench;

//             for (
//                 let bench = 1;
//                 bench <= numberOfBenches && studentIndex < students.length;
//                 bench++
//             ) {
//                 // Generate seat positions: extreme left and right based on maxStudentsPerBench
//                 const seatPositions = generateSeatPositions(maxStudentsPerBench);

//                 for (const position of seatPositions) {
//                     if (studentIndex >= students.length) break;

//                     const student = students[studentIndex]!;
//                     const seatNumber = `${bench}${position}`;

//                     studentsWithSeats.push({
//                         studentId: student.studentId,
//                         uid: student.uid || "",
//                         name: student.userName || "",
//                         email: student.userEmail || "",
//                         whatsappPhone: student.userWhatsappPhone || "",
//                         cuRegistrationApplicationNumber:
//                             student.cuRegistrationApplicationNumber,
//                         floorName,
//                         roomName,
//                         seatNumber,
//                     });

//                     studentIndex++;
//                 }
//             }
//         }

//         return studentsWithSeats;
//     } catch (error) {
//         console.error("[EXAM-SCHEDULE] Error fetching students:", error);
//         throw error;
//     }
// }
export async function getStudentsByPapers(
  params: GetStudentsByPapersParams,
  roomAssignments: Array<{
    roomId: number;
    floorId: number | null;
    floorName: string | null;
    roomName: string;
    maxStudentsPerBench: number;
    numberOfBenches: number;
    capacity: number;
  }>,
): Promise<StudentWithSeat[]> {
  console.log("[EXAM-SCHEDULE] Getting students by papers:", params);
  console.log("[EXAM-SCHEDULE] Room assignments:", roomAssignments);
  const studentIds = await getEligibleStudentIds(params);
  console.log("[EXAM-SCHEDULE] Student IDs:", studentIds);
  if (studentIds.length === 0) return [];

  //   const students = await db
  //     .select({
  //       studentId: studentModel.id,
  //       uid: studentModel.uid,
  //       userName: userModel.name,
  //       userEmail: userModel.email,
  //       userWhatsappPhone: userModel.whatsappNumber,
  //       cuRegistrationApplicationNumber:
  //         cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
  //     })
  //     .from(studentModel)
  //     .innerJoin(userModel, eq(userModel.id, studentModel.userId))
  //     .leftJoin(
  //       cuRegistrationCorrectionRequestModel,
  //       eq(cuRegistrationCorrectionRequestModel.studentId, studentModel.id),
  //     )
  //     .where(inArray(studentModel.id, studentIds));

  const students = await db
    .select({
      studentId: studentModel.id,
      uid: studentModel.uid,
      userName: userModel.name,
      userEmail: userModel.email,
      userWhatsappPhone: userModel.whatsappNumber,
      cuRegistrationApplicationNumber:
        cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
    })
    .from(studentModel)
    .innerJoin(
      userModel,
      and(
        eq(userModel.id, studentModel.userId),
        eq(userModel.isActive, true), // ← Critical fix
      ),
    )
    .leftJoin(
      cuRegistrationCorrectionRequestModel,
      eq(cuRegistrationCorrectionRequestModel.studentId, studentModel.id),
    )
    .where(inArray(studentModel.id, studentIds));

  //   console.log("[EXAM-SCHEDULE] Students:", students);

  students.sort((a, b) =>
    params.assignBy === "UID"
      ? (a.uid || "").localeCompare(b.uid || "")
      : (a.cuRegistrationApplicationNumber || "").localeCompare(
          b.cuRegistrationApplicationNumber || "",
        ),
  );

  const result: StudentWithSeat[] = [];
  let studentIdx = 0;

  for (const room of roomAssignments) {
    console.log("[EXAM-SCHEDULE] Room:", room);
    const letters = generateSeatPositions(room.maxStudentsPerBench);
    console.log("[EXAM-SCHEDULE] Letters:", letters);
    let seatIdx = 0;

    while (
      studentIdx < students.length &&
      seatIdx <
        (room.capacity || room.maxStudentsPerBench * room.numberOfBenches)
    ) {
      const bench = Math.floor(seatIdx / room.maxStudentsPerBench) + 1;
      const letter = letters[seatIdx % room.maxStudentsPerBench];
      const seatNumber = `${bench}${letter}`;

      const s = students[studentIdx++];
      result.push({
        studentId: s.studentId,
        uid: s.uid || "",
        name: s.userName || "",
        email: s.userEmail || "",
        whatsappPhone: s.userWhatsappPhone || "",
        cuRegistrationApplicationNumber: s.cuRegistrationApplicationNumber,
        floorName: room.floorName,
        roomName: room.roomName,
        seatNumber,
      });
      seatIdx++;
    }
  }

  console.log("getStudentsbyPapers(), result:", result.length);

  return result;
}

/**
 * Generate seat positions for extreme left and right placement
 * Prioritizes extreme positions to maximize space between students
 * Pattern: Fill positions starting from extremes, working inward
 * For 2 students: A, C (extreme left and right, skip B)
 * For 3 students: A, B, C (all positions)
 * For 4 students: A, D, B, C (extremes first, then fill middle)
 * For 5 students: A, E, B, D, C (extremes first, then alternate inward)
 */
function generateSeatPositions(maxStudentsPerBench: number): string[] {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const positions: string[] = [];

  if (maxStudentsPerBench === 1) {
    return ["A"];
  } else if (maxStudentsPerBench === 2) {
    // Extreme left and right: A, C (skip B)
    return ["A", "C"];
  } else if (maxStudentsPerBench === 3) {
    // All positions: A, B, C
    return ["A", "B", "C"];
  } else {
    // For 4+: Fill from extremes inward
    // Strategy: Alternate between left and right extremes
    const usedIndices = new Set<number>();

    let leftIndex = 0;
    let rightIndex = maxStudentsPerBench - 1;

    // Alternate between left and right extremes
    while (positions.length < maxStudentsPerBench) {
      // Add from left if available
      if (leftIndex <= rightIndex && !usedIndices.has(leftIndex)) {
        positions.push(letters[leftIndex]!);
        usedIndices.add(leftIndex);
        leftIndex++;
      }

      // Add from right if available
      if (
        rightIndex >= leftIndex &&
        !usedIndices.has(rightIndex) &&
        positions.length < maxStudentsPerBench
      ) {
        positions.push(letters[rightIndex]!);
        usedIndices.add(rightIndex);
        rightIndex--;
      }
    }

    // Sort to maintain alphabetical order
    positions.sort((a, b) => {
      const indexA = letters.indexOf(a);
      const indexB = letters.indexOf(b);
      return indexA - indexB;
    });
  }

  return positions;
}

export async function createExamAssignment(dto: ExamDto) {
  return await db.transaction(async (tx) => {
    console.log(
      "[EXAM-SCHEDULE:createExamAssignment] Creating exam assignment:",
      dto,
    );
    // 1. Create exam record
    const [exam] = await tx
      .insert(examModel)
      .values({
        academicYearId: dto.academicYear.id!,
        examTypeId: dto.examType.id!,
        classId: dto.class.id!,

        gender: dto.gender,
        orderType: dto.orderType,
      })
      .returning();

    if (!exam) throw new Error("Failed to create exam");

    // 2. Insert exam rooms
    const roomIdToExamRoom = new Map<number, any>();
    for (const loc of dto.locations) {
      const [er] = await tx
        .insert(examRoomModel)
        .values({
          examId: exam.id,
          roomId: loc.room.id!,
          capacity: loc.capacity,
          studentsPerBench: loc.studentsPerBench,
        })
        .returning();

      roomIdToExamRoom.set(loc.room.id!, er);
    }

    // 3. Insert related records (program courses, shifts, subject types)
    await Promise.all([
      ...dto.examProgramCourses.map((pc) =>
        tx.insert(examProgramCourseModel).values({
          examId: exam.id,
          programCourseId: pc.programCourse.id!,
        }),
      ),
      ...dto.examShifts.map((s) =>
        tx.insert(examShiftModel).values({
          examId: exam.id,
          shiftId: s.shift.id!,
        }),
      ),
      ...dto.examSubjectTypes.map((st) =>
        tx.insert(examSubjectTypeModel).values({
          examId: exam.id,
          subjectTypeId: st.subjectType.id!,
        }),
      ),
    ]);

    // 4. Insert exam subjects
    const subjectToExamSubject = new Map<number, number>();
    for (const subj of dto.examSubjects) {
      const [es] = await tx
        .insert(examSubjectModel)
        .values({
          examId: exam.id,
          subjectId: subj.subject.id!,
          startTime: subj.startTime ? new Date(subj.startTime) : new Date(),
          endTime: subj.endTime ? new Date(subj.endTime) : new Date(),
        })
        .returning();
      subjectToExamSubject.set(subj.subject.id!, es.id);
    }

    // 5. Resolve paperIds exactly like getEligibleStudentIds()
    const subjectIds = dto.examSubjects.map((s) => s.subject.id!);
    const subjectTypeIds = dto.examSubjectTypes.map((st) => st.subjectType.id!);
    const programCourseIds = dto.examProgramCourses.map(
      (pc) => pc.programCourse.id!,
    );
    const shiftIds = dto.examShifts.map((s) => s.shift.id!);

    // CRITICAL: Always pass arrays — even if single value or empty
    const safeArray = <T>(arr: T[] | T | undefined): T[] =>
      Array.isArray(arr) ? arr : arr != null ? [arr] : [];

    // Use safe arrays everywhere
    const programCourseIdsArr = safeArray(programCourseIds);
    const subjectIdsArr = safeArray(subjectIds);
    const subjectTypeIdsArr = safeArray(subjectTypeIds);
    const shiftIdsArr = safeArray(shiftIds);

    // const paperResult = await tx.execute(sql`
    //         SELECT DISTINCT p.id
    //         FROM papers p
    //         WHERE p.class_id_fk = ${dto.class.id!}
    //           AND p.programe_course_id_fk = ANY(${programCourseIds}::int[])
    //           AND p.academic_year_id_fk = ${dto.academicYear.id!}
    //           AND p.subject_id_fk = ANY(${subjectIds}::int[])
    //           AND p.subject_type_id_fk = ANY(${subjectTypeIds}::int[])
    //           AND p.is_active = TRUE
    //     `);

    // Build the WHERE conditions dynamically so we never send an empty array to ANY()
    // const conditions = [
    //   sql`p.class_id_fk = ${dto.class.id!}`,
    //   // Always an array now → safe for ANY()
    //   sql`p.programe_course_id_fk = ANY(${programCourseIdsArr}::int[])`,
    //   sql`p.academic_year_id_fk = ${dto.academicYear.id!}`,
    //   sql`p.is_active = TRUE`,
    // ];

    // if (subjectIdsArr.length > 0) {
    //   conditions.push(sql`p.subject_id_fk = ANY(${subjectIdsArr}::int[])`);
    // }

    // if (subjectTypeIdsArr.length > 0) {
    //   conditions.push(
    //     sql`p.subject_type_id_fk = ANY(${subjectTypeIdsArr}::int[])`,
    //   );
    // }

    // const paperResult = await tx.execute(sql`
    //     SELECT DISTINCT p.id
    //     FROM papers p
    //     WHERE ${sql.join(conditions, sql` AND `)}
    //   `);

    console.log("[DEBUG] Using interpolated array query for papers");

    //     // 5. Resolve paperIds — THIS MUST BE THE ONLY VERSION
    //     const paperResult = await tx.execute(sql`
    //       SELECT DISTINCT p.id
    //       FROM papers p
    //       WHERE p.class_id_fk = ${dto.class.id!}
    //         AND p.programe_course_id_fk = ANY(${programCourseIdsArr}::int[])
    //         AND p.academic_year_id_fk = ${dto.academicYear.id!}
    //         AND p.is_active = TRUE
    //         ${subjectIdsArr.length > 0 ? sql`AND p.subject_id_fk = ANY(${subjectIdsArr}::int[])` : sql``}
    //         ${subjectTypeIdsArr.length > 0 ? sql`AND p.subject_type_id_fk = ANY(${subjectTypeIdsArr}::int[])` : sql``}
    //     `);

    //     console.log("[DEBUG] Paper query executed with arrays:", {
    //       programCourseIdsArr,
    //       subjectIdsArr,
    //       subjectTypeIdsArr,
    //     });

    //     const paperIds = paperResult.rows.map((r: any) => Number(r.id));
    //   if (paperIds.length === 0) {
    //     throw new Error("No active papers found for the given subjects");
    //   }

    // 5. Resolve paperIds safely
    console.log("[DEBUG] Using interpolated array query for papers,");
    console.log("[DEBUG] Program course IDs:", programCourseIdsArr);
    console.log("[DEBUG] Academic year ID:", dto.academicYear.id!);
    console.log("[DEBUG] Subject IDs:", subjectIdsArr);
    console.log("[DEBUG] Subject type IDs:", subjectTypeIdsArr);
    console.log("[DEBUG] Class ID:", dto.class.id!);
    console.log("[DEBUG] Shift IDs:", shiftIdsArr);

    // 5. Resolve paperIds — ONLY THIS VERSION
    // const paperResult = await tx.execute(
    //     sql`
    //       SELECT DISTINCT p.id
    //       FROM papers p
    //       WHERE p.class_id_fk = ${dto.class.id!}
    //         AND p.programe_course_id_fk = ANY(ARRAY[${sql.join(programCourseIdsArr, sql`, `)}]::int[])
    //         AND p.academic_year_id_fk = ${dto.academicYear.id!}
    //         AND p.is_active = TRUE
    //         ${subjectIdsArr.length > 0
    //           ? sql`AND p.subject_id_fk = ANY(ARRAY[${sql.join(subjectIdsArr, sql`, `)}]::int[])`
    //           : sql``}
    //         ${subjectTypeIdsArr.length > 0
    //           ? sql`AND p.subject_type_id_fk = ANY(ARRAY[${sql.join(subjectTypeIdsArr, sql`, `)}]::int[])`
    //           : sql``}
    //     `
    //   );
    //   console.log("[DEBUG] Paper result:", paperResult);

    // console.log("[DEBUG] Paper query executed with arrays:", {
    //   programCourseIdsArr,
    //   subjectIdsArr,
    //   subjectTypeIdsArr,
    // });

    // const paperIds = paperResult.rows.map((r: any) => Number(r.id));
    // if (paperIds.length === 0) {
    //   throw new Error("No active papers found for the given subjects");
    // }

    // 5️⃣ Resolve papers PER subject + subject type
    const paperRows = await tx.execute(
      sql`
      SELECT
        p.id,
        p.subject_id_fk,
        p.subject_type_id_fk
      FROM papers p
      WHERE p.class_id_fk = ${dto.class.id!}
        AND p.programe_course_id_fk = ANY(ARRAY[${sql.join(programCourseIdsArr, sql`, `)}]::int[])
        AND p.academic_year_id_fk = ${dto.academicYear.id!}
        AND p.is_active = TRUE
        ${
          subjectIdsArr.length > 0
            ? sql`AND p.subject_id_fk = ANY(ARRAY[${sql.join(subjectIdsArr, sql`, `)}]::int[])`
            : sql``
        }
        ${
          subjectTypeIdsArr.length > 0
            ? sql`AND p.subject_type_id_fk = ANY(ARRAY[${sql.join(subjectTypeIdsArr, sql`, `)}]::int[])`
            : sql``
        }
    `,
    );

    if (paperRows.rows.length === 0) {
      throw new Error("No active papers found for the given configuration");
    }

    // Map: subjectId|subjectTypeId → paperId
    const paperMap = new Map<string, number>();

    for (const row of paperRows.rows as any[]) {
      const key = `${row.subject_id_fk}|${row.subject_type_id_fk}`;
      paperMap.set(key, Number(row.id));
    }

    console.log("[DEBUG] Paper map:", paperMap);

    // 6. Prepare seat assignment
    const seatParams: GetStudentsByPapersParams = {
      classId: dto.class.id!,
      programCourseIds: programCourseIdsArr, // ← now always array
      paperIds: Array.from(paperMap.values()),
      academicYearIds: [dto.academicYear.id!],
      shiftIds: shiftIdsArr.length > 0 ? shiftIdsArr : undefined,
      assignBy: dto.orderType === "UID" ? "UID" : "CU Reg. No.",
    };
    console.log("[EXAM-SCHEDULE] Seat parameters:", seatParams);
    const roomAssignments = dto.locations.map((l) => ({
      roomId: l.room.id!,
      floorId: l.room.floor?.id ?? null,
      floorName: l.room.floor?.name ?? null,
      roomName: l.room.name,
      maxStudentsPerBench: l.studentsPerBench,
      numberOfBenches: l.room.numberOfBenches,
      capacity: l.capacity || l.room.numberOfBenches * l.studentsPerBench,
    }));
    console.log("[EXAM-SCHEDULE] Room assignments:", roomAssignments);
    const studentsWithSeats = await getStudentsByPapers(
      seatParams,
      roomAssignments,
    );
    if (studentsWithSeats.length === 0)
      throw new Error("No eligible students found");

    // 7. Batch fetch latest promotion for each student (using ROW_NUMBER)
    const studentIds = studentsWithSeats.map((s) => s.studentId);

    const promotionSubquery = tx
      .select({
        studentId: promotionModel.studentId,
        promotionId: promotionModel.id,
        rn: sql<number>`ROW_NUMBER() OVER (
                    PARTITION BY ${promotionModel.studentId}
                    ORDER BY ${promotionModel.startDate} DESC NULLS LAST,
                             ${promotionModel.createdAt} DESC,
                             ${promotionModel.id} DESC
                )`.as("rn"),
      })
      .from(promotionModel)
      .innerJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
      .where(
        and(
          inArray(promotionModel.studentId, studentIds),
          eq(promotionModel.classId, dto.class.id!),
          inArray(promotionModel.programCourseId, programCourseIds),
          eq(sessionModel.academicYearId, dto.academicYear.id!),
          shiftIds.length > 0
            ? inArray(promotionModel.shiftId, shiftIds)
            : sql`TRUE`,
        ),
      )
      .as("promotion_subquery");

    const latestPromotions = await tx
      .select({
        studentId: promotionSubquery.studentId,
        promotionId: promotionSubquery.promotionId,
      })
      .from(promotionSubquery)
      .where(eq(promotionSubquery.rn, 1));

    const promotionMap = new Map<number, number>(
      latestPromotions.map((p) => [p.studentId, p.promotionId]),
    );

    // 8. Resolve exam_subject_type_id (first one – enhance if needed)
    // let examSubjectTypeId: number | null = null;
    // if (dto.subjectTypes.length > 0) {
    //   const row = await tx
    //     .select({ id: examSubjectTypeModel.id })
    //     .from(examSubjectTypeModel)
    //     .where(
    //       and(
    //         eq(examSubjectTypeModel.examId, exam.id),
    //         eq(examSubjectTypeModel.subjectTypeId, dto.subjectTypes[0].id!),
    //       ),
    //     )
    //     .limit(1);
    //   examSubjectTypeId = row[0]?.id ?? null;
    // }
    // 8️⃣ Resolve ALL exam_subject_type_ids
    const examSubjectTypeMap = new Map<number, number>();

    const examSubjectTypeRows = await tx
      .select({
        id: examSubjectTypeModel.id,
        subjectTypeId: examSubjectTypeModel.subjectTypeId,
      })
      .from(examSubjectTypeModel)
      .where(eq(examSubjectTypeModel.examId, exam.id));

    for (const row of examSubjectTypeRows) {
      examSubjectTypeMap.set(row.subjectTypeId, row.id);
    }

    const examSubjectId =
      dto.examSubjects.length > 0
        ? subjectToExamSubject.get(dto.examSubjects[0].subject.id!)
        : null;

    // 9. Build and insert exam_candidates
    // const candidateInserts: ExamCandidate[] = studentsWithSeats.map((s) => {
    //   const examRoom = [...roomIdToExamRoom.entries()].find(
    //     ([rid]) =>
    //       s.roomName ===
    //       dto.locations.find((l) => l.room.id === rid)?.room.name,
    //   )?.[1] as ExamRoomT;

    //   if (!examRoom) throw new Error(`Room not found for student ${s.uid}`);

    //   const promotionId = promotionMap.get(s.studentId);
    //   if (!promotionId)
    //     throw new Error(`Promotion not found for student ${s.uid}`);

    //   return {
    //     examId: exam.id!,
    //     promotionId: promotionId!,
    //     examRoomId: examRoom.id!,
    //     examSubjectTypeId: examSubjectTypeId!,
    //     examSubjectId: examSubjectId!,
    //     paperId: paperIds[0]!, // can be enhanced later for per-student paper
    //     seatNumber: s.seatNumber, // DB column must be varchar!
    //   };
    // });

    // if (candidateInserts.length > 0) {
    //   await tx.insert(examCandidateModel).values(candidateInserts);
    // }

    // 9. Build and insert exam_candidates (PER SUBJECT)
    // const candidateInserts: ExamCandidate[] = [];

    // for (const subj of dto.subjects) {
    //   const examSubjectId = subjectToExamSubject.get(subj.subjectId!);
    //   if (!examSubjectId) {
    //     throw new Error(`Exam subject not found for subject ${subj.subjectId}`);
    //   }

    //   // OPTIONAL (but correct): get paper per subject
    //   const paperIdForSubject =
    //     paperIds.length === 1 ? paperIds[0] : paperIds.find(Boolean);

    //   for (const s of studentsWithSeats) {
    //     const examRoom = [...roomIdToExamRoom.entries()].find(
    //       ([rid]) =>
    //         s.roomName ===
    //         dto.locations.find((l) => l.room.id === rid)?.room.name,
    //     )?.[1] as ExamRoomT;

    //     if (!examRoom) {
    //       throw new Error(`Room not found for student ${s.uid}`);
    //     }

    //     const promotionId = promotionMap.get(s.studentId);
    //     if (!promotionId) {
    //       throw new Error(`Promotion not found for student ${s.uid}`);
    //     }

    //     candidateInserts.push({
    //       examId: exam.id!,
    //       promotionId: promotionId,
    //       examRoomId: examRoom.id!,
    //       examSubjectTypeId: examSubjectTypeId!, // same for all
    //       examSubjectId: examSubjectId,          // 🔥 PER SUBJECT
    //       paperId: paperIdForSubject!,           // 🔥 PER SUBJECT (or enhance later)
    //       seatNumber: s.seatNumber,
    //     });
    //   }
    // }

    // if (candidateInserts.length > 0) {
    //   await tx.insert(examCandidateModel).values(candidateInserts);
    // }

    const candidateInserts: ExamCandidate[] = [];

    for (const subj of dto.examSubjects) {
      const examSubjectId = subjectToExamSubject.get(subj.subject.id!);
      if (!examSubjectId) {
        throw new Error(
          `Exam subject not found for subject ${subj.subject.id}`,
        );
      }

      for (const st of dto.examSubjectTypes) {
        const paperKey = `${subj.subject.id}|${st.subjectType.id}`;
        const paperId = paperMap.get(paperKey);

        if (!paperId) {
          // No paper for this subject + type → skip safely
          continue;
        }

        for (const s of studentsWithSeats) {
          const examRoom = [...roomIdToExamRoom.entries()].find(
            ([rid]) =>
              s.roomName ===
              dto.locations.find((l) => l.room.id === rid)?.room.name,
          )?.[1] as ExamRoomT;

          if (!examRoom) {
            throw new Error(`Room not found for student ${s.uid}`);
          }

          const promotionId = promotionMap.get(s.studentId);
          if (!promotionId) {
            throw new Error(`Promotion not found for student ${s.uid}`);
          }

          const examSubjectTypeId = examSubjectTypeMap.get(st.subjectType.id!);

          if (!examSubjectTypeId) {
            throw new Error(
              `Exam subject type not found for subjectType ${st.id}`,
            );
          }

          candidateInserts.push({
            examId: exam.id!,
            promotionId,
            examRoomId: examRoom.id!,
            examSubjectTypeId: examSubjectTypeId!, // resolved earlier
            examSubjectId, // 🔥 correct subject
            paperId, // 🔥 correct paper
            seatNumber: s.seatNumber,
          });
        }
      }
    }

    console.log("candidateInserts:", candidateInserts.length);
    if (candidateInserts.length > 0) {
      await tx.insert(examCandidateModel).values(candidateInserts);
    }

    return {
      examId: exam.id,
      totalStudentsAssigned: studentsWithSeats.length,
      roomsAssigned: dto.locations.length,
      message: "Exam assignment created successfully",
    };
  });
}

export async function findById(id: number): Promise<ExamDto | null> {
  const [foundExam] = await db
    .select()
    .from(examModel)
    .where(eq(examModel.id, id));

  if (!foundExam) return null;

  return await modelToDto(foundExam);
}

export async function findAll(
  page: number = 1,
  pageSize: number = 10,
): Promise<PaginatedResponse<ExamDto>> {
  const offset = (page - 1) * pageSize;

  const exams = await db
    .select()
    .from(examModel)
    .limit(pageSize)
    .offset(offset)
    .orderBy(desc(examModel.id));

  const [{ totalCount }] = await db
    .select({
      totalCount: count(examModel.id),
    })
    .from(examModel);

  const content = (
    await Promise.all(exams.map(async (exm) => await modelToDto(exm)))
  ).filter((ele) => ele !== null);

  return {
    content,
    page,
    pageSize,
    totalElements: totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

async function modelToDto(model: ExamT | null): Promise<ExamDto | null> {
  if (!model) return null;

  const foundAcademicYear = await findAcademicYearById(model.academicYearId);

  const [foundExamType] = await db
    .select()
    .from(examTypeModel)
    .where(eq(examTypeModel.id, model.examTypeId));

  const foundClass = await findClassById(model.classId);

  const foundExamProgramCourses = await db
    .select()
    .from(examProgramCourseModel)
    .leftJoin(examModel, eq(examProgramCourseModel.examId, examModel.id))
    .where(eq(examModel.id, model.id));

  const examProgramCourses = await Promise.all(
    foundExamProgramCourses.map(async (epc): Promise<ExamProgramCourseDto> => {
      const programCourse = (await programCourseServices.findById(
        epc.exam_program_courses.programCourseId,
      ))!;
      return {
        ...epc.exam_program_courses,
        programCourse,
      };
    }),
  );

  const foundExamShifts = await db
    .select()
    .from(examShiftModel)
    .leftJoin(examModel, eq(examShiftModel.examId, examModel.id))
    .where(eq(examModel.id, model.id));

  const examShifts = await Promise.all(
    foundExamShifts.map(async (es): Promise<ExamShiftDto> => {
      const shift = (await shiftService.findById(es.exam_shifts.shiftId))!;
      return {
        ...es.exam_shifts,
        shift,
      };
    }),
  );

  const foundExamSubjects = await db
    .select()
    .from(examSubjectModel)
    .where(eq(examSubjectModel.examId, model.id));

  const examSubjects = await Promise.all(
    foundExamSubjects.map(async (es): Promise<ExamSubjectDto> => {
      const [subject] = await db
        .select()
        .from(subjectModel)
        .where(eq(subjectModel.id, es.subjectId));
      return {
        ...es,
        subject: subject!,
      };
    }),
  );

  const foundExamSubjectType = await db
    .select()
    .from(examSubjectTypeModel)
    .where(eq(examSubjectTypeModel.examId, model.id));

  const examSubjectTypes = await Promise.all(
    foundExamSubjectType.map(async (est): Promise<ExamSubjectTypeDto> => {
      const [subjectType] = await db
        .select()
        .from(subjectTypeModel)
        .where(eq(subjectTypeModel.id, est.subjectTypeId));
      return {
        ...est,
        subjectType: subjectType!,
      };
    }),
  );

  const foundExamRooms = await db
    .select()
    .from(examRoomModel)
    .where(eq(examRoomModel.examId, model.id!));

  const locations = await Promise.all(
    foundExamRooms.map(async (l): Promise<ExamRoomDto> => {
      const room = await roomServices.findById(l.roomId);
      return {
        ...l,
        room: room!,
      };
    }),
  );

  return {
    ...model,
    academicYear: foundAcademicYear!,
    examProgramCourses,
    examType: foundExamType!,
    class: foundClass,
    examShifts,
    examSubjects,
    examSubjectTypes,
    locations,
  };
}

export async function downloadAdmitCardsAsZip(
  examId: number,
  userId: number,
  uploadSessionId?: string,
): Promise<{
  zipBuffer: Buffer;
  admitCardCount: number;
}> {
  console.log("examId:", examId);
  const result = await db
    .select({
      semester: classModel.name,
      examType: examTypeModel.name,
      session: sessionModel.name,
      name: userModel.name,
      cuRollNumber: studentModel.rollNumber,
      cuRegistrationNumber: studentModel.registrationNumber,
      uid: studentModel.uid,
      phone: userModel.phone,
      shiftName: shiftModel.name,
      examStartDate: examSubjectModel.startTime,
      examEndDate: examSubjectModel.endTime,
      seatNo: examCandidateModel.seatNumber,
      roomName: roomModel.name,
      subjectName: paperModel.name,
      subjectCode: paperModel.code,
      programCourse: programCourseModel.name,
    })
    .from(examCandidateModel)
    .leftJoin(examModel, eq(examModel.id, examCandidateModel.examId))
    .leftJoin(
      examSubjectModel,
      eq(examSubjectModel.id, examCandidateModel.examSubjectId),
    )
    .leftJoin(examTypeModel, eq(examTypeModel.id, examModel.examTypeId))
    .leftJoin(
      examRoomModel,
      eq(examRoomModel.id, examCandidateModel.examRoomId),
    )
    .leftJoin(paperModel, eq(paperModel.id, examCandidateModel.paperId))
    .leftJoin(roomModel, eq(roomModel.id, examRoomModel.roomId))
    .leftJoin(
      promotionModel,
      eq(promotionModel.id, examCandidateModel.promotionId),
    )
    .leftJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
    .leftJoin(shiftModel, eq(shiftModel.id, promotionModel.shiftId))
    .leftJoin(classModel, eq(classModel.id, promotionModel.classId))
    .leftJoin(
      programCourseModel,
      eq(programCourseModel.id, promotionModel.programCourseId),
    )
    .leftJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .leftJoin(userModel, eq(userModel.id, studentModel.userId))
    .where(eq(examCandidateModel.examId, examId));

  const zip = new JSZip();
  const uidMap = new Map<string, typeof result>();

  for (const row of result) {
    if (!row.uid) continue;
    if (!uidMap.has(row.uid)) {
      uidMap.set(row.uid, []);
    }
    uidMap.get(row.uid)!.push(row);
  }

  const totalUniqueUids = uidMap.size;

  if (io && userId) {
    console.log("[CU-REG-DOWNLOAD] Emitting initial progress to user:", userId);
    io.to(`user:${userId}`).emit("download_progress", {
      id: uploadSessionId || `download-${Date.now()}`,
      userId: userId,
      type: "download_progress",
      message: "Starting document download...",
      progress: 0,
      status: "started",
      createdAt: new Date(),
      sessionId: uploadSessionId,
      stage: "listing",
    });
    console.log(
      "[EXAM_ADMIT_CARDDOWNLOAD] Initial progress emitted successfully",
    );
  } else {
    console.log(
      "[EXAM_ADMIT_CARD-DOWNLOAD] Skipping initial progress emit - io:",
      !!io,
      "userId:",
      userId,
    );
  }

  const progressUpdate = socketService.createExportProgressUpdate(
    userId.toString(),
    "Starting export process...",
    0,
    "started",
  );

  const doneUids = new Set<string>();
  console.log("result.length:", result.length);
  let i = 0;

  // Emit progress for PDF listing
  if (io && userId) {
    io.to(`user:${userId}`).emit("download_progress", {
      id: uploadSessionId || `download-${Date.now()}`,
      userId: userId,
      type: "download_progress",
      message: "Listing PDF files...",
      progress: 0,
      status: "in_progress",
      createdAt: new Date(),
      sessionId: uploadSessionId,
      stage: "downloading_pdfs",
    });
  }

  let processed = 0;
  let pdfCount = 0;
  for (const [uid, studentRows] of uidMap.entries()) {
    processed++;

    const progress = Math.round((processed / totalUniqueUids) * 100);

    console.log("processing:", uid);

    const progressUpdate = socketService.createExportProgressUpdate(
      userId.toString(),
      "Download in process...",
      progress,
      "in_progress",
    );

    socketService.sendProgressUpdate(userId.toString(), progressUpdate);

    // Emit progress for current file
    if (io && userId) {
      // const progress = Number(((++i * 100) / totalUniqueUids).toFixed(2));
      io.to(`user:${userId}`).emit("download_progress", {
        id: uploadSessionId || `download-${Date.now()}`,
        userId: userId,
        type: "download_progress",
        message: `Downloading PDF ${++pdfCount}/${totalUniqueUids}`,
        progress,
        status: "in_progress",
        createdAt: new Date(),
        sessionId: uploadSessionId,
        stage: "downloading_pdfs",
        currentFile: `${pdfCount}/${totalUniqueUids}`,
        pdfCount: pdfCount, // Show current count being processed
        pdfTotal: totalUniqueUids, // Show total count that will be downloaded
      });
    }

    const studentRows = result.filter((r) => r.uid === uid);

    const pdfBuffer = await pdfGenerationService.generateExamAdmitCardPdfBuffer(
      {
        semester: studentRows[0]!.semester!.split(" ")[1],
        examType: studentRows[0]!.examType ?? "",
        session: studentRows[0]!.session ?? "",
        name: studentRows[0]!.name!,
        cuRollNumber: studentRows[0]!.cuRollNumber,
        cuRegistrationNumber: studentRows[0]!.cuRegistrationNumber,
        uid: studentRows[0]!.uid!,
        phone: studentRows[0]!.phone!,
        programCourseName: studentRows[0]!.programCourse ?? "",
        shiftName: studentRows[0]!.shiftName ?? "",
        qrCodeDataUrl: null,

        examRows: studentRows.map((r) => ({
          subjectName: r.subjectName!,
          subjectCode: r.subjectCode!,
          date: formatExamDateFromTimestamp(r.examStartDate!),
          time: formatExamTimeFromTimestamps(r.examStartDate!, r.examEndDate!),
          seatNo: r.seatNo!,
          room: r.roomName!,
        })),
      },
    );

    zip.file(`${uid}_admit_card.pdf`, pdfBuffer);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return {
    zipBuffer,
    admitCardCount: totalUniqueUids,
  };
}

export async function downloadExamCandidatesbyExamId(examId: number) {
  const result = await db
    .select({
      examId: examModel.id,
      examType: examTypeModel.name,
      academicYear: academicYearModel.year,
      session: sessionModel.name,
      semester: classModel.name,
      orderType: examModel.orderType,
      gender: examModel.gender,
      examCreatedAt: examModel.createdAt,
      examUpdatedAt: examModel.updatedAt,
      studentId: studentModel.id,
      name: userModel.name,
      uid: studentModel.uid,
      email: userModel.email,
      phone: userModel.phone,
      whatsappNumber: userModel.whatsappNumber,
      programCourse: programCourseModel.name,
      section: sectionModel.name,
      shift: shiftModel.name,
      subject: subjectModel.code,
      subjectType: subjectTypeModel.code,
      paper: paperModel.name,
      paperCode: paperModel.code,
      seatNumber: examCandidateModel.seatNumber,
    })
    .from(examCandidateModel)

    .leftJoin(examModel, eq(examModel.id, examCandidateModel.examId))

    .leftJoin(
      academicYearModel,
      eq(academicYearModel.id, examModel.academicYearId),
    )
    .leftJoin(paperModel, eq(paperModel.id, examCandidateModel.paperId))

    .leftJoin(examTypeModel, eq(examModel.examTypeId, examTypeModel.id))

    .leftJoin(
      promotionModel,
      eq(promotionModel.id, examCandidateModel.promotionId),
    )
    .leftJoin(sectionModel, eq(sectionModel.id, promotionModel.sectionId))
    .leftJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))

    .leftJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .leftJoin(userModel, eq(userModel.id, studentModel.userId))

    .leftJoin(
      programCourseModel,
      eq(programCourseModel.id, promotionModel.programCourseId),
    )

    .leftJoin(
      examSubjectModel,
      and(
        eq(examSubjectModel.examId, examModel.id),
        eq(examSubjectModel.id, examCandidateModel.examSubjectId),
      ),
    )

    .leftJoin(
      subjectModel,
      and(
        eq(subjectModel.id, examSubjectModel.subjectId),
        eq(examCandidateModel.examSubjectId, examSubjectModel.id),
      ),
    )

    .leftJoin(
      examSubjectTypeModel,
      and(
        eq(examSubjectTypeModel.examId, examModel.id),
        eq(examCandidateModel.examSubjectTypeId, examSubjectTypeModel.id),
      ),
    )
    .leftJoin(
      subjectTypeModel,
      eq(examSubjectTypeModel.subjectTypeId, subjectTypeModel.id),
    )

    .leftJoin(shiftModel, eq(shiftModel.id, promotionModel.shiftId))

    .leftJoin(classModel, eq(examModel.classId, classModel.id))

    .where(eq(examModel.id, examId));

  // 🛑 Safety
  if (!result.length) {
    throw new Error("No exam candidates found");
  }

  // ✅ Group by subject / paper
  const groupedBySubject = new Map<string, typeof result>();

  for (const row of result) {
    const key = row.paperCode ?? row.subject ?? "UNKNOWN";
    if (!groupedBySubject.has(key)) {
      groupedBySubject.set(key, []);
    }
    groupedBySubject.get(key)!.push(row);
  }

  // ✅ Create Excel
  const workbook = new ExcelJS.Workbook();

  for (const [subjectKey, rows] of groupedBySubject) {
    const sheet = workbook.addWorksheet(subjectKey.substring(0, 31));

    // 🔥 AUTO-GENERATE COLUMNS FROM RESULT KEYS
    const columns = Object.keys(rows[0]).map((key) => ({
      header: key, // keep same name as result key
      key: key,
      width: 20,
    }));

    sheet.columns = columns;

    // 🔥 ADD FULL OBJECT DIRECTLY
    rows.forEach((row) => {
      sheet.addRow(row);
    });

    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  }

  // ✅ Return Excel buffer
  return await workbook.xlsx.writeBuffer();
}

export async function downloadSingleAdmitCard(
  examId: number,
  studentId: number,
): Promise<Buffer> {
  const result = await db
    .select({
      semester: classModel.name,
      examType: examTypeModel.name,
      session: sessionModel.name,
      name: userModel.name,
      cuRollNumber: studentModel.rollNumber,
      cuRegistrationNumber: studentModel.registrationNumber,
      uid: studentModel.uid,
      phone: userModel.phone,
      shiftName: shiftModel.name,
      examStartDate: examSubjectModel.startTime,
      examEndDate: examSubjectModel.endTime,
      seatNo: examCandidateModel.seatNumber,
      roomName: roomModel.name,
      subjectName: paperModel.name,
      subjectCode: paperModel.code,
      programCourse: programCourseModel.name,
    })
    .from(examCandidateModel)
    .leftJoin(examModel, eq(examModel.id, examCandidateModel.examId))
    .leftJoin(
      examSubjectModel,
      eq(examSubjectModel.id, examCandidateModel.examSubjectId),
    )
    .leftJoin(examTypeModel, eq(examTypeModel.id, examModel.examTypeId))
    .leftJoin(
      examRoomModel,
      eq(examRoomModel.id, examCandidateModel.examRoomId),
    )
    .leftJoin(paperModel, eq(paperModel.id, examCandidateModel.paperId))
    .leftJoin(roomModel, eq(roomModel.id, examRoomModel.roomId))
    .leftJoin(
      promotionModel,
      eq(promotionModel.id, examCandidateModel.promotionId),
    )
    .leftJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
    .leftJoin(shiftModel, eq(shiftModel.id, promotionModel.shiftId))
    .leftJoin(classModel, eq(classModel.id, promotionModel.classId))
    .leftJoin(
      programCourseModel,
      eq(programCourseModel.id, promotionModel.programCourseId),
    )
    .leftJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .leftJoin(userModel, eq(userModel.id, studentModel.userId))
    .where(
      and(
        eq(examCandidateModel.examId, examId),
        eq(studentModel.id, studentId),
      ),
    );

  if (!result.length) {
    throw new Error("No admit card found for this student");
  }

  const studentRows = result;

  const pdfBuffer = await pdfGenerationService.generateExamAdmitCardPdfBuffer({
    semester: studentRows[0]!.semester!.split(" ")[1],
    examType: studentRows[0]!.examType ?? "",
    session: studentRows[0]!.session ?? "",
    name: studentRows[0]!.name!,
    cuRollNumber: studentRows[0]!.cuRollNumber,
    cuRegistrationNumber: studentRows[0]!.cuRegistrationNumber,
    uid: studentRows[0]!.uid!,
    phone: studentRows[0]!.phone!,
    programCourseName: studentRows[0]!.programCourse ?? "",
    shiftName: studentRows[0]!.shiftName ?? "",
    qrCodeDataUrl: null,

    examRows: studentRows.map((r) => ({
      subjectName: r.subjectName!,
      subjectCode: r.subjectCode!,
      date: formatExamDateFromTimestamp(r.examStartDate!),
      time: formatExamTimeFromTimestamps(r.examStartDate!, r.examEndDate!),
      seatNo: r.seatNo!,
      room: r.roomName!,
    })),
  });

  return pdfBuffer;
}

function formatExamDateFromTimestamp(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatExamTimeFromTimestamps(start: Date, end: Date): string {
  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  return `${formatTime(start)} - ${formatTime(end)}`;
}

// TODO: -
export async function findExamsByStudentId(
  studentId: number,
  page = 1,
  pageSize = 10,
): Promise<PaginatedResponse<ExamDto>> {
  const offset = (page - 1) * pageSize;

  /**
   * STEP 1: Get DISTINCT exam IDs for student
   * (same base logic as admit card)
   */
  const examIdRows = await db
    .select({
      examId: examModel.id,
      createdAt: examModel.createdAt,
    })
    .from(examCandidateModel)
    .innerJoin(
      promotionModel,
      eq(promotionModel.id, examCandidateModel.promotionId),
    )
    .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .innerJoin(examModel, eq(examModel.id, examCandidateModel.examId))
    .where(eq(studentModel.id, studentId))
    .groupBy(examModel.id, examModel.createdAt)
    .orderBy(desc(examModel.createdAt))
    .limit(pageSize)
    .offset(offset);

  const examIds = examIdRows.map((r) => r.examId);

  if (examIds.length === 0) {
    return {
      content: [],
      page,
      pageSize,
      totalElements: 0,
      totalPages: 0,
    };
  }

  /**
   * STEP 2: Total distinct exams count
   */
  const [{ totalCount }] = await db
    .select({
      totalCount: sql<number>`COUNT(DISTINCT ${examModel.id})`,
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
   * STEP 3: Fetch exams & map to DTO
   */
  const exams = await db
    .select()
    .from(examModel)
    .where(inArray(examModel.id, examIds))
    .orderBy(desc(examModel.createdAt));

  const content = (
    await Promise.all(exams.map((exam) => modelToDto(exam)))
  ).filter(Boolean) as ExamDto[];

  return {
    content,
    page,
    pageSize,
    totalElements: totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

export async function findExamPapersByExamId(examId: number) {
  const result = await db
    .select({
      promotionId: examCandidateModel.promotionId,
      paperId: examCandidateModel.paperId,
      examSubjectId: examCandidateModel.examSubjectId,
    })
    .from(examCandidateModel)
    .leftJoin(examModel, eq(examCandidateModel.examId, examModel.id))
    .leftJoin(paperModel, eq(examCandidateModel.paperId, paperModel.id))
    .where(eq(examModel.id, examId));

  console.log("ExamPapersWithStats, result:", result);

  const papersWithStats: {
    paper: PaperDto;
    studentCount: number;
    examSubjectId: number;
  }[] = [];
  for (let i = 0; i < result.length; i++) {
    if (
      papersWithStats.find(
        (ele) =>
          ele.paper.id === result[i].paperId &&
          result[i].examSubjectId === ele.examSubjectId,
      )
    )
      continue;

    const paper = (await paperServices.getPaperById(result[i].paperId))!;
    papersWithStats.push({
      paper,
      examSubjectId: result[i].examSubjectId,
      studentCount: result.filter(
        (ele) =>
          ele.paperId === result[i].paperId &&
          ele.examSubjectId === result[i].examSubjectId,
      ).length,
    });
  }

  return papersWithStats;
}

export async function updateExamSubject(
  id: number,
  givenExamSubject: ExamSubjectDto,
): Promise<ExamSubjectDto | null> {
  console.log("givenExamSubject:", givenExamSubject);
  const [foundExamSubject] = await db
    .select()
    .from(examSubjectModel)
    .where(eq(examSubjectModel.id, id));

  if (!foundExamSubject) return null;

  const [updatedExamSubject] = await db
    .update(examSubjectModel)
    .set({
      startTime: new Date(givenExamSubject.startTime),
      endTime: new Date(givenExamSubject.endTime),
    })
    .where(eq(examSubjectModel.id, id))
    .returning();

  const [subject] = await db
    .select()
    .from(subjectModel)
    .where(eq(subjectModel.id, updatedExamSubject.subjectId));

  return {
    subject,
    ...updatedExamSubject,
  };
}
