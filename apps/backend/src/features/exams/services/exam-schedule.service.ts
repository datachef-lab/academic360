import { db, pool } from "@/db/index.js";
import { studentModel, userModel } from "@repo/db/schemas/models/user";
import { cuRegistrationCorrectionRequestModel } from "@repo/db/schemas/models/admissions/cu-registration-correction-request.model";
import { eq, inArray } from "drizzle-orm";

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
export async function getStudentsByPapers(
  params: GetStudentsByPapersParams,
  roomAssignments: Array<{
    roomId: number;
    floorId: number | null;
    floorName: string | null;
    roomName: string;
    maxStudentsPerBench: number;
    numberOfBenches: number;
  }>,
): Promise<StudentWithSeat[]> {
  const {
    classId,
    programCourseIds,
    paperIds,
    academicYearIds,
    shiftIds,
    assignBy,
  } = params;

  if (
    paperIds.length === 0 ||
    programCourseIds.length === 0 ||
    academicYearIds.length === 0
  ) {
    return [];
  }

  try {
    const studentIdsArray = await getEligibleStudentIds(params);

    if (studentIdsArray.length === 0) {
      return [];
    }

    // Fetch student details with user info and CU registration application number
    const students = await db
      .select({
        studentId: studentModel.id,
        uid: studentModel.uid,
        userId: studentModel.userId,
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
      .where(inArray(studentModel.id, studentIdsArray));

    // Sort students based on assignBy
    students.sort((a, b) => {
      if (assignBy === "UID") {
        return (a.uid || "").localeCompare(b.uid || "");
      } else {
        // Sort by CU Registration Application Number
        const aAppNum = a.cuRegistrationApplicationNumber || "";
        const bAppNum = b.cuRegistrationApplicationNumber || "";
        return aAppNum.localeCompare(bAppNum);
      }
    });

    // Assign seats to students
    const studentsWithSeats: StudentWithSeat[] = [];
    let studentIndex = 0;

    for (const roomAssignment of roomAssignments) {
      const {
        roomId,
        floorId,
        floorName,
        roomName,
        maxStudentsPerBench,
        numberOfBenches,
      } = roomAssignment;
      const roomCapacity = numberOfBenches * maxStudentsPerBench;

      for (
        let bench = 1;
        bench <= numberOfBenches && studentIndex < students.length;
        bench++
      ) {
        // Generate seat positions: extreme left and right based on maxStudentsPerBench
        const seatPositions = generateSeatPositions(maxStudentsPerBench);

        for (const position of seatPositions) {
          if (studentIndex >= students.length) break;

          const student = students[studentIndex]!;
          const seatNumber = `${bench}${position}`;

          studentsWithSeats.push({
            studentId: student.studentId,
            uid: student.uid || "",
            name: student.userName || "",
            email: student.userEmail || "",
            whatsappPhone: student.userWhatsappPhone || "",
            cuRegistrationApplicationNumber:
              student.cuRegistrationApplicationNumber,
            floorName,
            roomName,
            seatNumber,
          });

          studentIndex++;
        }
      }
    }

    return studentsWithSeats;
  } catch (error) {
    console.error("[EXAM-SCHEDULE] Error fetching students:", error);
    throw error;
  }
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
