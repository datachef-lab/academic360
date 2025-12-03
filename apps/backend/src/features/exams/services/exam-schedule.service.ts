import { db, pool } from "@/db/index.js";
import { studentModel, userModel } from "@repo/db/schemas/models/user";
import { cuRegistrationCorrectionRequestModel } from "@repo/db/schemas/models/admissions/cu-registration-correction-request.model";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { ExamDto } from "@repo/db/dtos/exams";
import {
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
  promotionModel,
  sessionModel,
} from "@repo/db/schemas";

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

  if (
    paperIds.length === 0 ||
    programCourseIds.length === 0 ||
    academicYearIds.length === 0
  ) {
    return [];
  }

  const shiftFilter =
    shiftIds && shiftIds.length > 0 ? "AND pr.shift_id_fk = ANY($5)" : "";

  const eligibleSql = `
        WITH filtered_papers AS (
            SELECT
                p.id,
                p.subject_id_fk,
                p.subject_type_id_fk,
                p.class_id_fk,
                p.programe_course_id_fk,
                p.academic_year_id_fk,
                p.is_optional
            FROM papers p
            WHERE p.id = ANY($1)
              AND p.class_id_fk = $2
              AND p.programe_course_id_fk = ANY($3)
              AND p.academic_year_id_fk = ANY($4)
              AND p.is_active = TRUE
        ),
        latest_promotions AS (
            SELECT DISTINCT ON (pr.student_id_fk)
                   pr.student_id_fk,
                   pr.program_course_id_fk,
                   pr.session_id_fk,
                   pr.class_id_fk
            FROM promotions pr
            INNER JOIN sessions sess ON sess.id = pr.session_id_fk
            WHERE pr.class_id_fk = $2
              AND pr.program_course_id_fk = ANY($3)
              AND sess.academic_id_fk = ANY($4)
              ${shiftFilter}
            ORDER BY pr.student_id_fk,
                     pr.start_date DESC NULLS LAST,
                     pr.created_at DESC,
                     pr.id DESC
        ),
        latest_student_selections AS (
            SELECT id,
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
        mandatory AS (
            SELECT DISTINCT std.id AS student_id
            FROM filtered_papers fp
            JOIN latest_promotions pr
              ON pr.program_course_id_fk = fp.programe_course_id_fk
             AND pr.class_id_fk = fp.class_id_fk
            JOIN students std ON std.id = pr.student_id_fk
            JOIN users u ON u.id = std.user_id_fk
            WHERE fp.is_optional = FALSE
              AND u.is_active = TRUE
        ),
        optional AS (
            SELECT DISTINCT std.id AS student_id
            FROM filtered_papers fp
            JOIN latest_promotions pr
              ON pr.program_course_id_fk = fp.programe_course_id_fk
             AND pr.class_id_fk = fp.class_id_fk
            JOIN students std ON std.id = pr.student_id_fk
            JOIN users u ON u.id = std.user_id_fk
            JOIN latest_student_selections lss
              ON lss.student_id_fk = std.id
             AND lss.subject_id_fk = fp.subject_id_fk
            JOIN subject_selection_meta sm
              ON sm.id = lss.subject_selection_meta_id_fk
             AND sm.subject_type_id_fk = fp.subject_type_id_fk
            JOIN subject_selection_meta_classes smc
              ON smc.subject_selection_meta_id_fk = sm.id
             AND smc.class_id_fk = fp.class_id_fk
            WHERE fp.is_optional = TRUE
              AND u.is_active = TRUE
        )
        SELECT DISTINCT student_id
        FROM (
            SELECT * FROM mandatory
            UNION ALL
            SELECT * FROM optional
        ) eligible_students
    `;

  const eligibleParams: any[] = [
    paperIds,
    classId,
    programCourseIds,
    academicYearIds,
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
    studentsPerBench: number;
    capacity: number;
  }>,
): Promise<StudentWithSeat[]> {
  const studentIds = await getEligibleStudentIds(params);
  if (studentIds.length === 0) return [];

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
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(
      cuRegistrationCorrectionRequestModel,
      eq(cuRegistrationCorrectionRequestModel.studentId, studentModel.id),
    )
    .where(inArray(studentModel.id, studentIds));

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
    const letters = generateSeatPositions(room.studentsPerBench);
    let seatIdx = 0;

    while (studentIdx < students.length && seatIdx < room.capacity) {
      const bench = Math.floor(seatIdx / room.studentsPerBench) + 1;
      const letter = letters[seatIdx % room.studentsPerBench];
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
    // 1. Create exam record
    const [exam] = await tx
      .insert(examModel)
      .values({
        academicYearId: dto.academicYear.id!,
        examTypeId: dto.examType.id!,
        classId: dto.classId.id!,

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
      ...dto.programCourses.map((pc) =>
        tx.insert(examProgramCourseModel).values({
          examId: exam.id,
          programCourseId: pc.id!,
        }),
      ),
      ...dto.shifts.map((s) =>
        tx.insert(examShiftModel).values({
          examId: exam.id,
          shiftId: s.id!,
        }),
      ),
      ...dto.subjectTypes.map((st) =>
        tx.insert(examSubjectTypeModel).values({
          examId: exam.id,
          subjectTypeId: st.id!,
        }),
      ),
    ]);

    // 4. Insert exam subjects
    const subjectToExamSubject = new Map<number, number>();
    for (const subj of dto.subjects) {
      const [es] = await tx
        .insert(examSubjectModel)
        .values({
          examId: exam.id,
          subjectId: subj.id!,
          startTime: subj.startTime,
          endTime: subj.endTime,
        })
        .returning();
      subjectToExamSubject.set(subj.id!, es.id);
    }

    // 5. Resolve paperIds exactly like getEligibleStudentIds()
    const subjectIds = dto.subjects.map((s) => s.id!);
    const subjectTypeIds = dto.subjectTypes.map((st) => st.id!);
    const programCourseIds = dto.programCourses.map((pc) => pc.id!);
    const shiftIds = dto.shifts.map((s) => s.id!);

    const paperResult = await tx.execute(sql`
            SELECT DISTINCT p.id
            FROM papers p
            WHERE p.class_id_fk = ${dto.classId.id!}
              AND p.programe_course_id_fk = ANY(${programCourseIds}::int[])
              AND p.academic_year_id_fk = ${dto.academicYear.id!}
              AND p.subject_id_fk = ANY(${subjectIds}::int[])
              AND p.subject_type_id_fk = ANY(${subjectTypeIds}::int[])
              AND p.is_active = TRUE
        `);

    const paperIds = paperResult.rows.map((r: any) => Number(r.id));
    if (paperIds.length === 0)
      throw new Error("No active papers found for the given subjects");

    // 6. Prepare seat assignment
    const seatParams: GetStudentsByPapersParams = {
      classId: dto.classId.id!,
      programCourseIds,
      paperIds,
      academicYearIds: [dto.academicYear.id!],
      shiftIds: shiftIds.length > 0 ? shiftIds : undefined,
      assignBy: dto.orderType === "UID" ? "UID" : "CU Reg. No.",
    };

    const roomAssignments = dto.locations.map((l) => ({
      roomId: l.room.id!,
      floorId: l.room.floor?.id ?? null,
      floorName: l.room.floor?.name ?? null,
      roomName: l.room.name,
      studentsPerBench: l.studentsPerBench,
      capacity: l.capacity,
    }));

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
          eq(promotionModel.classId, dto.classId.id!),
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
    let examSubjectTypeId: number | null = null;
    if (dto.subjectTypes.length > 0) {
      const row = await tx
        .select({ id: examSubjectTypeModel.id })
        .from(examSubjectTypeModel)
        .where(
          and(
            eq(examSubjectTypeModel.examId, exam.id),
            eq(examSubjectTypeModel.subjectTypeId, dto.subjectTypes[0].id!),
          ),
        )
        .limit(1);
      examSubjectTypeId = row[0]?.id ?? null;
    }

    const examSubjectId =
      dto.subjects.length > 0
        ? subjectToExamSubject.get(dto.subjects[0].id!)
        : null;

    // 9. Build and insert exam_candidates
    const candidateInserts: ExamCandidate[] = studentsWithSeats.map((s) => {
      const examRoom = [...roomIdToExamRoom.entries()].find(
        ([rid]) =>
          s.roomName ===
          dto.locations.find((l) => l.room.id === rid)?.room.name,
      )?.[1] as ExamRoomT;

      if (!examRoom) throw new Error(`Room not found for student ${s.uid}`);

      const promotionId = promotionMap.get(s.studentId);
      if (!promotionId)
        throw new Error(`Promotion not found for student ${s.uid}`);

      return {
        examId: exam.id!,
        promotionId: promotionId!,
        examRoomId: examRoom.id!,
        examSubjectTypeId: examSubjectTypeId!,
        examSubjectId: examSubjectId!,
        paperId: paperIds[0]!, // can be enhanced later for per-student paper
        seatNumber: s.seatNumber, // DB column must be varchar!
      };
    });

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

export async function getExamById() {}
