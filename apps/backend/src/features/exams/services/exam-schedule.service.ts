import { db } from "@/db/index.js";
import { promotionModel } from "@repo/db/schemas/models/batches";
import { studentModel, userModel } from "@repo/db/schemas/models/user";
import { paperModel } from "@repo/db/schemas/models/course-design";
import { studentSubjectSelectionModel } from "@repo/db/schemas/models/subject-selection";
import {
  sessionModel,
  academicYearModel,
  classModel,
} from "@repo/db/schemas/models/academics";
import { cuRegistrationCorrectionRequestModel } from "@repo/db/schemas/models/admissions/cu-registration-correction-request.model";
import { and, eq, inArray, sql, desc } from "drizzle-orm";

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
export async function countStudentsByPapers(
  params: CountStudentsByPapersParams,
): Promise<number> {
  const { classId, programCourseIds, paperIds, academicYearIds, shiftIds } =
    params;

  if (
    paperIds.length === 0 ||
    programCourseIds.length === 0 ||
    academicYearIds.length === 0
  ) {
    return 0;
  }

  try {
    // Get all papers with their isOptional flag and subjectId
    const papers = await db
      .select({
        id: paperModel.id,
        subjectId: paperModel.subjectId,
        isOptional: paperModel.isOptional,
        academicYearId: paperModel.academicYearId,
      })
      .from(paperModel)
      .where(
        and(inArray(paperModel.id, paperIds), eq(paperModel.isActive, true)),
      );

    if (papers.length === 0) {
      return 0;
    }

    // Separate mandatory and optional papers
    const mandatoryPapers = papers.filter((p) => !p.isOptional);
    const optionalPapers = papers.filter((p) => p.isOptional);

    const studentIdSets: Set<number>[] = [];

    // For mandatory papers: get all students from promotions
    if (mandatoryPapers.length > 0) {
      const mandatoryConditions = [
        inArray(promotionModel.programCourseId, programCourseIds),
        eq(promotionModel.classId, classId),
        eq(userModel.isActive, true),
      ];

      if (shiftIds && shiftIds.length > 0) {
        mandatoryConditions.push(inArray(promotionModel.shiftId, shiftIds));
      }

      // Get latest promotion per student using a subquery
      // First, get all promotions matching the criteria
      const allPromotions = await db
        .select({
          id: promotionModel.id,
          studentId: promotionModel.studentId,
        })
        .from(promotionModel)
        .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
        .innerJoin(userModel, eq(userModel.id, studentModel.userId))
        .innerJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
        .where(
          and(
            ...mandatoryConditions,
            inArray(sessionModel.academicYearId, academicYearIds),
          ),
        )
        .orderBy(desc(promotionModel.id));

      // Get latest promotion per student
      const latestPromotionMap = new Map<number, number>();
      for (const promotion of allPromotions) {
        if (
          promotion.studentId &&
          !latestPromotionMap.has(promotion.studentId)
        ) {
          latestPromotionMap.set(promotion.studentId, promotion.id!);
        }
      }

      const mandatoryStudentIds = Array.from(latestPromotionMap.keys()).map(
        (studentId) => ({
          studentId,
        }),
      );

      if (mandatoryStudentIds.length > 0) {
        studentIdSets.push(
          new Set(mandatoryStudentIds.map((s) => s.studentId!)),
        );
      }
    }

    // For optional papers: get students who selected ANY of those subjects (UNION)
    if (optionalPapers.length > 0) {
      const optionalSubjectIds = optionalPapers
        .map((p) => p.subjectId)
        .filter((id): id is number => id !== null && id !== undefined);

      if (optionalSubjectIds.length > 0) {
        // Get all promotions for students who selected ANY of the optional subjects
        const allOptionalPromotions = await db
          .select({
            promotionId: promotionModel.id,
            studentId: studentSubjectSelectionModel.studentId,
          })
          .from(studentSubjectSelectionModel)
          .innerJoin(
            promotionModel,
            eq(
              promotionModel.studentId,
              studentSubjectSelectionModel.studentId,
            ),
          )
          .innerJoin(
            studentModel,
            eq(studentModel.id, promotionModel.studentId),
          )
          .innerJoin(userModel, eq(userModel.id, studentModel.userId))
          .innerJoin(
            sessionModel,
            eq(sessionModel.id, promotionModel.sessionId),
          )
          .where(
            and(
              inArray(
                studentSubjectSelectionModel.subjectId,
                optionalSubjectIds,
              ),
              eq(studentSubjectSelectionModel.isActive, true),
              inArray(promotionModel.programCourseId, programCourseIds),
              eq(promotionModel.classId, classId),
              inArray(sessionModel.academicYearId, academicYearIds),
              eq(userModel.isActive, true),
            ),
          )
          .orderBy(desc(promotionModel.id));

        // Get latest promotion per student
        const latestOptionalPromotionMap = new Map<number, number>();
        for (const promotion of allOptionalPromotions) {
          if (
            promotion.studentId &&
            !latestOptionalPromotionMap.has(promotion.studentId)
          ) {
            latestOptionalPromotionMap.set(
              promotion.studentId,
              promotion.promotionId!,
            );
          }
        }

        const optionalStudentIds = Array.from(
          latestOptionalPromotionMap.keys(),
        );

        if (optionalStudentIds.length > 0) {
          studentIdSets.push(new Set(optionalStudentIds));
        }
      }
    }

    // Combine all student ID sets using UNION
    // A student is eligible if they have ANY of the selected papers (mandatory OR optional)
    if (studentIdSets.length === 0) {
      return 0;
    }

    // Union all sets: students who have ANY mandatory paper OR ANY optional paper
    let finalStudentIds: Set<number> = new Set();
    for (const studentSet of studentIdSets) {
      finalStudentIds = new Set([...finalStudentIds, ...studentSet]);
    }

    console.log("[EXAM-SCHEDULE] Student count calculation:", {
      mandatoryPapers: mandatoryPapers.length,
      optionalPapers: optionalPapers.length,
      studentIdSets: studentIdSets.length,
      finalCount: finalStudentIds.size,
      params: {
        classId,
        programCourseIds,
        paperIds,
        academicYearIds,
        shiftIds,
      },
    });

    return finalStudentIds.size;
  } catch (error) {
    console.error("[EXAM-SCHEDULE] Error counting students:", error);
    throw error;
  }
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
    // Get all papers with their isOptional flag and subjectId
    const papers = await db
      .select({
        id: paperModel.id,
        subjectId: paperModel.subjectId,
        isOptional: paperModel.isOptional,
        academicYearId: paperModel.academicYearId,
      })
      .from(paperModel)
      .where(
        and(inArray(paperModel.id, paperIds), eq(paperModel.isActive, true)),
      );

    if (papers.length === 0) {
      return [];
    }

    // Separate mandatory and optional papers
    const mandatoryPapers = papers.filter((p) => !p.isOptional);
    const optionalPapers = papers.filter((p) => p.isOptional);

    const studentIdSets: Set<number>[] = [];

    // For mandatory papers: get all students from promotions
    if (mandatoryPapers.length > 0) {
      const mandatoryConditions = [
        inArray(promotionModel.programCourseId, programCourseIds),
        eq(promotionModel.classId, classId),
        eq(userModel.isActive, true),
      ];

      if (shiftIds && shiftIds.length > 0) {
        mandatoryConditions.push(inArray(promotionModel.shiftId, shiftIds));
      }

      const allPromotions = await db
        .select({
          id: promotionModel.id,
          studentId: promotionModel.studentId,
        })
        .from(promotionModel)
        .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
        .innerJoin(userModel, eq(userModel.id, studentModel.userId))
        .innerJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
        .where(
          and(
            ...mandatoryConditions,
            inArray(sessionModel.academicYearId, academicYearIds),
          ),
        )
        .orderBy(desc(promotionModel.id));

      const latestPromotionMap = new Map<number, number>();
      for (const promotion of allPromotions) {
        if (
          promotion.studentId &&
          !latestPromotionMap.has(promotion.studentId)
        ) {
          latestPromotionMap.set(promotion.studentId, promotion.id!);
        }
      }

      const mandatoryStudentIds = Array.from(latestPromotionMap.keys());

      if (mandatoryStudentIds.length > 0) {
        studentIdSets.push(new Set(mandatoryStudentIds));
      }
    }

    // For optional papers: get students who selected ANY of those subjects (UNION)
    if (optionalPapers.length > 0) {
      const optionalSubjectIds = optionalPapers
        .map((p) => p.subjectId)
        .filter((id): id is number => id !== null && id !== undefined);

      if (optionalSubjectIds.length > 0) {
        const allOptionalPromotions = await db
          .select({
            promotionId: promotionModel.id,
            studentId: studentSubjectSelectionModel.studentId,
          })
          .from(studentSubjectSelectionModel)
          .innerJoin(
            promotionModel,
            eq(
              promotionModel.studentId,
              studentSubjectSelectionModel.studentId,
            ),
          )
          .innerJoin(
            studentModel,
            eq(studentModel.id, promotionModel.studentId),
          )
          .innerJoin(userModel, eq(userModel.id, studentModel.userId))
          .innerJoin(
            sessionModel,
            eq(sessionModel.id, promotionModel.sessionId),
          )
          .where(
            and(
              inArray(
                studentSubjectSelectionModel.subjectId,
                optionalSubjectIds,
              ),
              eq(studentSubjectSelectionModel.isActive, true),
              inArray(promotionModel.programCourseId, programCourseIds),
              eq(promotionModel.classId, classId),
              inArray(sessionModel.academicYearId, academicYearIds),
              eq(userModel.isActive, true),
            ),
          )
          .orderBy(desc(promotionModel.id));

        const latestOptionalPromotionMap = new Map<number, number>();
        for (const promotion of allOptionalPromotions) {
          if (
            promotion.studentId &&
            !latestOptionalPromotionMap.has(promotion.studentId)
          ) {
            latestOptionalPromotionMap.set(
              promotion.studentId,
              promotion.promotionId!,
            );
          }
        }

        const optionalStudentIds = Array.from(
          latestOptionalPromotionMap.keys(),
        );

        if (optionalStudentIds.length > 0) {
          studentIdSets.push(new Set(optionalStudentIds));
        }
      }
    }

    // Union all sets
    if (studentIdSets.length === 0) {
      return [];
    }

    let finalStudentIds: Set<number> = new Set();
    for (const studentSet of studentIdSets) {
      finalStudentIds = new Set([...finalStudentIds, ...studentSet]);
    }

    const studentIdsArray = Array.from(finalStudentIds);

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
