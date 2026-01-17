import * as XLSX from "xlsx";
import fsO from "fs";
import ExcelJS from "exceljs";
import { db, mysqlConnection, pool } from "@/db/index.js";
import JSZip from "jszip";
import fs from "fs/promises";
import * as programCourseServices from "@/features/course-design/services/program-course.service";
import * as paperServices from "@/features/course-design/services/paper.service";
import * as shiftService from "@/features/academics/services/shift.service";
import * as roomServices from "./room.service";
import { studentModel, userModel } from "@repo/db/schemas/models/user";
import { cuRegistrationCorrectionRequestModel } from "@repo/db/schemas/models/admissions/cu-registration-correction-request.model";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";
import {
  ExamDto,
  ExamProgramCourseDto,
  ExamRoomDto,
  ExamShiftDto,
  ExamSubjectDto,
  ExamSubjectTypeDto,
  RoomDto,
} from "@repo/db/dtos/exams";
import {
  academicYearModel,
  affiliationModel,
  classModel,
  courseLevelModel,
  courseModel,
  courseTypeModel,
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
  floorModel,
  notificationMasterModel,
  paperModel,
  programCourseModel,
  promotionModel,
  regulationTypeModel,
  roomModel,
  sectionModel,
  sessionModel,
  shiftModel,
  streamModel,
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
import { enqueueNotification } from "@/services/notificationClient";
import pLimit from "p-limit";
import {
  OldSubject,
  OldSubjectType,
} from "@repo/db/legacy-system-types/admissions";
import {
  OldClass,
  OldCourse,
  OldPaperList,
} from "@repo/db/legacy-system-types/course-design";

export interface CountStudentsByPapersParams {
  classId: number;
  programCourseIds: number[];
  paperIds: number[];
  academicYearIds: number[];
  shiftIds?: number[];
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  excelStudents: { foil_number: string; uid: string }[];
}

/**
 * Count students eligible for exam based on selected papers
 * - For mandatory papers: count all students in program course + class
 * - For optional papers: count only students who selected that subject
 * - Only count active students (user.isActive = true)
 * - Get student IDs from latest promotions
 */
// async function getEligibleStudentIds(
//     params: CountStudentsByPapersParams,
// ): Promise<number[]> {
//     const {
//         classId,
//         programCourseIds,
//         paperIds,
//         academicYearIds,
//         shiftIds,
//         gender,
//         excelStudents
//     } = params;

//     console.log("[EXAM-SCHEDULE] Getting eligible student IDs:", params);

//     if (
//         paperIds.length === 0 ||
//         programCourseIds.length === 0 ||
//         academicYearIds.length === 0
//     ) {
//         return [];
//     }

//     const shiftFilter =
//         shiftIds && shiftIds.length > 0 ? "AND pr.shift_id_fk = ANY($5)" : "";

//     //   const eligibleSql = `
//     //         WITH filtered_papers AS (
//     //             SELECT
//     //                 p.id,
//     //                 p.subject_id_fk,
//     //                 p.subject_type_id_fk,
//     //                 p.class_id_fk,
//     //                 p.programe_course_id_fk,
//     //                 p.academic_year_id_fk,
//     //                 p.is_optional
//     //             FROM papers p
//     //             WHERE p.id = ANY($1)
//     //               AND p.class_id_fk = $2
//     //               AND p.programe_course_id_fk = ANY($3)
//     //               AND p.academic_year_id_fk = ANY($4)
//     //               AND p.is_active = TRUE
//     //         ),
//     //         latest_promotions AS (
//     //             SELECT DISTINCT ON (pr.student_id_fk)
//     //                    pr.student_id_fk,
//     //                    pr.program_course_id_fk,
//     //                    pr.session_id_fk,
//     //                    pr.class_id_fk
//     //             FROM promotions pr
//     //             INNER JOIN sessions sess ON sess.id = pr.session_id_fk
//     //             WHERE pr.class_id_fk = $2
//     //               AND pr.program_course_id_fk = ANY($3)
//     //               AND sess.academic_id_fk = ANY($4)
//     //               ${shiftFilter}
//     //             ORDER BY pr.student_id_fk,
//     //                      pr.start_date DESC NULLS LAST,
//     //                      pr.created_at DESC,
//     //                      pr.id DESC
//     //         ),
//     //         latest_student_selections AS (
//     //             SELECT id,
//     //                    student_id_fk,
//     //                    subject_id_fk,
//     //                    subject_selection_meta_id_fk
//     //             FROM (
//     //                 SELECT sss.*,
//     //                        ROW_NUMBER() OVER (
//     //                          PARTITION BY sss.student_id_fk, sss.subject_selection_meta_id_fk
//     //                          ORDER BY sss.version DESC,
//     //                                   sss.updated_at DESC NULLS LAST,
//     //                                   sss.created_at DESC,
//     //                                   sss.id DESC
//     //                        ) AS rn
//     //                 FROM student_subject_selections sss
//     //                 WHERE sss.is_active = TRUE
//     //             ) ranked
//     //             WHERE rn = 1
//     //         ),
//     //         mandatory AS (
//     //             SELECT DISTINCT std.id AS student_id
//     //             FROM filtered_papers fp
//     //             JOIN latest_promotions pr
//     //               ON pr.program_course_id_fk = fp.programe_course_id_fk
//     //              AND pr.class_id_fk = fp.class_id_fk
//     //             JOIN students std ON std.id = pr.student_id_fk
//     //             JOIN users u ON u.id = std.user_id_fk
//     //             WHERE fp.is_optional = FALSE
//     //               AND u.is_active = TRUE
//     //         ),
//     //         optional AS (
//     //             SELECT DISTINCT std.id AS student_id
//     //             FROM filtered_papers fp
//     //             JOIN latest_promotions pr
//     //               ON pr.program_course_id_fk = fp.programe_course_id_fk
//     //              AND pr.class_id_fk = fp.class_id_fk
//     //             JOIN students std ON std.id = pr.student_id_fk
//     //             JOIN users u ON u.id = std.user_id_fk
//     //             JOIN latest_student_selections lss
//     //               ON lss.student_id_fk = std.id
//     //              AND lss.subject_id_fk = fp.subject_id_fk
//     //             JOIN subject_selection_meta sm
//     //               ON sm.id = lss.subject_selection_meta_id_fk
//     //              AND sm.subject_type_id_fk = fp.subject_type_id_fk
//     //             JOIN subject_selection_meta_classes smc
//     //               ON smc.subject_selection_meta_id_fk = sm.id
//     //              AND smc.class_id_fk = fp.class_id_fk
//     //             WHERE fp.is_optional = TRUE
//     //               AND u.is_active = TRUE
//     //         )
//     //         SELECT DISTINCT student_id
//     //         FROM (
//     //             SELECT * FROM mandatory
//     //             UNION ALL
//     //             SELECT * FROM optional
//     //         ) eligible_students
//     //     `;

//     //   const eligibleSql = `
//     //   WITH current_promotions AS (
//     //     -- Get the latest promotion specifically for the requested class + academic year + program + shift
//     //     SELECT DISTINCT ON (pr.student_id_fk)
//     //         pr.student_id_fk AS student_id,
//     //         pr.program_course_id_fk,
//     //         pr.class_id_fk,
//     //         pr.shift_id_fk
//     //     FROM promotions pr
//     //     JOIN sessions s ON s.id = pr.session_id_fk
//     //     JOIN academic_years ay ON ay.id = s.academic_id_fk
//     //     WHERE pr.is_alumni = FALSE
//     //       AND pr.class_id_fk = $2                    -- requested class (e.g., Semester I)
//     //       AND ay.id = ANY($3)                        -- requested academic year(s)
//     //       AND pr.program_course_id_fk = ANY($4)      -- requested program course(s)
//     //       ${shiftIds && shiftIds.length > 0 ? "AND pr.shift_id_fk = ANY($5)" : ""}
//     //     ORDER BY pr.student_id_fk,
//     //              pr.start_date DESC NULLS LAST,
//     //              pr.created_at DESC
//     //   ),

//     //   filtered_papers AS (
//     //     SELECT
//     //         p.id AS paper_id,
//     //         p.subject_id_fk,
//     //         p.subject_type_id_fk,
//     //         p.is_optional
//     //     FROM papers p
//     //     WHERE p.id = ANY($1)
//     //       AND p.class_id_fk = $2
//     //       AND p.program_course_id_fk = ANY($4)
//     //       AND p.academic_year_id_fk = ANY($3)
//     //       AND p.is_active = TRUE
//     //   ),

//     //   latest_student_selections AS (
//     //     SELECT
//     //         student_id_fk,
//     //         subject_id_fk,
//     //         subject_selection_meta_id_fk
//     //     FROM (
//     //         SELECT sss.*,
//     //                ROW_NUMBER() OVER (
//     //                  PARTITION BY sss.student_id_fk, sss.subject_selection_meta_id_fk
//     //                  ORDER BY sss.version DESC,
//     //                           sss.updated_at DESC NULLS LAST,
//     //                           sss.created_at DESC,
//     //                           sss.id DESC
//     //                ) AS rn
//     //         FROM student_subject_selections sss
//     //         WHERE sss.is_active = TRUE
//     //     ) ranked
//     //     WHERE rn = 1
//     //   ),

//     //   mandatory_students AS (
//     //     SELECT DISTINCT cp.student_id
//     //     FROM current_promotions cp
//     //     CROSS JOIN filtered_papers fp
//     //     WHERE fp.is_optional = FALSE
//     //   ),

//     //   optional_students AS (
//     //     SELECT DISTINCT cp.student_id
//     //     FROM current_promotions cp
//     //     JOIN filtered_papers fp ON fp.is_optional = TRUE
//     //     JOIN latest_student_selections lss
//     //       ON lss.student_id_fk = cp.student_id
//     //      AND lss.subject_id_fk = fp.subject_id_fk
//     //     JOIN subject_selection_meta sm
//     //       ON sm.id = lss.subject_selection_meta_id_fk
//     //      AND sm.subject_type_id_fk = fp.subject_type_id_fk
//     //     JOIN subject_selection_meta_classes smc
//     //       ON smc.subject_selection_meta_id_fk = sm.id
//     //      AND smc.class_id_fk = $2
//     //   )

//     //   SELECT DISTINCT student_id
//     //   FROM (
//     //     SELECT student_id FROM mandatory_students
//     //     UNION
//     //     SELECT student_id FROM optional_students
//     //   ) eligible
//     //   ORDER BY student_id;
//     // `;

// //     ${shiftIds && shiftIds.length > 0 ? "AND pr.shift_id_fk = ANY(COALESCE($5::int[], ARRAY[]::int[]))" : ""}
// //   ${gender && gender.trim() !== '' && gender.length > 1 ? "AND pd.gender = ANY(COALESCE($6::text[], ARRAY[]::text[]))" : ""}
// //   ${excelStudents.length > 0 ? "AND std.uid = ANY(COALESCE($7::text[], ARRAY[]::text[]))" : ""}

//     const eligibleSql = `
// WITH current_promotions AS (
//   -- Get the latest promotion specifically for the requested class + academic year + program + shift
//   SELECT DISTINCT ON (pr.student_id_fk)
//       pr.student_id_fk AS student_id,
//       pr.program_course_id_fk,
//       pr.class_id_fk,
//       pr.shift_id_fk
//   FROM promotions pr
//   JOIN sessions s ON s.id = pr.session_id_fk
//   JOIN academic_years ay ON ay.id = s.academic_id_fk
//   JOIN students std ON std.id = pr.student_id_fk
//   JOIN users u ON u.id = std.user_id_fk
//   JOIN personal_details pd ON pd.user_id_fk = u.id
//   WHERE pr.is_alumni = FALSE
//     AND pr.class_id_fk = $2                    -- requested class
//     AND ay.id = ANY($3)                        -- requested academic year(s)
//     AND pr.program_course_id_fk = ANY($4)      -- requested program course(s)

//    -- OPTIONAL FILTERS (SAFE)
//   AND pr.shift_id_fk = ANY($5::int[])
//   AND pd.gender::text = ANY($6::text[])
//   AND std.uid = ANY($7::text[])
//   ORDER BY pr.student_id_fk,
//            pr.start_date DESC NULLS LAST,
//            pr.created_at DESC
// ),

// filtered_papers AS (
//   SELECT
//       p.id AS paper_id,
//       p.subject_id_fk,
//       p.subject_type_id_fk,
//       p.is_optional
//   FROM papers p
//   WHERE p.id = ANY($1)
//     AND p.class_id_fk = $2
//     AND p.programe_course_id_fk = ANY($4)        -- Fixed: was "programe"
//     AND p.academic_year_id_fk = ANY($3)
//     AND p.is_active = TRUE
// ),

// latest_student_selections AS (
//   SELECT
//       student_id_fk,
//       subject_id_fk,
//       subject_selection_meta_id_fk
//   FROM (
//       SELECT sss.*,
//              ROW_NUMBER() OVER (
//                PARTITION BY sss.student_id_fk, sss.subject_selection_meta_id_fk
//                ORDER BY sss.version DESC,
//                         sss.updated_at DESC NULLS LAST,
//                         sss.created_at DESC,
//                         sss.id DESC
//              ) AS rn
//       FROM student_subject_selections sss
//       WHERE sss.is_active = TRUE
//   ) ranked
//   WHERE rn = 1
// ),

// mandatory_students AS (
//   SELECT DISTINCT cp.student_id
//   FROM current_promotions cp
//   JOIN students std ON std.id = cp.student_id
//   ${excelStudents.length === 0 ? 'JOIN users u ON u.id = std.user_id_fk AND u.is_active = TRUE' : ''}
//   CROSS JOIN filtered_papers fp
//   WHERE fp.is_optional = FALSE
// ),

// optional_students AS (
//   SELECT DISTINCT cp.student_id
//   FROM current_promotions cp
//   JOIN students std ON std.id = cp.student_id
//   ${excelStudents.length === 0 ? 'JOIN users u ON u.id = std.user_id_fk AND u.is_active = TRUE' : ''}
//   JOIN filtered_papers fp ON fp.is_optional = TRUE
//   JOIN latest_student_selections lss
//     ON lss.student_id_fk = cp.student_id
//    AND lss.subject_id_fk = fp.subject_id_fk
//   JOIN subject_selection_meta sm
//     ON sm.id = lss.subject_selection_meta_id_fk
//    AND sm.subject_type_id_fk = fp.subject_type_id_fk
//   JOIN subject_selection_meta_classes smc
//     ON smc.subject_selection_meta_id_fk = sm.id
//    AND smc.class_id_fk = $2
// )

// SELECT DISTINCT student_id
// FROM (
//   SELECT student_id FROM mandatory_students
//   UNION
//   SELECT student_id FROM optional_students
// ) eligible
// ORDER BY student_id;
// `;

//     const eligibleParams: any[] = [
//         paperIds, // $1
//         classId, // $2
//         academicYearIds, // $3
//         programCourseIds, // $4
//     ];

//     if (shiftIds && shiftIds.length > 0) {
//         eligibleParams.push(shiftIds); // $5
//     }
//     if (gender) {
//         if (gender.trim() !== '') {
//             eligibleParams.push([gender]); // $6
//         }
//     }

//     if (excelStudents.length > 0) {
//         const uids = excelStudents.map(e => e.uid)
//         eligibleParams.push(uids); // $7
//     }

//     const eligibleParamsU = [
//         paperIds,                                 // $1 int[]
//         classId,                                  // $2 int
//         academicYearIds,                          // $3 int[]
//         programCourseIds,                         // $4 int[]
//         shiftIds && shiftIds.length ? shiftIds : [], // $5 int[]
//         gender && gender.trim() ? [gender] : [],     // $6 text[]
//         excelStudents.length
//           ? excelStudents.map(e => e.uid)
//           : []                                     // $7 text[]
//       ];

//     console.log(eligibleParamsU)

//     const { rows } = await pool.query(eligibleSql, eligibleParamsU);

//     return rows
//         .map((row: { student_id: number }) => Number(row.student_id))
//         .filter((id: number) => !Number.isNaN(id));
// }

async function getEligibleStudentIds(
  params: CountStudentsByPapersParams,
): Promise<number[]> {
  const {
    classId,
    programCourseIds,
    paperIds,
    academicYearIds,
    shiftIds = [],
    gender = "",
    excelStudents = [],
  } = params;

  console.log("[EXAM-SCHEDULE] Getting eligible student IDs:", params);

  if (
    paperIds.length === 0 ||
    programCourseIds.length === 0 ||
    academicYearIds.length === 0
  ) {
    return [];
  }

  // Build dynamic WHERE conditions safely
  const conditions: string[] = [];
  const values: any[] = [
    paperIds, // $1
    classId, // $2
    academicYearIds, // $3
    programCourseIds, // $4
  ];
  let paramIndex = 5;

  if (shiftIds.length > 0) {
    conditions.push(`AND pr.shift_id_fk = ANY($${paramIndex})`);
    values.push(shiftIds);
    paramIndex++;
  }

  if (gender && gender.trim() !== "") {
    conditions.push(`AND pd.gender = ANY($${paramIndex})`);
    values.push([gender]);
    paramIndex++;
  }

  if (excelStudents.length > 0) {
    const uids = excelStudents.map((s) => s.uid);
    conditions.push(`AND std.uid = ANY($${paramIndex})`);
    values.push(uids);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? conditions.join("\n    ") : "";

  const eligibleSql = `
WITH current_promotions AS (
  SELECT DISTINCT ON (pr.student_id_fk)
      pr.student_id_fk AS student_id,
      pr.program_course_id_fk,
      pr.class_id_fk,
      pr.shift_id_fk
  FROM promotions pr
  JOIN sessions s ON s.id = pr.session_id_fk
  JOIN academic_years ay ON ay.id = s.academic_id_fk
  JOIN students std ON std.id = pr.student_id_fk
  JOIN users u ON u.id = std.user_id_fk
  JOIN personal_details pd ON pd.user_id_fk = u.id
  WHERE pr.is_alumni = FALSE
    AND pr.class_id_fk = $2
    AND ay.id = ANY($3)
    ${excelStudents.length === 0 ? "AND u.is_active = TRUE" : ""}
    AND pr.program_course_id_fk = ANY($4)
    ${whereClause}
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

  console.log("[EXAM-SCHEDULE] Executing SQL with params:", values);

  const { rows } = await pool.query(eligibleSql, values);

  return rows
    .map((row: { student_id: number }) => Number(row.student_id))
    .filter((id) => !Number.isNaN(id));
}

export async function countStudentsByPapers(
  params: CountStudentsByPapersParams,
): Promise<number> {
  const eligibleIds = await getEligibleStudentIds(params);
  return eligibleIds.length;
}

export interface CountStudentsBreakdownParams {
  classId: number;
  paperIds: number[];
  academicYearIds: number[];
  combinations: Array<{ programCourseId: number; shiftId: number }>;
  gender?: string | null;
  excelStudents?: { foil_number: string; uid: string }[];
}

export interface StudentCountBreakdownResult {
  programCourseId: number;
  shiftId: number;
  count: number;
}

export async function countStudentsByPapersBreakdown(
  params: CountStudentsBreakdownParams,
): Promise<{ breakdown: StudentCountBreakdownResult[]; total: number }> {
  const { combinations, ...baseParams } = params;

  if (combinations.length === 0) {
    return { breakdown: [], total: 0 };
  }

  // Execute all count queries in parallel
  const countPromises = combinations.map(async (combo) => {
    const eligibleIds = await getEligibleStudentIds({
      ...baseParams,
      programCourseIds: [combo.programCourseId],
      shiftIds: combo.shiftId ? [combo.shiftId] : [],
      gender:
        baseParams.gender === null || baseParams.gender === undefined
          ? null
          : baseParams.gender === "MALE" ||
              baseParams.gender === "FEMALE" ||
              baseParams.gender === "OTHER"
            ? baseParams.gender
            : null,
      excelStudents: baseParams.excelStudents || [],
    });
    return {
      programCourseId: combo.programCourseId,
      shiftId: combo.shiftId,
      count: eligibleIds.length,
    };
  });

  const breakdown = await Promise.all(countPromises);
  const total = breakdown.reduce((sum, item) => sum + item.count, 0);

  return { breakdown, total };
}

export interface GetStudentsByPapersParams extends CountStudentsByPapersParams {
  assignBy: "CU_ROLL_NUMBER" | "UID" | "CU_REGISTRATION_NUMBER";
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
  programCourseId: number | null;
  shiftId: number | null;
  registrationNumber: string | null;
  rollNumber: string | null;
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

  // Fetch students
  const students = await db
    .select({
      studentId: studentModel.id,
      uid: studentModel.uid,
      userName: userModel.name,
      userEmail: userModel.email,
      userWhatsappPhone: userModel.whatsappNumber,
      cuRegistrationApplicationNumber:
        cuRegistrationCorrectionRequestModel.cuRegistrationApplicationNumber,
      cuRollNumber: studentModel.rollNumber,
      cuRegistrationNumber: studentModel.registrationNumber,
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

  // Fetch latest promotions for these students to get programCourseId and shiftId
  const promotionMap = new Map<
    number,
    { programCourseId: number | null; shiftId: number | null }
  >();
  if (students.length > 0) {
    const promotionSubquery = db
      .select({
        studentId: promotionModel.studentId,
        programCourseId: promotionModel.programCourseId,
        shiftId: promotionModel.shiftId,
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
          inArray(
            promotionModel.studentId,
            students.map((s) => s.studentId),
          ),
          eq(promotionModel.classId, params.classId),
          inArray(promotionModel.programCourseId, params.programCourseIds),
          inArray(sessionModel.academicYearId, params.academicYearIds),
          params.shiftIds && params.shiftIds.length > 0
            ? inArray(promotionModel.shiftId, params.shiftIds)
            : sql`TRUE`,
        ),
      )
      .as("promotion_subquery");

    const latestPromotions = await db
      .select({
        studentId: promotionSubquery.studentId,
        programCourseId: promotionSubquery.programCourseId,
        shiftId: promotionSubquery.shiftId,
      })
      .from(promotionSubquery)
      .where(eq(promotionSubquery.rn, 1));

    latestPromotions.forEach((p) => {
      promotionMap.set(p.studentId, {
        programCourseId: p.programCourseId,
        shiftId: p.shiftId,
      });
    });
  }

  //   console.log("[EXAM-SCHEDULE] Students:", students);

  // Custom sort that pushes null/empty values to the end
  students.sort((a, b) => {
    let aValue: string | null | undefined;
    let bValue: string | null | undefined;

    if (params.assignBy === "UID") {
      aValue = a.uid;
      bValue = b.uid;
    } else if (params.assignBy === "CU_REGISTRATION_NUMBER") {
      aValue = a.cuRegistrationNumber;
      bValue = b.cuRegistrationNumber;
    } else {
      // CU_ROLL_NUMBER
      aValue = a.cuRollNumber;
      bValue = b.cuRollNumber;
    }

    // Normalize to empty string if null/undefined
    const aStr = aValue?.trim() || "";
    const bStr = bValue?.trim() || "";

    // Push empty values to the end
    if (!aStr && !bStr) return 0; // Both empty, equal
    if (!aStr) return 1; // a is empty, comes after b
    if (!bStr) return -1; // b is empty, comes after a

    // Both have values, compare normally
    return aStr.localeCompare(bStr);
  });

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
      const promotion = promotionMap.get(s.studentId);
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
        programCourseId: promotion?.programCourseId ?? null,
        shiftId: promotion?.shiftId ?? null,
        registrationNumber: s.cuRegistrationNumber,
        rollNumber: s.cuRollNumber,
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

/**
 * Checks if an exam with the same configuration already exists (without transaction)
 * Returns duplicate exam ID if found, null otherwise
 */
export async function checkDuplicateExam(dto: ExamDto): Promise<{
  isDuplicate: boolean;
  duplicateExamId?: number;
  message?: string;
}> {
  const academicYearId = dto.academicYear.id!;
  const examTypeId = dto.examType.id!;
  const classId = dto.class.id!;
  const programCourseIds = dto.examProgramCourses.map(
    (pc) => pc.programCourse.id!,
  );
  const shiftIds = dto.examShifts.map((s) => s.shift.id!);
  const subjectTypeIds = dto.examSubjectTypes.map((st) => st.subjectType.id!);
  const roomIds = dto.locations.map((loc) => loc.room.id!);

  // Get affiliation and regulation from papers
  const paperRows = await db.execute(
    sql`
      SELECT DISTINCT p.affiliation_id_fk, p.regulation_type_id_fk
      FROM papers p
      WHERE p.class_id_fk = ${classId}
        AND p.programe_course_id_fk = ANY(ARRAY[${sql.join(programCourseIds, sql`, `)}]::int[])
        AND p.academic_year_id_fk = ${academicYearId}
        AND p.is_active = TRUE
    `,
  );

  if (paperRows.rows.length === 0) {
    return { isDuplicate: false };
  }

  const affiliationIds = Array.from(
    new Set(
      paperRows.rows
        .map((r: any) => Number(r.affiliation_id_fk))
        .filter((id: number) => !isNaN(id)),
    ),
  );
  const regulationTypeIds = Array.from(
    new Set(
      paperRows.rows
        .map((r: any) => Number(r.regulation_type_id_fk))
        .filter((id: number) => !isNaN(id)),
    ),
  );

  // Find existing exams with same academic-year, exam-type, and semester
  const existingExams = await db
    .select({
      id: examModel.id,
    })
    .from(examModel)
    .where(
      and(
        eq(examModel.academicYearId, academicYearId),
        eq(examModel.examTypeId, examTypeId),
        eq(examModel.classId, classId),
      ),
    );

  if (existingExams.length === 0) {
    return { isDuplicate: false };
  }

  const existingExamIds = existingExams.map((e) => e.id);

  // For each existing exam, check if it matches all criteria
  for (const existingExamId of existingExamIds) {
    // Check shifts
    const existingShifts = await db
      .select({ shiftId: examShiftModel.shiftId })
      .from(examShiftModel)
      .where(eq(examShiftModel.examId, existingExamId));

    const existingShiftIds = existingShifts.map((s) => s.shiftId).sort();
    const newShiftIds = [...shiftIds].sort();

    if (
      existingShiftIds.length !== newShiftIds.length ||
      !existingShiftIds.every((id, idx) => id === newShiftIds[idx])
    ) {
      continue; // Shifts don't match, check next exam
    }

    // Check program courses
    const existingProgramCourses = await db
      .select({ programCourseId: examProgramCourseModel.programCourseId })
      .from(examProgramCourseModel)
      .where(eq(examProgramCourseModel.examId, existingExamId));

    const existingProgramCourseIds = existingProgramCourses
      .map((pc) => pc.programCourseId)
      .sort();
    const newProgramCourseIds = [...programCourseIds].sort();

    if (
      existingProgramCourseIds.length !== newProgramCourseIds.length ||
      !existingProgramCourseIds.every(
        (id, idx) => id === newProgramCourseIds[idx],
      )
    ) {
      continue; // Program courses don't match, check next exam
    }

    // Check subject types
    const existingSubjectTypes = await db
      .select({ subjectTypeId: examSubjectTypeModel.subjectTypeId })
      .from(examSubjectTypeModel)
      .where(eq(examSubjectTypeModel.examId, existingExamId));

    const existingSubjectTypeIds = existingSubjectTypes
      .map((st) => st.subjectTypeId)
      .sort();
    const newSubjectTypeIds = [...subjectTypeIds].sort();

    if (
      existingSubjectTypeIds.length !== newSubjectTypeIds.length ||
      !existingSubjectTypeIds.every((id, idx) => id === newSubjectTypeIds[idx])
    ) {
      continue; // Subject types don't match, check next exam
    }

    // Check rooms (only if rooms are provided in the new exam)
    if (roomIds.length > 0) {
      const existingRooms = await db
        .select({ roomId: examRoomModel.roomId })
        .from(examRoomModel)
        .where(eq(examRoomModel.examId, existingExamId));

      const existingRoomIds = existingRooms.map((r) => r.roomId).sort();
      const newRoomIds = [...roomIds].sort();

      if (
        existingRoomIds.length !== newRoomIds.length ||
        !existingRoomIds.every((id, idx) => id === newRoomIds[idx])
      ) {
        continue; // Rooms don't match, check next exam
      }
    }
    // If no rooms provided in new exam, skip room comparison (allows early duplicate detection)

    // Check subjects with same date and time
    const existingSubjects = await db
      .select({
        subjectId: examSubjectModel.subjectId,
        startTime: examSubjectModel.startTime,
        endTime: examSubjectModel.endTime,
      })
      .from(examSubjectModel)
      .where(eq(examSubjectModel.examId, existingExamId));

    // Must have same number of subjects
    if (existingSubjects.length !== dto.examSubjects.length) {
      continue; // Different number of subjects, check next exam
    }

    // Check if all new subjects match existing subjects (same subjectId, startTime, endTime)
    const normalizeTime = (time: Date | null): number | null => {
      if (!time) return null;
      return new Date(time).getTime();
    };

    const allNewSubjectsMatch = dto.examSubjects.every((newSubject) => {
      const newSubjectId = newSubject.subject.id!;
      const newStartTime = normalizeTime(
        newSubject.startTime ? new Date(newSubject.startTime) : null,
      );
      const newEndTime = normalizeTime(
        newSubject.endTime ? new Date(newSubject.endTime) : null,
      );

      return existingSubjects.some((existingSubject) => {
        if (existingSubject.subjectId !== newSubjectId) return false;

        const existingStartTime = normalizeTime(
          existingSubject.startTime
            ? new Date(existingSubject.startTime)
            : null,
        );
        const existingEndTime = normalizeTime(
          existingSubject.endTime ? new Date(existingSubject.endTime) : null,
        );

        return (
          newStartTime === existingStartTime && newEndTime === existingEndTime
        );
      });
    });

    const allExistingSubjectsMatch = existingSubjects.every(
      (existingSubject) => {
        const existingSubjectId = existingSubject.subjectId;
        const existingStartTime = normalizeTime(
          existingSubject.startTime
            ? new Date(existingSubject.startTime)
            : null,
        );
        const existingEndTime = normalizeTime(
          existingSubject.endTime ? new Date(existingSubject.endTime) : null,
        );

        return dto.examSubjects.some((newSubject) => {
          const newSubjectId = newSubject.subject.id!;
          if (newSubjectId !== existingSubjectId) return false;

          const newStartTime = normalizeTime(
            newSubject.startTime ? new Date(newSubject.startTime) : null,
          );
          const newEndTime = normalizeTime(
            newSubject.endTime ? new Date(newSubject.endTime) : null,
          );

          return (
            newStartTime === existingStartTime && newEndTime === existingEndTime
          );
        });
      },
    );

    if (!allNewSubjectsMatch || !allExistingSubjectsMatch) {
      continue; // Subjects don't match, check next exam
    }

    // Check affiliation and regulation via papers
    const existingPaperRows = await db.execute(
      sql`
        SELECT DISTINCT p.affiliation_id_fk, p.regulation_type_id_fk
        FROM papers p
        JOIN exam_program_courses epc ON epc.program_course_id_fk = p.programe_course_id_fk
        WHERE epc.exam_id_fk = ${existingExamId}
          AND p.class_id_fk = ${classId}
          AND p.academic_year_id_fk = ${academicYearId}
          AND p.is_active = TRUE
      `,
    );

    const existingAffiliationIds = Array.from(
      new Set(
        existingPaperRows.rows
          .map((r: any) => Number(r.affiliation_id_fk))
          .filter((id: number) => !isNaN(id)),
      ),
    ).sort();
    const existingRegulationTypeIds = Array.from(
      new Set(
        existingPaperRows.rows
          .map((r: any) => Number(r.regulation_type_id_fk))
          .filter((id: number) => !isNaN(id)),
      ),
    ).sort();

    const newAffiliationIds = [...affiliationIds].sort();
    const newRegulationTypeIds = [...regulationTypeIds].sort();

    if (
      existingAffiliationIds.length !== newAffiliationIds.length ||
      !existingAffiliationIds.every(
        (id, idx) => id === newAffiliationIds[idx],
      ) ||
      existingRegulationTypeIds.length !== newRegulationTypeIds.length ||
      !existingRegulationTypeIds.every(
        (id, idx) => id === newRegulationTypeIds[idx],
      )
    ) {
      continue; // Affiliation/regulation don't match, check next exam
    }

    // All criteria match - duplicate found!
    return {
      isDuplicate: true,
      duplicateExamId: existingExamId,
      message: `An exam with the same configuration already exists (Exam ID: ${existingExamId}).`,
    };
  }

  return { isDuplicate: false };
}

/**
 * Validates if an exam with the same configuration already exists (within transaction)
 * Checks for duplicates based on:
 * - academic-year, exam-type, semester
 * - shifts, program-courses, subject-categories/types
 * - rooms
 * - subjects with same date and time
 * - affiliation and regulation (via papers)
 */
async function validateDuplicateExam(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  dto: ExamDto,
): Promise<void> {
  // Use the same logic but within transaction context
  // We'll reuse the checkDuplicateExam logic but adapt it for transaction
  const duplicateCheck = await checkDuplicateExam(dto);
  if (duplicateCheck.isDuplicate) {
    throw new Error(
      duplicateCheck.message ||
        `An exam with the same configuration already exists (Exam ID: ${duplicateCheck.duplicateExamId}).`,
    );
  }
}

/**
 * Gets eligible rooms for exam scheduling based on date and time slots
 * Filters out rooms that are already booked during the specified time periods
 */
export async function getEligibleRooms(
  examSubjects: Array<{
    subjectId: number;
    startTime: Date | string;
    endTime: Date | string;
  }>,
): Promise<RoomDto[]> {
  // Get all active rooms
  const allRooms = await db
    .select()
    .from(roomModel)
    .where(eq(roomModel.isActive, true));

  if (allRooms.length === 0) {
    return [];
  }

  // If no exam subjects provided, return all active rooms sorted by name
  if (examSubjects.length === 0) {
    const dtos: RoomDto[] = [];
    for (const room of allRooms) {
      let floor = null;
      if (room.floorId) {
        const [foundFloor] = await db
          .select()
          .from(floorModel)
          .where(eq(floorModel.id, room.floorId));
        floor = foundFloor || null;
      }
      dtos.push({
        ...room,
        floor: floor!,
      });
    }
    return dtos.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }

  // Get all exam subjects with their time slots
  const allExamSubjects = await db
    .select({
      examId: examSubjectModel.examId,
      startTime: examSubjectModel.startTime,
      endTime: examSubjectModel.endTime,
    })
    .from(examSubjectModel);

  // Get all exam rooms
  const allExamRooms = await db
    .select({
      examId: examRoomModel.examId,
      roomId: examRoomModel.roomId,
    })
    .from(examRoomModel);

  // Create a map of roomId -> examIds that use this room
  const roomToExams = new Map<number, Set<number>>();
  for (const examRoom of allExamRooms) {
    if (!roomToExams.has(examRoom.roomId)) {
      roomToExams.set(examRoom.roomId, new Set());
    }
    roomToExams.get(examRoom.roomId)!.add(examRoom.examId);
  }

  // Create a map of examId -> time slots
  const examToTimeSlots = new Map<number, Array<{ start: Date; end: Date }>>();
  for (const examSubject of allExamSubjects) {
    if (!examToTimeSlots.has(examSubject.examId)) {
      examToTimeSlots.set(examSubject.examId, []);
    }
    const startTime = new Date(examSubject.startTime);
    const endTime = new Date(examSubject.endTime);
    examToTimeSlots
      .get(examSubject.examId)!
      .push({ start: startTime, end: endTime });
  }

  // Helper function to check if two time ranges overlap
  const timeRangesOverlap = (
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date,
  ): boolean => {
    return start1 < end2 && start2 < end1;
  };

  // Filter eligible rooms
  const eligibleRooms: RoomDto[] = [];

  for (const room of allRooms) {
    const examIdsUsingRoom = roomToExams.get(room.id!) || new Set();

    // Check if this room is booked during any of the requested time slots
    let isBooked = false;

    for (const requestedSubject of examSubjects) {
      const requestedStart = new Date(requestedSubject.startTime);
      const requestedEnd = new Date(requestedSubject.endTime);

      // Check if any exam using this room has overlapping time slots
      for (const examId of examIdsUsingRoom) {
        const timeSlots = examToTimeSlots.get(examId) || [];
        for (const slot of timeSlots) {
          if (
            timeRangesOverlap(
              requestedStart,
              requestedEnd,
              slot.start,
              slot.end,
            )
          ) {
            isBooked = true;
            break;
          }
        }
        if (isBooked) break;
      }
      if (isBooked) break;
    }

    // If room is not booked during requested times, it's eligible
    if (!isBooked) {
      let floor = null;
      if (room.floorId) {
        const [foundFloor] = await db
          .select()
          .from(floorModel)
          .where(eq(floorModel.id, room.floorId));
        floor = foundFloor || null;
      }
      eligibleRooms.push({
        ...room,
        floor: floor!,
      });
    }
  }

  // Sort by name
  return eligibleRooms.sort((a, b) =>
    (a.name || "").localeCompare(b.name || ""),
  );
}

export async function createExamAssignment(
  dto: ExamDto,
  excelStudents: { foil_number: string; uid: string }[],
  userId?: number,
) {
  return await db.transaction(async (tx) => {
    console.log(
      "[EXAM-SCHEDULE:createExamAssignment] Creating exam assignment:",
      dto,
      userId,
    );

    // Validate for duplicate exams before creating
    await validateDuplicateExam(tx, dto);

    console.log(dto.academicYear);
    console.log(dto.class);
    console.log(dto.examType);
    console.log(dto.examSubjects);
    // 1. Create exam record
    const [exam] = await tx
      .insert(examModel)
      .values({
        academicYearId: dto.academicYear.id!,
        examTypeId: dto.examType.id!,
        classId: dto.class.id!,
        gender: dto.gender,
        orderType: dto.orderType,
        scheduledByUserId: userId || null,
        lastUpdatedByUserId: userId || null,
      })
      .returning();

    if (!exam) throw new Error("Failed to create exam");

    // Emit socket event for exam creation
    const io = socketService.getIO();
    if (io) {
      io.emit("exam_created", {
        examId: exam.id,
        type: "creation",
        message: "A new exam has been created",
        timestamp: new Date().toISOString(),
      });
      // Also emit notification to all admins/staff
      io.emit("notification", {
        id: `exam_created_${exam.id}_${Date.now()}`,
        type: "info",
        message: `A new exam (ID: ${exam.id}) has been created`,
        createdAt: new Date(),
        read: false,
        meta: { examId: exam.id, type: "creation" },
      });
    }

    // 2. Insert exam rooms (only if locations provided)
    const roomIdToExamRoom = new Map<number, any>();
    if (dto.locations && dto.locations.length > 0) {
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

    // 4. Insert exam subjects with paperId
    // Now exam_subject includes paperId, so we need to create one record per subject+paper combination
    const subjectPaperToExamSubject = new Map<string, number>(); // key: "subjectId|paperId"
    for (const subj of dto.examSubjects) {
      const paperId = subj.paperId || null; // paperId is now part of exam_subject
      const [es] = await tx
        .insert(examSubjectModel)
        .values({
          examId: exam.id,
          subjectId: subj.subject.id!,
          paperId: paperId,
          startTime: subj.startTime ? new Date(subj.startTime) : new Date(),
          endTime: subj.endTime ? new Date(subj.endTime) : new Date(),
        })
        .returning();
      const key = `${subj.subject.id!}|${paperId || "null"}`;
      subjectPaperToExamSubject.set(key, es.id);
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

    // 6. Prepare seat assignment (only if rooms provided)
    let studentsWithSeats: StudentWithSeat[] = [];
    if (dto.locations && dto.locations.length > 0) {
      const seatParams: GetStudentsByPapersParams = {
        classId: dto.class.id!,
        excelStudents,
        programCourseIds: programCourseIdsArr, // ← now always array
        paperIds: Array.from(paperMap.values()),
        academicYearIds: [dto.academicYear.id!],
        shiftIds: shiftIdsArr.length > 0 ? shiftIdsArr : undefined,
        assignBy: dto.orderType!,
        gender: dto.gender,
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
      studentsWithSeats = await getStudentsByPapers(
        seatParams,
        roomAssignments,
      );
      if (studentsWithSeats.length === 0)
        throw new Error("No eligible students found");
    }

    // 7. Batch fetch latest promotion for each student (only if students exist)
    const promotionMap = new Map<number, number>();
    if (studentsWithSeats.length > 0) {
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

      latestPromotions.forEach((p) => {
        promotionMap.set(p.studentId, p.promotionId);
      });
    }

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

    // Note: examSubjectId is no longer a single value since we have multiple exam_subjects per subject (one per paper)
    // This is kept for backward compatibility but may not be used
    const examSubjectId =
      dto.examSubjects.length > 0 && dto.examSubjects[0].paperId
        ? subjectPaperToExamSubject.get(
            `${dto.examSubjects[0].subject.id!}|${dto.examSubjects[0].paperId}`,
          )
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

    // 9. Build and insert exam_candidates (only if rooms and students provided)
    const candidateInserts: ExamCandidate[] = [];

    if (
      studentsWithSeats.length > 0 &&
      dto.locations &&
      dto.locations.length > 0
    ) {
      console.log("dto.examSubjects:", dto.examSubjects);

      for (const subj of dto.examSubjects) {
        for (const st of dto.examSubjectTypes) {
          const paperKey = `${subj.subject.id}|${st.subjectType.id}`;
          const paperId = paperMap.get(paperKey);

          if (!paperId) {
            // No paper for this subject + type → skip safely
            continue;
          }

          // Find exam_subject.id using both subjectId and paperId
          const examSubjectKey = `${subj.subject.id!}|${paperId}`;
          const examSubjectId = subjectPaperToExamSubject.get(examSubjectKey);

          if (!examSubjectId) {
            // Try with null paperId as fallback (for backward compatibility)
            const fallbackKey = `${subj.subject.id!}|null`;
            const fallbackExamSubjectId =
              subjectPaperToExamSubject.get(fallbackKey);
            if (!fallbackExamSubjectId) {
              throw new Error(
                `Exam subject not found for subject ${subj.subject.id} and paper ${paperId}`,
              );
            }
            // Use fallback if found
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

              const examSubjectTypeId = examSubjectTypeMap.get(
                st.subjectType.id!,
              );

              if (!examSubjectTypeId) {
                throw new Error(
                  `Exam subject type not found for subjectType ${st.id}`,
                );
              }

              const foilNumber =
                excelStudents.find((es) => es.uid == s.uid)?.foil_number ||
                null;

              candidateInserts.push({
                examId: exam.id!,
                promotionId,
                examRoomId: examRoom.id!,
                examSubjectTypeId: examSubjectTypeId!,
                examSubjectId: fallbackExamSubjectId,
                paperId,
                seatNumber: s.seatNumber,
                foilNumber,
              });
            }
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

            const examSubjectTypeId = examSubjectTypeMap.get(
              st.subjectType.id!,
            );

            if (!examSubjectTypeId) {
              throw new Error(
                `Exam subject type not found for subjectType ${st.id}`,
              );
            }

            const foilNumber =
              excelStudents.find((es) => es.uid == s.uid)?.foil_number || null;

            console.log("in exam-candidate insert, foil_number:", foilNumber);

            candidateInserts.push({
              examId: exam.id!,
              promotionId,
              examRoomId: examRoom.id!,
              examSubjectTypeId: examSubjectTypeId!, // resolved earlier
              examSubjectId, // 🔥 correct subject+paper combination
              paperId, // 🔥 correct paper
              seatNumber: s.seatNumber,
              foilNumber,
            });
          }
        }
      }

      console.log("candidateInserts:", candidateInserts.length);
      if (candidateInserts.length > 0) {
        await tx.insert(examCandidateModel).values(candidateInserts);
      }
    }

    return {
      examId: exam.id,
      totalStudentsAssigned: studentsWithSeats.length,
      roomsAssigned: dto.locations?.length || 0,
      message:
        dto.locations && dto.locations.length > 0
          ? "Exam assignment created successfully"
          : "Exam scheduled successfully. Rooms and students can be allotted later.",
    };
  });
}

/**
 * Allot rooms and students to an existing exam
 * This function adds exam rooms and exam candidates to an already scheduled exam
 */
export async function allotExamRoomsAndStudents(
  examId: number,
  dto: {
    locations: ExamRoomDto[];
    orderType: "CU_ROLL_NUMBER" | "UID" | "CU_REGISTRATION_NUMBER";
    gender: "MALE" | "FEMALE" | "OTHER" | null;
    admitCardStartDownloadDate?: string | null;
    admitCardLastDownloadDate?: string | null;
  },
  excelStudents: { foil_number: string; uid: string }[],
  userId?: number,
) {
  return await db.transaction(async (tx) => {
    console.log(
      "[EXAM-SCHEDULE:allotExamRoomsAndStudents] Allotting rooms and students to exam:",
      examId,
      userId,
    );

    // Verify exam exists
    const [exam] = await tx
      .select()
      .from(examModel)
      .where(eq(examModel.id, examId));

    if (!exam) {
      throw new Error(`Exam with ID ${examId} not found`);
    }

    // Check if exam already has rooms assigned
    const existingRooms = await tx
      .select()
      .from(examRoomModel)
      .where(eq(examRoomModel.examId, examId));

    if (existingRooms.length > 0) {
      throw new Error(
        `Exam ${examId} already has rooms assigned. Please remove existing rooms first or use update endpoint.`,
      );
    }

    // Update exam with gender, orderType, and admit card dates if provided
    const updateData: Partial<typeof examModel.$inferInsert> = {};
    if (dto.gender !== null || dto.orderType) {
      updateData.gender = dto.gender ?? exam.gender;
      updateData.orderType = dto.orderType ?? exam.orderType;
    }
    // Always update admit card dates if they're provided (including null to clear them)
    if (dto.admitCardStartDownloadDate !== undefined) {
      updateData.admitCardStartDownloadDate = dto.admitCardStartDownloadDate
        ? new Date(dto.admitCardStartDownloadDate)
        : null;
    }
    if (dto.admitCardLastDownloadDate !== undefined) {
      updateData.admitCardLastDownloadDate = dto.admitCardLastDownloadDate
        ? new Date(dto.admitCardLastDownloadDate)
        : null;
    }
    // Track user who updated
    if (userId) {
      updateData.lastUpdatedByUserId = userId;
    }

    if (Object.keys(updateData).length > 0) {
      await tx
        .update(examModel)
        .set(updateData)
        .where(eq(examModel.id, examId));
    }

    // 1. Insert exam rooms
    const roomIdToExamRoom = new Map<number, any>();
    for (const loc of dto.locations) {
      const [er] = await tx
        .insert(examRoomModel)
        .values({
          examId: examId,
          roomId: loc.room.id!,
          capacity: loc.capacity,
          studentsPerBench: loc.studentsPerBench,
        })
        .returning();

      roomIdToExamRoom.set(loc.room.id!, er);
    }

    // 2. Get exam subjects and subject types (no need to call findById - we already have exam)
    const examSubjects = await tx
      .select()
      .from(examSubjectModel)
      .where(eq(examSubjectModel.examId, examId));

    const examSubjectTypes = await tx
      .select()
      .from(examSubjectTypeModel)
      .where(eq(examSubjectTypeModel.examId, examId));

    if (examSubjects.length === 0) {
      throw new Error(`Exam ${examId} has no subjects scheduled`);
    }

    // 4. Get exam program courses and shifts
    const examProgramCourses = await tx
      .select()
      .from(examProgramCourseModel)
      .where(eq(examProgramCourseModel.examId, examId));

    const examShifts = await tx
      .select()
      .from(examShiftModel)
      .where(eq(examShiftModel.examId, examId));

    const programCourseIds = examProgramCourses.map(
      (epc) => epc.programCourseId,
    );
    const shiftIds = examShifts.map((es) => es.shiftId);
    const subjectIds = examSubjects.map((es) => es.subjectId);
    const subjectTypeIds = examSubjectTypes.map((est) => est.subjectTypeId);

    // 5. Resolve papers
    const safeArray = <T>(arr: T[] | T | undefined): T[] =>
      Array.isArray(arr) ? arr : arr != null ? [arr] : [];

    const programCourseIdsArr = safeArray(programCourseIds);
    const subjectIdsArr = safeArray(subjectIds);
    const subjectTypeIdsArr = safeArray(subjectTypeIds);
    const shiftIdsArr = safeArray(shiftIds);

    const paperRows = await tx.execute(
      sql`
      SELECT
        p.id,
        p.subject_id_fk,
        p.subject_type_id_fk
      FROM papers p
      WHERE p.class_id_fk = ${exam.classId}
        AND p.programe_course_id_fk = ANY(ARRAY[${sql.join(programCourseIdsArr, sql`, `)}]::int[])
        AND p.academic_year_id_fk = ${exam.academicYearId}
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
      throw new Error(
        "No active papers found for the given exam configuration",
      );
    }

    // Map: subjectId|subjectTypeId → paperId
    const paperMap = new Map<string, number>();
    for (const row of paperRows.rows as any[]) {
      const key = `${row.subject_id_fk}|${row.subject_type_id_fk}`;
      paperMap.set(key, Number(row.id));
    }

    // 6. Prepare seat assignment
    const seatParams: GetStudentsByPapersParams = {
      classId: exam.classId,
      excelStudents,
      programCourseIds: programCourseIdsArr,
      paperIds: Array.from(paperMap.values()),
      academicYearIds: [exam.academicYearId],
      shiftIds: shiftIdsArr.length > 0 ? shiftIdsArr : undefined,
      assignBy: dto.orderType,
      gender: dto.gender,
    };

    // Fetch full room details for room assignments
    const roomIds = dto.locations.map((l) => l.room.id!);
    const roomsData = await tx
      .select()
      .from(roomModel)
      .where(inArray(roomModel.id, roomIds));

    const roomMap = new Map(roomsData.map((r) => [r.id, r]));

    const roomAssignments = dto.locations.map((l) => {
      const room = roomMap.get(l.room.id!);
      if (!room) {
        throw new Error(`Room with ID ${l.room.id} not found`);
      }
      return {
        roomId: l.room.id!,
        floorId: room.floorId ?? null,
        floorName: null, // Will be resolved if needed
        roomName: room.name,
        maxStudentsPerBench: l.studentsPerBench,
        numberOfBenches: room.numberOfBenches || 0,
        capacity:
          l.capacity || (room.numberOfBenches || 0) * l.studentsPerBench,
      };
    });

    const studentsWithSeats = await getStudentsByPapers(
      seatParams,
      roomAssignments,
    );

    if (studentsWithSeats.length === 0) {
      throw new Error("No eligible students found");
    }

    // 7. Batch fetch latest promotion for each student
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
          eq(promotionModel.classId, exam.classId),
          inArray(promotionModel.programCourseId, programCourseIds),
          eq(sessionModel.academicYearId, exam.academicYearId),
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

    // 8. Create exam subject and subject type maps
    // Now exam_subject includes paperId, so we map by subjectId|paperId
    const subjectPaperToExamSubject = new Map<string, number>(); // key: "subjectId|paperId"
    for (const es of examSubjects) {
      const key = `${es.subjectId}|${es.paperId || "null"}`;
      subjectPaperToExamSubject.set(key, es.id);
    }

    const examSubjectTypeMap = new Map<number, number>();
    for (const est of examSubjectTypes) {
      examSubjectTypeMap.set(est.subjectTypeId, est.id);
    }

    // 9. Build and insert exam_candidates
    const candidateInserts: ExamCandidate[] = [];

    for (const examSubject of examSubjects) {
      const examSubjectId = examSubject.id;
      const paperId = examSubject.paperId; // paperId is now part of exam_subject

      if (!paperId) {
        // Fallback: if paperId is null, find it from paperMap (backward compatibility)
        for (const examSubjectType of examSubjectTypes) {
          const paperKey = `${examSubject.subjectId}|${examSubjectType.subjectTypeId}`;
          const mappedPaperId = paperMap.get(paperKey);

          if (!mappedPaperId) {
            continue;
          }

          const examSubjectTypeId = examSubjectType.id;

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

            const foilNumber =
              excelStudents.find((es) => es.uid == s.uid)?.foil_number || null;

            candidateInserts.push({
              examId: examId,
              promotionId,
              examRoomId: examRoom.id!,
              examSubjectTypeId,
              examSubjectId,
              paperId: mappedPaperId,
              seatNumber: s.seatNumber,
              foilNumber,
            });
          }
        }
      } else {
        // paperId is set in exam_subject, use it directly
        // Find the corresponding examSubjectTypeId for this paper
        const examSubjectTypeId = examSubjectTypes.find((est) => {
          const paperKey = `${examSubject.subjectId}|${est.subjectTypeId}`;
          return paperMap.get(paperKey) === paperId;
        })?.id;

        if (!examSubjectTypeId) {
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

          const foilNumber =
            excelStudents.find((es) => es.uid == s.uid)?.foil_number || null;

          candidateInserts.push({
            examId: examId,
            promotionId,
            examRoomId: examRoom.id!,
            examSubjectTypeId,
            examSubjectId,
            paperId,
            seatNumber: s.seatNumber,
            foilNumber,
          });
        }
      }
    }

    console.log("candidateInserts:", candidateInserts.length);
    if (candidateInserts.length > 0) {
      await tx.insert(examCandidateModel).values(candidateInserts);
    }

    // Emit socket event for exam update
    const io = socketService.getIO();
    if (io) {
      io.emit("exam_updated", {
        examId: examId,
        type: "allotment",
        message: "Exam rooms and students have been allotted",
        timestamp: new Date().toISOString(),
      });
      // Also emit to all admins/staff
      io.emit("notification", {
        id: `exam_update_${examId}_${Date.now()}`,
        type: "update",
        message: `Exam ${examId} has been updated with room allotment`,
        createdAt: new Date(),
        read: false,
        meta: { examId, type: "allotment" },
      });
    }

    return {
      examId: examId,
      totalStudentsAssigned: studentsWithSeats.length,
      roomsAssigned: dto.locations.length,
      message: "Rooms and students allotted successfully",
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

export async function findByStudentId(studentId: number): Promise<ExamDto[]> {
  const foundExams = await db
    .select()
    .from(examModel)
    .leftJoin(examCandidateModel, eq(examCandidateModel.examId, examModel.id))
    .leftJoin(
      promotionModel,
      eq(promotionModel.id, examCandidateModel.promotionId),
    )
    .leftJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .where(eq(studentModel.id, studentId));

  return (
    await Promise.all(
      foundExams.map(async (exm) => await modelToDto(exm.exams)),
    )
  ).filter((ele) => ele !== null);
}

export interface ExamFilters {
  examTypeId?: number | null;
  classId?: number | null;
  academicYearId?: number | null;
  affiliationId?: number | null;
  regulationTypeId?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  status?: "upcoming" | "recent" | "previous" | null;
}

export async function findAll(
  page: number = 1,
  pageSize: number = 10,
  filters?: ExamFilters,
): Promise<PaginatedResponse<ExamDto>> {
  const offset = (page - 1) * pageSize;

  // Build where conditions
  const whereConditions = [];

  if (filters?.examTypeId) {
    whereConditions.push(eq(examModel.examTypeId, filters.examTypeId));
  }

  if (filters?.classId) {
    whereConditions.push(eq(examModel.classId, filters.classId));
  }

  if (filters?.academicYearId) {
    whereConditions.push(eq(examModel.academicYearId, filters.academicYearId));
  }

  if (filters?.dateFrom && filters?.dateTo) {
    // Filter by admit card download dates
    whereConditions.push(
      and(
        gte(examModel.admitCardStartDownloadDate, new Date(filters.dateFrom)),
        lte(examModel.admitCardLastDownloadDate, new Date(filters.dateTo)),
      )!,
    );
  } else if (filters?.dateFrom) {
    whereConditions.push(
      gte(examModel.admitCardStartDownloadDate, new Date(filters.dateFrom)),
    );
  } else if (filters?.dateTo) {
    whereConditions.push(
      lte(examModel.admitCardLastDownloadDate, new Date(filters.dateTo)),
    );
  }

  const whereClause =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  // Fetch exams with filters
  const exams = await db
    .select()
    .from(examModel)
    .where(whereClause)
    .limit(pageSize)
    .offset(offset)
    .orderBy(desc(examModel.createdAt));

  // Get total count with same filters
  const [{ totalCount }] = await db
    .select({
      totalCount: count(examModel.id),
    })
    .from(examModel)
    .where(whereClause);

  // Map to DTOs
  let content = (
    await Promise.all(exams.map(async (exm) => await modelToDto(exm)))
  ).filter((ele) => ele !== null);

  // Apply filters that require DTO-level data
  if (filters?.affiliationId || filters?.regulationTypeId || filters?.status) {
    const now = new Date();
    content = content.filter((exam) => {
      if (!exam) return false;

      // Filter by affiliation (check program courses)
      if (filters.affiliationId) {
        const hasAffiliation = exam.examProgramCourses?.some(
          (pc) => pc.programCourse?.affiliation?.id === filters.affiliationId,
        );
        if (!hasAffiliation) return false;
      }

      // Filter by regulation type (check program courses)
      if (filters.regulationTypeId) {
        const hasRegulation = exam.examProgramCourses?.some(
          (pc) =>
            pc.programCourse?.regulationType?.id === filters.regulationTypeId,
        );
        if (!hasRegulation) return false;
      }

      // Filter by status (based on exam subjects dates)
      if (filters.status) {
        if (!exam.examSubjects || exam.examSubjects.length === 0) {
          return false;
        }

        // Get first and last exam subject dates
        const dates = exam.examSubjects
          .map((sub) => ({
            start: new Date(sub.startTime),
            end: new Date(sub.endTime),
          }))
          .sort((a, b) => a.start.getTime() - b.start.getTime());

        const firstStart = dates[0]?.start;
        const lastEnd = dates[dates.length - 1]?.end;

        if (!firstStart || !lastEnd) return false;

        if (filters.status === "upcoming") {
          // Exam hasn't started yet
          return firstStart > now;
        } else if (filters.status === "recent") {
          // Exam is ongoing or ends within last 7 days
          return (
            firstStart <= now &&
            lastEnd >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          );
        } else if (filters.status === "previous") {
          // Exam ended more than 7 days ago
          return lastEnd < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
      }

      return true;
    });
  }

  return {
    content,
    page,
    pageSize,
    totalElements: filters?.status ? content.length : totalCount,
    totalPages: Math.ceil(
      (filters?.status ? content.length : totalCount) / pageSize,
    ),
  };
}

async function modelToDto(model: ExamT | null): Promise<ExamDto | null> {
  if (!model) return null;

  // Execute all independent queries in parallel
  const [
    foundAcademicYear,
    foundExamTypeResult,
    foundClass,
    scheduledByUserResult,
    lastUpdatedByUserResult,
    foundExamProgramCourses,
    foundExamShifts,
    foundExamSubjects,
    foundExamSubjectType,
    foundExamRooms,
  ] = await Promise.all([
    findAcademicYearById(model.academicYearId),
    db
      .select()
      .from(examTypeModel)
      .where(eq(examTypeModel.id, model.examTypeId)),
    findClassById(model.classId),
    model.scheduledByUserId
      ? db
          .select({
            id: userModel.id,
            name: userModel.name,
            email: userModel.email,
            image: userModel.image,
            phone: userModel.phone,
          })
          .from(userModel)
          .where(eq(userModel.id, model.scheduledByUserId))
      : [],
    model.lastUpdatedByUserId
      ? db
          .select({
            id: userModel.id,
            name: userModel.name,
            email: userModel.email,
            image: userModel.image,
            phone: userModel.phone,
          })
          .from(userModel)
          .where(eq(userModel.id, model.lastUpdatedByUserId))
      : [],
    db
      .select()
      .from(examProgramCourseModel)
      .leftJoin(examModel, eq(examProgramCourseModel.examId, examModel.id))
      .where(eq(examModel.id, model.id)),
    db
      .select()
      .from(examShiftModel)
      .leftJoin(examModel, eq(examShiftModel.examId, examModel.id))
      .where(eq(examModel.id, model.id)),
    db
      .select()
      .from(examSubjectModel)
      .where(eq(examSubjectModel.examId, model.id)),
    db
      .select()
      .from(examSubjectTypeModel)
      .where(eq(examSubjectTypeModel.examId, model.id)),
    db.select().from(examRoomModel).where(eq(examRoomModel.examId, model.id!)),
  ]);

  const [foundExamType] = foundExamTypeResult;

  // Extract unique IDs for batch fetching
  const programCourseIds = foundExamProgramCourses.map(
    (epc) => epc.exam_program_courses.programCourseId,
  );
  const shiftIds = foundExamShifts.map((es) => es.exam_shifts.shiftId);
  const subjectIds = foundExamSubjects.map((es) => es.subjectId);
  const subjectTypeIds = foundExamSubjectType.map((est) => est.subjectTypeId);
  const roomIds = foundExamRooms.map((l) => l.roomId);

  // Batch fetch all related entities in parallel
  const [programCourses, shifts, subjects, subjectTypes, rooms] =
    await Promise.all([
      programCourseIds.length > 0
        ? db
            .select()
            .from(programCourseModel)
            .where(inArray(programCourseModel.id, programCourseIds))
        : [],
      shiftIds.length > 0
        ? db.select().from(shiftModel).where(inArray(shiftModel.id, shiftIds))
        : [],
      subjectIds.length > 0
        ? db
            .select()
            .from(subjectModel)
            .where(inArray(subjectModel.id, subjectIds))
        : [],
      subjectTypeIds.length > 0
        ? db
            .select()
            .from(subjectTypeModel)
            .where(inArray(subjectTypeModel.id, subjectTypeIds))
        : [],
      roomIds.length > 0
        ? db.select().from(roomModel).where(inArray(roomModel.id, roomIds))
        : [],
    ]);

  // Extract IDs for nested program course entities
  const streamIds = programCourses
    .map((pc) => pc.streamId)
    .filter((id): id is number => id !== null && id !== undefined);
  const courseIds = programCourses
    .map((pc) => pc.courseId)
    .filter((id): id is number => id !== null && id !== undefined);
  const courseTypeIds = programCourses
    .map((pc) => pc.courseTypeId)
    .filter((id): id is number => id !== null && id !== undefined);
  const courseLevelIds = programCourses
    .map((pc) => pc.courseLevelId)
    .filter((id): id is number => id !== null && id !== undefined);
  const affiliationIds = programCourses
    .map((pc) => pc.affiliationId)
    .filter((id): id is number => id !== null && id !== undefined);
  const regulationTypeIds = programCourses
    .map((pc) => pc.regulationTypeId)
    .filter((id): id is number => id !== null && id !== undefined);

  // Batch fetch nested entities for program courses and floors for rooms
  const [
    streams,
    courses,
    courseTypes,
    courseLevels,
    affiliations,
    regulationTypes,
    floors,
  ] = await Promise.all([
    streamIds.length > 0
      ? db.select().from(streamModel).where(inArray(streamModel.id, streamIds))
      : [],
    courseIds.length > 0
      ? db.select().from(courseModel).where(inArray(courseModel.id, courseIds))
      : [],
    courseTypeIds.length > 0
      ? db
          .select()
          .from(courseTypeModel)
          .where(inArray(courseTypeModel.id, courseTypeIds))
      : [],
    courseLevelIds.length > 0
      ? db
          .select()
          .from(courseLevelModel)
          .where(inArray(courseLevelModel.id, courseLevelIds))
      : [],
    affiliationIds.length > 0
      ? db
          .select()
          .from(affiliationModel)
          .where(inArray(affiliationModel.id, affiliationIds))
      : [],
    regulationTypeIds.length > 0
      ? db
          .select()
          .from(regulationTypeModel)
          .where(inArray(regulationTypeModel.id, regulationTypeIds))
      : [],
    (() => {
      const floorIds = rooms
        .map((r) => r.floorId)
        .filter((id): id is number => id !== null && id !== undefined);
      return floorIds.length > 0
        ? db.select().from(floorModel).where(inArray(floorModel.id, floorIds))
        : [];
    })(),
  ]);

  // Create lookup maps for O(1) access
  const streamMap = new Map(streams.map((s) => [s.id, s]));
  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const courseTypeMap = new Map(courseTypes.map((ct) => [ct.id, ct]));
  const courseLevelMap = new Map(courseLevels.map((cl) => [cl.id, cl]));
  const affiliationMap = new Map(affiliations.map((a) => [a.id, a]));
  const regulationTypeMap = new Map(regulationTypes.map((rt) => [rt.id, rt]));
  const floorMap = new Map(floors.map((f) => [f.id, f]));
  const shiftMap = new Map(shifts.map((s) => [s.id, s]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const subjectTypeMap = new Map(subjectTypes.map((st) => [st.id, st]));

  // Build program course DTOs with nested entities
  const programCourseDtoMap = new Map(
    programCourses.map((pc) => [
      pc.id,
      {
        ...pc,
        stream: pc.streamId ? streamMap.get(pc.streamId) || null : null,
        course: pc.courseId ? courseMap.get(pc.courseId) || null : null,
        courseType: pc.courseTypeId
          ? courseTypeMap.get(pc.courseTypeId) || null
          : null,
        courseLevel: pc.courseLevelId
          ? courseLevelMap.get(pc.courseLevelId) || null
          : null,
        affiliation: pc.affiliationId
          ? affiliationMap.get(pc.affiliationId) || null
          : null,
        regulationType: pc.regulationTypeId
          ? regulationTypeMap.get(pc.regulationTypeId) || null
          : null,
      },
    ]),
  );

  const roomMap = new Map(
    rooms.map((r) => [
      r.id,
      {
        ...r,
        floor: r.floorId
          ? floorMap.get(r.floorId) || {
              id: 0,
              name: "Unknown",
              shortName: null,
              sequence: null,
              isActive: true,
              legacyFloorId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          : {
              id: 0,
              name: "Unknown",
              shortName: null,
              sequence: null,
              isActive: true,
              legacyFloorId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
      },
    ]),
  );

  // Build exam program courses with batch-fetched data
  const examProgramCourses: ExamProgramCourseDto[] =
    foundExamProgramCourses.map((epc) => ({
      ...epc.exam_program_courses,
      programCourse: programCourseDtoMap.get(
        epc.exam_program_courses.programCourseId,
      )!,
    }));

  // Build exam shifts with batch-fetched data
  const examShifts: ExamShiftDto[] = foundExamShifts.map((es) => ({
    ...es.exam_shifts,
    shift: shiftMap.get(es.exam_shifts.shiftId)!,
  }));

  // Build exam subjects with batch-fetched data
  const examSubjects: ExamSubjectDto[] = foundExamSubjects.map((es) => ({
    ...es,
    subject: subjectMap.get(es.subjectId)!,
  }));

  // Build exam subject types with batch-fetched data
  const examSubjectTypes: ExamSubjectTypeDto[] = foundExamSubjectType.map(
    (est) => ({
      ...est,
      subjectType: subjectTypeMap.get(est.subjectTypeId)!,
    }),
  );

  // Build locations with batch-fetched data
  const locations: ExamRoomDto[] = foundExamRooms.map((l) => ({
    ...l,
    room: roomMap.get(l.roomId)!,
  }));

  const [scheduledByUser] = Array.isArray(scheduledByUserResult)
    ? scheduledByUserResult
    : [];
  const [lastUpdatedByUser] = Array.isArray(lastUpdatedByUserResult)
    ? lastUpdatedByUserResult
    : [];

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
    scheduledByUser: scheduledByUser ?? null,
    lastUpdatedByUser: lastUpdatedByUser ?? null,
  };
}

// export async function downloadAdmitCardsAsZip(
//     examId: number,
//     userId: number,
//     uploadSessionId?: string,
// ): Promise<{
//     zipBuffer: Buffer;
//     admitCardCount: number;
// }> {
//     console.log("examId:", examId);
//     const result = await db
//         .select({
//             semester: classModel.name,
//             examType: examTypeModel.name,
//             session: sessionModel.name,
//             name: userModel.name,
//             cuRollNumber: studentModel.rollNumber,
//             cuRegistrationNumber: studentModel.registrationNumber,
//             uid: studentModel.uid,
//             phone: userModel.phone,
//             shiftName: shiftModel.name,
//             examStartDate: examSubjectModel.startTime,
//             examEndDate: examSubjectModel.endTime,
//             seatNo: examCandidateModel.seatNumber,
//             roomName: roomModel.name,
//             subjectName: paperModel.name,
//             subjectCode: paperModel.code,
//             programCourse: programCourseModel.name,
//         })
//         .from(examCandidateModel)
//         .leftJoin(examModel, eq(examModel.id, examCandidateModel.examId))
//         .leftJoin(
//             examSubjectModel,
//             eq(examSubjectModel.id, examCandidateModel.examSubjectId),
//         )
//         .leftJoin(examTypeModel, eq(examTypeModel.id, examModel.examTypeId))
//         .leftJoin(
//             examRoomModel,
//             eq(examRoomModel.id, examCandidateModel.examRoomId),
//         )
//         .leftJoin(paperModel, eq(paperModel.id, examCandidateModel.paperId))
//         .leftJoin(roomModel, eq(roomModel.id, examRoomModel.roomId))
//         .leftJoin(
//             promotionModel,
//             eq(promotionModel.id, examCandidateModel.promotionId),
//         )
//         .leftJoin(sessionModel, eq(sessionModel.id, promotionModel.sessionId))
//         .leftJoin(shiftModel, eq(shiftModel.id, promotionModel.shiftId))
//         .leftJoin(classModel, eq(classModel.id, promotionModel.classId))
//         .leftJoin(
//             programCourseModel,
//             eq(programCourseModel.id, promotionModel.programCourseId),
//         )
//         .leftJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
//         .leftJoin(userModel, eq(userModel.id, studentModel.userId))
//         .where(eq(examCandidateModel.examId, examId));

//     const zip = new JSZip();
//     const uidMap = new Map<string, typeof result>();

//     for (const row of result) {
//         if (!row.uid) continue;
//         if (!uidMap.has(row.uid)) {
//             uidMap.set(row.uid, []);
//         }
//         uidMap.get(row.uid)!.push(row);
//     }

//     const totalUniqueUids = uidMap.size;

//     if (io && userId) {
//         console.log("[CU-REG-DOWNLOAD] Emitting initial progress to user:", userId);
//         io.to(`user:${userId}`).emit("download_progress", {
//             id: uploadSessionId || `download-${Date.now()}`,
//             userId: userId,
//             type: "download_progress",
//             message: "Starting document download...",
//             progress: 0,
//             status: "started",
//             createdAt: new Date(),
//             sessionId: uploadSessionId,
//             stage: "listing",
//         });
//         console.log(
//             "[EXAM_ADMIT_CARDDOWNLOAD] Initial progress emitted successfully",
//         );
//     } else {
//         console.log(
//             "[EXAM_ADMIT_CARD-DOWNLOAD] Skipping initial progress emit - io:",
//             !!io,
//             "userId:",
//             userId,
//         );
//     }

//     const progressUpdate = socketService.createExportProgressUpdate(
//         userId.toString(),
//         "Starting export process...",
//         0,
//         "started",
//     );

//     const doneUids = new Set<string>();
//     console.log("result.length:", result.length);
//     let i = 0;

//     // Emit progress for PDF listing
//     if (io && userId) {
//         io.to(`user:${userId}`).emit("download_progress", {
//             id: uploadSessionId || `download-${Date.now()}`,
//             userId: userId,
//             type: "download_progress",
//             message: "Listing PDF files...",
//             progress: 0,
//             status: "in_progress",
//             createdAt: new Date(),
//             sessionId: uploadSessionId,
//             stage: "downloading_pdfs",
//         });
//     }

//     let processed = 0;
//     let pdfCount = 0;
//     for (const [uid, studentRows] of uidMap.entries()) {
//         processed++;

//         const progress = Math.round((processed / totalUniqueUids) * 100);

//         console.log("processing:", uid);

//         const progressUpdate = socketService.createExportProgressUpdate(
//             userId.toString(),
//             "Download in process...",
//             progress,
//             "in_progress",
//         );

//         socketService.sendProgressUpdate(userId.toString(), progressUpdate);

//         // Emit progress for current file
//         if (io && userId) {
//             // const progress = Number(((++i * 100) / totalUniqueUids).toFixed(2));
//             io.to(`user:${userId}`).emit("download_progress", {
//                 id: uploadSessionId || `download-${Date.now()}`,
//                 userId: userId,
//                 type: "download_progress",
//                 message: `Downloading PDF ${++pdfCount}/${totalUniqueUids}`,
//                 progress,
//                 status: "in_progress",
//                 createdAt: new Date(),
//                 sessionId: uploadSessionId,
//                 stage: "downloading_pdfs",
//                 currentFile: `${pdfCount}/${totalUniqueUids}`,
//                 pdfCount: pdfCount, // Show current count being processed
//                 pdfTotal: totalUniqueUids, // Show total count that will be downloaded
//             });
//         }

//         const studentRows = result.filter((r) => r.uid === uid);

//         const pdfBuffer = await pdfGenerationService.generateExamAdmitCardPdfBuffer(
//             {
//                 semester: studentRows[0]!.semester!.split(" ")[1],
//                 examType: studentRows[0]!.examType ?? "",
//                 session: studentRows[0]!.session ?? "",
//                 name: studentRows[0]!.name!,
//                 cuRollNumber: studentRows[0]!.cuRollNumber,
//                 cuRegistrationNumber: studentRows[0]!.cuRegistrationNumber,
//                 uid: studentRows[0]!.uid!,
//                 phone: studentRows[0]!.phone!,
//                 programCourseName: studentRows[0]!.programCourse ?? "",
//                 shiftName: studentRows[0]!.shiftName ?? "",
//                 qrCodeDataUrl: null,

//                 examRows: studentRows.map((r) => ({
//                     subjectName: r.subjectName!,
//                     subjectCode: r.subjectCode!,
//                     date: formatExamDateFromTimestamp(r.examStartDate!),
//                     time: formatExamTimeFromTimestamps(r.examStartDate!, r.examEndDate!),
//                     seatNo: r.seatNo!,
//                     room: r.roomName!,
//                 })),
//             },
//         );

//         zip.file(`${uid}_admit_card.pdf`, pdfBuffer);
//     }

//     const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

//     return {
//         zipBuffer,
//         admitCardCount: totalUniqueUids,
//     };
// }

function sanitizeWorksheetName(name: string): string {
  return name
    .replace(/[*?:\\/\[\]]/g, "-") // replace invalid chars
    .substring(0, 31) // Excel max length = 31
    .trim();
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
    .where(eq(examCandidateModel.examId, examId))
    .orderBy(asc(examSubjectModel.startTime));

  const zip = new JSZip();

  // ---------- Group by UID ----------
  const uidMap = new Map<string, typeof result>();
  for (const row of result) {
    if (!row.uid) continue;
    if (!uidMap.has(row.uid)) uidMap.set(row.uid, []);
    uidMap.get(row.uid)!.push(row);
  }

  const totalUids = uidMap.size;
  const uidEntries = Array.from(uidMap.entries());

  // ---------- Initial socket emit ----------
  if (io && userId) {
    io.to(`user:${userId}`).emit("download_progress", {
      id: uploadSessionId || `download-${Date.now()}`,
      userId,
      type: "download_progress",
      message: "Generating admit cards...",
      progress: 0,
      status: "started",
      createdAt: new Date(),
      sessionId: uploadSessionId,
      stage: "pdf_generation",
    });
  }

  // ---------- PARALLEL PDF GENERATION ----------
  const CONCURRENCY = 4; // 🔥 tune this (3–6 ideal for EC2)
  let processed = 0;

  for (let i = 0; i < uidEntries.length; i += CONCURRENCY) {
    const batch = uidEntries.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(async ([uid, studentRows]) => {
        const pdfBuffer =
          await pdfGenerationService.generateExamAdmitCardPdfBuffer({
            semester: studentRows[0]?.semester?.split(" ")[1] ?? "",
            examType: studentRows[0]?.examType ?? "",
            session: studentRows[0]?.session ?? "",
            name: studentRows[0]?.name ?? "",
            cuRollNumber: studentRows[0]?.cuRollNumber,
            cuRegistrationNumber: studentRows[0]?.cuRegistrationNumber,
            uid: studentRows[0]?.uid ?? "",
            phone: studentRows[0]?.phone ?? "",
            programCourseName: studentRows[0]?.programCourse ?? "",
            shiftName: studentRows[0]?.shiftName ?? "",
            qrCodeDataUrl: null,

            examRows: studentRows.map((r) => ({
              subjectName: r.subjectName!,
              subjectCode: r.subjectCode!,
              date: formatExamDateFromTimestamp(r.examStartDate!),
              time: formatExamTimeFromTimestamps(
                r.examStartDate!,
                r.examEndDate!,
              ),
              seatNo: r.seatNo!,
              room: r.roomName!,
            })),
          });

        zip.file(`${uid}_admit_card.pdf`, pdfBuffer);
      }),
    );

    processed += batch.length;
    const progress = Math.round((processed / totalUids) * 100);

    // ---------- Progress emit (once per batch) ----------
    if (io && userId) {
      io.to(`user:${userId}`).emit("download_progress", {
        id: uploadSessionId || `download-${Date.now()}`,
        userId,
        type: "download_progress",
        message: `Generated ${processed}/${totalUids} admit cards`,
        progress,
        status: "in_progress",
        createdAt: new Date(),
        sessionId: uploadSessionId,
        stage: "pdf_generation",
        pdfCount: processed,
        pdfTotal: totalUids,
      });
    }
  }

  // ---------- ZIP generation ----------
  if (io && userId) {
    io.to(`user:${userId}`).emit("download_progress", {
      id: uploadSessionId || `download-${Date.now()}`,
      userId,
      type: "download_progress",
      message: "Creating ZIP file...",
      progress: 100,
      status: "finalizing",
      createdAt: new Date(),
      sessionId: uploadSessionId,
      stage: "zipping",
    });
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return {
    zipBuffer,
    admitCardCount: totalUids,
  };
}

export async function downloadExamCandidatesbyExamId(examId: number) {
  const result = await db
    .select({
      examType: examTypeModel.name,
      academicYear: academicYearModel.year,
      session: sessionModel.name,
      semester: classModel.name,
      orderType: examModel.orderType,
      gender: examModel.gender,
      examCreatedAt: examModel.createdAt,
      examUpdatedAt: examModel.updatedAt,

      floor: floorModel.name,
      room: roomModel.name,

      startDate: sql`${examSubjectModel.startTime}::date`.as("startDate"),
      startTime: sql`
    TO_CHAR(${examSubjectModel.startTime}, 'HH12:MI AM')
  `.as("startTime"),

      endDate: sql`${examSubjectModel.endTime}::date`.as("endDate"),
      endTime: sql`
    TO_CHAR(${examSubjectModel.endTime}, 'HH12:MI AM')
  `.as("endTime"),

      name: userModel.name,
      uid: studentModel.uid,
      email: userModel.email,
      phone: userModel.phone,
      whatsapp_number: userModel.whatsappNumber,
      program_course: programCourseModel.name,
      section: sectionModel.name,
      shift: shiftModel.name,
      subject: subjectModel.code,
      subject_type: subjectTypeModel.code,
      paper: paperModel.name,
      paper_code: paperModel.code,
      seat: examCandidateModel.seatNumber,
      foilNumber: examCandidateModel.foilNumber,
    })
    .from(examCandidateModel)

    .leftJoin(
      examRoomModel,
      eq(examRoomModel.id, examCandidateModel.examRoomId),
    )
    .leftJoin(roomModel, eq(roomModel.id, examRoomModel.roomId))
    .leftJoin(floorModel, eq(floorModel.id, roomModel.floorId))

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
    const key = row.paper_code ?? row.subject ?? "UNKNOWN";
    if (!groupedBySubject.has(key)) {
      groupedBySubject.set(key, []);
    }
    groupedBySubject.get(key)!.push(row);
  }

  // ✅ Create Excel
  const workbook = new ExcelJS.Workbook();

  for (const [subjectKey, rows] of groupedBySubject) {
    const sheet = workbook.addWorksheet(sanitizeWorksheetName(subjectKey));

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

export async function downloadAdmitCardTrackingByExamId(examId: number) {
  const result = await db
    .select({
      examType: examTypeModel.name,
      academicYear: academicYearModel.year,
      session: sessionModel.name,
      semester: classModel.name,
      name: userModel.name,
      uid: studentModel.uid,
      email: userModel.email,
      phone: userModel.phone,
      whatsapp_number: userModel.whatsappNumber,
      program_course: programCourseModel.name,
      shift: shiftModel.name,
      subject: subjectModel.code,
      paper: paperModel.name,
      paper_code: paperModel.code,
      seat: examCandidateModel.seatNumber,
      foilNumber: examCandidateModel.foilNumber,
      admitCardDownloadCount: examCandidateModel.admitCardDownloadCount,
      admitCardDownloadedAt: examCandidateModel.admitCardDownloadedAt,
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
    .leftJoin(shiftModel, eq(shiftModel.id, promotionModel.shiftId))
    .leftJoin(classModel, eq(examModel.classId, classModel.id))
    .where(eq(examModel.id, examId));

  if (!result.length) {
    throw new Error("No exam candidates found");
  }

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Admit Card Downloads");

  // Define columns
  sheet.columns = [
    { header: "Exam Type", key: "examType", width: 20 },
    { header: "Academic Year", key: "academicYear", width: 15 },
    { header: "Session", key: "session", width: 20 },
    { header: "Semester", key: "semester", width: 15 },
    { header: "Name", key: "name", width: 30 },
    { header: "UID", key: "uid", width: 20 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 15 },
    { header: "WhatsApp", key: "whatsapp_number", width: 15 },
    { header: "Program Course", key: "program_course", width: 25 },
    { header: "Shift", key: "shift", width: 15 },
    { header: "Subject", key: "subject", width: 20 },
    { header: "Paper", key: "paper", width: 30 },
    { header: "Paper Code", key: "paper_code", width: 15 },
    { header: "Seat Number", key: "seat", width: 15 },
    { header: "Foil Number", key: "foilNumber", width: 15 },
    { header: "Download Count", key: "admitCardDownloadCount", width: 15 },
    {
      header: "Last Downloaded At",
      key: "admitCardDownloadedAt",
      width: 25,
    },
  ];

  // Add rows
  result.forEach((row) => {
    sheet.addRow({
      examType: row.examType || "",
      academicYear: row.academicYear || "",
      session: row.session || "",
      semester: row.semester || "",
      name: row.name || "",
      uid: row.uid || "",
      email: row.email || "",
      phone: row.phone || "",
      whatsapp_number: row.whatsapp_number || "",
      program_course: row.program_course || "",
      shift: row.shift || "",
      subject: row.subject || "",
      paper: row.paper || "",
      paper_code: row.paper_code || "",
      seat: row.seat || "",
      foilNumber: row.foilNumber || "",
      admitCardDownloadCount: row.admitCardDownloadCount || 0,
      admitCardDownloadedAt: row.admitCardDownloadedAt
        ? new Date(row.admitCardDownloadedAt).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          })
        : "Never",
    });
  });

  // Style header row
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Freeze header row
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  // Return Excel buffer
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

  // Track admit card download - increment count by 1 only (not by number of papers)
  // Update all exam candidates' timestamps, but only increment count once on the first record
  const examCandidateIds = await db
    .select({ id: examCandidateModel.id })
    .from(examCandidateModel)
    .innerJoin(
      promotionModel,
      eq(promotionModel.id, examCandidateModel.promotionId),
    )
    .innerJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .where(
      and(
        eq(examCandidateModel.examId, examId),
        eq(studentModel.id, studentId),
      ),
    )
    .orderBy(asc(examCandidateModel.id)); // Order to ensure consistent selection

  if (examCandidateIds.length > 0) {
    const now = new Date();
    const allCandidateIds = examCandidateIds.map((ec) => ec.id);
    const firstCandidateId = allCandidateIds[0];

    // Update all candidates' downloadedAt timestamp
    await db
      .update(examCandidateModel)
      .set({
        admitCardDownloadedAt: now,
      })
      .where(inArray(examCandidateModel.id, allCandidateIds));

    // Only increment the download count once on the first exam candidate record
    // This ensures 1 download = count +1, regardless of number of papers
    await db
      .update(examCandidateModel)
      .set({
        // Use COALESCE to handle NULL values - default to 0 if NULL, then increment
        admitCardDownloadCount: sql`COALESCE(${examCandidateModel.admitCardDownloadCount}, 0) + 1`,
      })
      .where(eq(examCandidateModel.id, firstCandidateId));
  }

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

  // Emit socket event for exam subject update
  const io = socketService.getIO();
  if (io) {
    io.emit("exam_updated", {
      examId: foundExamSubject.examId,
      type: "subject_datetime",
      message: "Exam subject date/time has been updated",
      timestamp: new Date().toISOString(),
    });
    // Also emit notification to all admins/staff
    io.emit("notification", {
      id: `exam_update_${foundExamSubject.examId}_${Date.now()}`,
      type: "update",
      message: `Exam ${foundExamSubject.examId} subject date/time has been updated`,
      createdAt: new Date(),
      read: false,
      meta: { examId: foundExamSubject.examId, type: "subject_datetime" },
    });
  }

  return {
    subject,
    ...updatedExamSubject,
  };
}

export async function updateExamAdmitCardDates(
  examId: number,
  admitCardStartDownloadDate: string | null,
  admitCardLastDownloadDate: string | null,
  userId?: number,
): Promise<ExamDto | null> {
  const [foundExam] = await db
    .select()
    .from(examModel)
    .where(eq(examModel.id, examId));

  if (!foundExam) return null;

  const updateData: Partial<typeof examModel.$inferInsert> = {};
  if (
    admitCardStartDownloadDate !== null &&
    admitCardStartDownloadDate !== undefined
  ) {
    updateData.admitCardStartDownloadDate = admitCardStartDownloadDate
      ? new Date(admitCardStartDownloadDate)
      : null;
  }
  if (
    admitCardLastDownloadDate !== null &&
    admitCardLastDownloadDate !== undefined
  ) {
    updateData.admitCardLastDownloadDate = admitCardLastDownloadDate
      ? new Date(admitCardLastDownloadDate)
      : null;
  }

  // Track user who updated
  if (userId) {
    updateData.lastUpdatedByUserId = userId;
  }

  if (Object.keys(updateData).length === 0) {
    return null;
  }

  await db.update(examModel).set(updateData).where(eq(examModel.id, examId));

  // Return updated exam with full relations
  const [updatedExam] = await db
    .select()
    .from(examModel)
    .where(eq(examModel.id, examId));

  if (!updatedExam) return null;

  // Emit socket event for exam update
  const io = socketService.getIO();
  if (io) {
    io.emit("exam_updated", {
      examId: examId,
      type: "admit_card_dates",
      message: "Exam admit card dates have been updated",
      timestamp: new Date().toISOString(),
    });
    // Also emit notification to all admins/staff
    io.emit("notification", {
      id: `exam_update_${examId}_${Date.now()}`,
      type: "update",
      message: `Exam ${examId} admit card dates have been updated`,
      createdAt: new Date(),
      read: false,
      meta: { examId, type: "admit_card_dates" },
    });
  }

  return await modelToDto(updatedExam);
}

/**
 * Delete an exam and all related rows.
 *
 * Deletion is allowed only if the earliest exam subject startTime is in the future.
 * (If the exam has no subjects, deletion is allowed.)
 */
export async function deleteExamByIdIfUpcoming(
  examId: number,
  userId?: number,
): Promise<null | {
  success: true;
  deletedExamId: number;
}> {
  return await db.transaction(async (tx) => {
    const [exam] = await tx
      .select()
      .from(examModel)
      .where(eq(examModel.id, examId));
    if (!exam) return null;

    const admitCardStart = exam.admitCardStartDownloadDate;
    if (!admitCardStart) {
      throw new Error(
        "Exam cannot be deleted because admit card start download date is not set.",
      );
    }

    const admitCardStartMs = new Date(admitCardStart as any).getTime();
    if (Number.isNaN(admitCardStartMs)) {
      throw new Error(
        "Exam cannot be deleted because admit card start download date is invalid.",
      );
    }

    // Allowed only if (admitCardStartDownloadDate - 1 day) >= now
    const now = Date.now();
    const deletionCutoff = admitCardStartMs - 24 * 60 * 60 * 1000;
    if (deletionCutoff < now) {
      throw new Error(
        "Exam cannot be deleted now. Deletion is allowed only up to 1 day before the admit card start download date.",
      );
    }

    // Delete in FK-safe order
    await tx
      .delete(examCandidateModel)
      .where(eq(examCandidateModel.examId, examId));
    await tx.delete(examRoomModel).where(eq(examRoomModel.examId, examId));
    await tx
      .delete(examSubjectModel)
      .where(eq(examSubjectModel.examId, examId));
    await tx.delete(examShiftModel).where(eq(examShiftModel.examId, examId));
    await tx
      .delete(examSubjectTypeModel)
      .where(eq(examSubjectTypeModel.examId, examId));
    await tx
      .delete(examProgramCourseModel)
      .where(eq(examProgramCourseModel.examId, examId));

    const [deleted] = await tx
      .delete(examModel)
      .where(eq(examModel.id, examId))
      .returning({ id: examModel.id });

    if (!deleted) {
      throw new Error("Failed to delete exam.");
    }

    // Emit socket event for exam deletion
    const io = socketService.getIO();
    if (io) {
      io.emit("exam_deleted", {
        examId,
        type: "deletion",
        message: "An exam has been deleted",
        timestamp: new Date().toISOString(),
      });
      io.emit("notification", {
        id: `exam_deleted_${examId}_${Date.now()}`,
        type: "info",
        message: `An exam (ID: ${examId}) has been deleted`,
        createdAt: new Date(),
        read: false,
        meta: { examId, type: "deletion", deletedByUserId: userId ?? null },
      });
    }

    return { success: true as const, deletedExamId: examId };
  });
}

export async function fetchExamCandidatesByExamId(examId: number) {
  const result = await db
    .select({
      uid: studentModel.uid,
      userId: studentModel.userId,
      userName: userModel.name,
      userEmail: userModel.email,
      semester: classModel.name,
      examType: examTypeModel.name,
      session: sessionModel.name,
      shiftName: shiftModel.name,
      phone: userModel.phone,
      cuRollNumber: studentModel.rollNumber,
      cuRegistrationNumber: studentModel.registrationNumber,
      subjectName: paperModel.name,
      subjectCode: paperModel.code,
      examStartDate: examSubjectModel.startTime,
      examEndDate: examSubjectModel.endTime,
      seatNo: examCandidateModel.seatNumber,
      roomName: roomModel.name,
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
    .where(eq(examCandidateModel.examId, examId))
    .orderBy(asc(examSubjectModel.startTime));

  return result;
}

/**
 * Generates PDF buffers for each distinct UID
 */
type ExamCandidateRow = Awaited<
  ReturnType<typeof fetchExamCandidatesByExamId>
>[number];

export async function generateAdmitCardBuffers(
  examCandidates: ExamCandidateRow[],
) {
  const uidMap = new Map<string, ExamCandidateRow[]>();

  for (const row of examCandidates) {
    if (!row.uid) continue;
    if (!uidMap.has(row.uid)) uidMap.set(row.uid, []);
    uidMap.get(row.uid)!.push(row);
  }

  const pdfBuffers: AdmitCardEmailPayload[] = [];

  for (const [uid, rows] of uidMap.entries()) {
    const pdfBuffer = await pdfGenerationService.generateExamAdmitCardPdfBuffer(
      {
        semester: rows[0]?.semester!.split(" ")[1] ?? "",
        examType: rows[0]?.examType ?? "",
        session: rows[0]?.session ?? "",
        name: rows[0]?.userName ?? "",
        uid: uid,
        phone: rows[0]?.phone ?? "",
        cuRollNumber: rows[0]?.cuRollNumber,
        cuRegistrationNumber: rows[0]?.cuRegistrationNumber,
        programCourseName: rows[0]?.programCourse ?? "",
        shiftName: rows[0]?.shiftName ?? "",
        qrCodeDataUrl: null,
        examRows: rows.map((r) => ({
          subjectName: r.subjectName!,
          subjectCode: r.subjectCode!,
          date: formatExamDateFromTimestamp(r.examStartDate!),
          time: formatExamTimeFromTimestamps(r.examStartDate!, r.examEndDate!),
          seatNo: r.seatNo!,
          room: r.roomName!,
        })),
      },
    );

    pdfBuffers.push({
      uid,
      buffer: pdfBuffer,
      programCourseName: rows[0].programCourse!,
      semester: rows[0].semester!,
      userId: rows[0]?.userId ?? null,
      userEmail: rows[0]?.userEmail ?? null,
      userName: rows[0]?.userName ?? null,
      examType: rows[0]?.examType!,
      session: rows[0]?.session ?? "",
      cuRollNumber: rows[0]?.cuRollNumber ?? null,
      cuRegistrationNumber: rows[0]?.cuRegistrationNumber ?? null,
      shiftName: rows[0]?.shiftName ?? "",

      examRows: rows.map((r) => ({
        subjectName: r.subjectName!,
        subjectCode: r.subjectCode!,
        date: formatExamDateFromTimestamp(r.examStartDate!),
        time: formatExamTimeFromTimestamps(r.examStartDate!, r.examEndDate!),
        seatNo: r.seatNo!,
        room: r.roomName!,
      })),
    });
  }

  return pdfBuffers;
}

// export async function sendExamAdmitCardEmails(examId: number) {
//     const candidates = await fetchExamCandidatesByExamId(examId);
//     const pdfBuffers = await generateAdmitCardBuffers(candidates);

//     const [notificationMaster] = await db
//         .select()
//         .from(notificationMasterModel)
//         .where(
//             and(
//                 ilike(notificationMasterModel.name, "Exam Admit Card Notification"),
//                 ilike(notificationMasterModel.template, "exam-admit-card-notification"),
//                 ilike(notificationMasterModel.variant, "EMAIL")
//             )
//         );

//     if (!notificationMaster) throw new Error("Exam Admit Card notification master not found");

//     for (const candidate of pdfBuffers) {
//         if (!candidate.userId) continue; // safety
//         await enqueueNotification({
//             userId: candidate.userId,
//             variant: "EMAIL",
//             type: "EXAM",
//             message: "Your exam admit card is attached.",
//             notificationMasterId: notificationMaster.id,
//             emailAttachments: [
//                 {
//                     fileName: `${candidate.uid}_Exam_${examId}_Admit_Card.pdf`,
//                     buffer: candidate.buffer,
//                 },
//             ],
//             notificationEvent: {
//                 templateData: {
//                     name: candidate.userName ?? "",
//                 },
//             },
//         });
//     }

//     return { success: true, sentCount: pdfBuffers.length };
// }

export type AdmitCardEmailPayload = {
  uid: string;
  buffer: Buffer;
  programCourseName: string;
  semester: string;
  userId: number | null;
  userEmail: string | null;
  userName: string | null;
  examType: string;
  session: string;
  cuRollNumber: string | null;
  cuRegistrationNumber: string | null;
  shiftName: string;

  examRows: {
    date: string;
    time: string;
    subjectName: string;
    subjectCode: string;
    room: string;
    seatNo: string;
  }[];
};

export async function sendExamAdmitCardEmails(
  examId: number,
  userId: number,
  uploadSessionId?: string,
) {
  const candidates = await fetchExamCandidatesByExamId(examId);
  const pdfBuffers = await generateAdmitCardBuffers(candidates);

  const total = pdfBuffers.length;
  let sent = 0;
  let failed = 0;

  const [notificationMaster] = await db
    .select()
    .from(notificationMasterModel)
    .where(
      and(
        ilike(notificationMasterModel.name, "Exam Admit Card Notification"),
        eq(notificationMasterModel.template, "exam-admit-card-notification"),
        eq(notificationMasterModel.variant, "EMAIL"),
      ),
    );

  if (!notificationMaster)
    throw new Error("Exam Admit Card notification master not found");

  const sessionId = uploadSessionId || `email-${Date.now()}`;

  // ---------- Initial emit ----------
  if (io && userId) {
    io.to(`user:${userId}`).emit("email_progress", {
      id: sessionId,
      userId,
      type: "email_progress",
      message: "Sending admit cards via email...",
      progress: 0,
      status: "started",
      stage: "email_sending",
      total,
      sent: 0,
      failed: 0,
      createdAt: new Date(),
    });
  }

  const CONCURRENCY = 3; // ⚠️ emails are heavier than PDFs

  for (let i = 0; i < pdfBuffers.length; i += CONCURRENCY) {
    const batch = pdfBuffers.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(async (candidate) => {
        if (!candidate.userId) return;

        try {
          await enqueueNotification({
            userId: candidate.userId,
            variant: "EMAIL",
            type: "EXAM",
            message: "Your exam admit card is attached.",
            notificationMasterId: notificationMaster.id,
            emailAttachments: [
              {
                fileName: `${candidate.uid}_Exam_${examId}_Admit_Card.pdf`,
                contentBase64: candidate.buffer,
              },
            ],
            notificationEvent: {
              subject: `Semester ${candidate.semester.split(" ")[1]} | ${candidate.examType} | Schedule Exam Notification`,
              templateData: {
                name: candidate.userName ?? "",
                uid: candidate.uid,
                programCourseName: candidate.programCourseName,
                semester: candidate.semester,
                session: candidate.session,
                cuRollNumber: candidate.cuRollNumber,
                cuRegistrationNumber: candidate.cuRegistrationNumber,
                shiftName: candidate.shiftName,
                examRows: candidate.examRows, // 🔥 THIS WAS MISSING
                subject: `Semester ${candidate.semester.split(" ")[1]} | ${candidate.examType} | Schedule Exam Notification`,
              },
            },
          });

          sent++;
        } catch (err) {
          failed++;
          console.error("Email failed for UID:", candidate.uid, err);
        }
      }),
    );

    const progress = Math.round(((sent + failed) / total) * 100);

    // ---------- Progress emit ----------
    if (io && userId) {
      io.to(`user:${userId}`).emit("email_progress", {
        id: sessionId,
        userId,
        type: "email_progress",
        message: `Emails processed: ${sent + failed}/${total}`,
        progress,
        status: "in_progress",
        stage: "email_sending",
        sent,
        failed,
        total,
        createdAt: new Date(),
      });
    }
  }

  // ---------- Final emit ----------
  if (io && userId) {
    io.to(`user:${userId}`).emit("email_progress", {
      id: sessionId,
      userId,
      type: "email_progress",
      message: "Email sending completed",
      progress: 100,
      status: "completed",
      stage: "done",
      sent,
      failed,
      total,
      createdAt: new Date(),
    });
  }

  return {
    success: true,
    total,
    sent,
    failed,
  };
}

export async function getExamCandidatesByStudentIdAndExamId(
  studentId: number,
  examId: number,
) {
  const examCandidates = await db
    .select()
    .from(examCandidateModel)
    .leftJoin(examModel, eq(examModel.id, examCandidateModel.examId))
    .leftJoin(
      promotionModel,
      eq(promotionModel.id, examCandidateModel.promotionId),
    )
    .leftJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .where(and(eq(studentModel.id, studentId), eq(examModel.id, examId)));

  return await Promise.all(
    examCandidates.map(async (examCandidate) => {
      const paper = await db
        .select()
        .from(paperModel)
        .where(eq(paperModel.id, examCandidate.exam_candidates.paperId))
        .limit(1)
        .then((rows) => rows[0]);

      return {
        ...examCandidate,
        paper,
      };
    }),
  );
}

// export async function downloadAttendanceSheetsByExamId(
//     examId: number,
//     userId: number,
//     uploadSessionId?: string,
// ): Promise<{
//     zipBuffer: Buffer;
//     roomCount: number;
// }> {
//     const result = await db
//         .select({
//             examType: examTypeModel.name,
//             class: classModel.name,
//             academicYear: academicYearModel.year,
//             name: userModel.name,
//             uid: studentModel.uid,
//             rollNumber: studentModel.rollNumber,
//             paperName: paperModel.name,
//             paperCode: paperModel.code,
//             floor: floorModel.name,
//             orderType: examModel.orderType,
//             room: roomModel.name,
//             seatNumber: examCandidateModel.seatNumber,
//             examStartTime: examSubjectModel.startTime,
//             examEndTime: examSubjectModel.endTime,
//         })
//         .from(examCandidateModel)
//         .leftJoin(examModel, eq(examCandidateModel.examId, examModel.id))
//         .leftJoin(examTypeModel, eq(examTypeModel.id, examModel.examTypeId))
//         .leftJoin(classModel, eq(classModel.id, examModel.classId))
//         .leftJoin(academicYearModel, eq(academicYearModel.id, examModel.academicYearId))
//         .leftJoin(examRoomModel, eq(examCandidateModel.examRoomId, examRoomModel.id))
//         .leftJoin(roomModel, eq(roomModel.id, examRoomModel.roomId))
//         .leftJoin(floorModel, eq(floorModel.id, roomModel.floorId))
//         .leftJoin(promotionModel, eq(promotionModel.id, examCandidateModel.promotionId))
//         .leftJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
//         .leftJoin(userModel, eq(userModel.id, studentModel.userId))
//         .leftJoin(paperModel, eq(paperModel.id, examCandidateModel.paperId))
//         .leftJoin(examSubjectModel, eq(examSubjectModel.id, examCandidateModel.examSubjectId))
//         .where(eq(examCandidateModel.examId, examId))
//         .orderBy(
//             asc(examSubjectModel.startTime),
//             asc(floorModel.name),
//             asc(roomModel.name),
//             asc(examCandidateModel.seatNumber),
//         );

//     const zip = new JSZip();

//     // ---------- Initial socket emit ----------
//     if (io && userId) {
//         io.to(`user:${userId}`).emit("download_progress", {
//             id: uploadSessionId || `download-${Date.now()}`,
//             userId,
//             type: "download_progress",
//             message: "Generating attendance dr sheet...",
//             progress: 0,
//             status: "started",
//             createdAt: new Date(),
//             sessionId: uploadSessionId,
//             stage: "pdf_generation",
//         });
//     }

//     const rooms = new Set<string>(result.map(r => r.room!));

//     for (let r = 0; r < rooms.size; r++) {
//         const filteredResult = result.filter(res => res.room === Array.from(rooms)[r]);
//         const pdfBuffer = await pdfGenerationService.generateExamAttendanceSheetPdfBuffer({
//             semester: filteredResult[0].class!.split(" ")[1],
//             examType: filteredResult[0].examType!,
//             session: filteredResult[0].academicYear!,
//             roomNumber: filteredResult[0].room!,
//             examDates: [
//                 ...new Set(
//                     filteredResult.map(item => {
//                         const d = item.examStartTime;

//                         if (d) {
//                             const day = String(d.getDate()).padStart(2, "0");
//                             const month = String(d.getMonth() + 1).padStart(2, "0");
//                             const year = d?.getFullYear();

//                             return `${day}/${month}/${year}`;
//                         }

//                         return '';

//                     })
//                 )
//             ],
//             examTimings: [
//                 ...new Set(
//                     filteredResult.map(item => {
//                         const d = item.examStartTime;

//                         if (d) {

//                             let hours = d.getHours();
//                             const minutes = String(d.getMinutes()).padStart(2, "0");
//                             const ampm = hours >= 12 ? "PM" : "AM";

//                             hours = hours % 12 || 12;
//                             return `${hours}:${minutes} ${ampm}`;
//                         }

//                         return '';
//                     })
//                 )
//             ],
//             examPapersCodes: [
//                 ...new Set(
//                     filteredResult.map(item => item.paperCode!)
//                 )
//             ],
//             examCandidates: filteredResult.map(r => ({
//                 name: r.name!,
//                 identifier: (r.orderType === "UID" ? r.uid! : r.rollNumber)!,
//                 seatNumber: r.seatNumber!,
//             })),
//         });

//         const fileDate = filteredResult[0].examStartTime
//             ? filteredResult[0].examStartTime.toISOString().split("T")[0]
//             : "date";

//         zip.file(
//             `${filteredResult[0].examType}_${filteredResult[0].class}_${filteredResult[0].room}_${fileDate}.pdf`,
//             pdfBuffer
//         );

//     }

//     // ---------- ZIP generation ----------
//     if (io && userId) {
//         io.to(`user:${userId}`).emit("download_progress", {
//             id: uploadSessionId || `download-${Date.now()}`,
//             userId,
//             type: "download_progress",
//             message: "Creating ZIP file...",
//             progress: 100,
//             status: "finalizing",
//             createdAt: new Date(),
//             sessionId: uploadSessionId,
//             stage: "zipping",
//         });
//     }

//     const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

//     return {
//         zipBuffer,
//         roomCount: rooms.size,
//     };
// }

export async function downloadAttendanceSheetsByExamId(
  examId: number,
  userId: number,
  uploadSessionId?: string,
): Promise<{
  zipBuffer: Buffer;
  roomCount: number;
}> {
  const result = await db
    .select({
      examType: examTypeModel.name,
      class: classModel.name,
      academicYear: academicYearModel.year,
      name: userModel.name,
      uid: studentModel.uid,
      rollNumber: studentModel.rollNumber,
      paperName: paperModel.name,
      paperCode: paperModel.code,
      floor: floorModel.name,
      orderType: examModel.orderType,
      room: roomModel.name,
      seatNumber: examCandidateModel.seatNumber,
      examStartTime: examSubjectModel.startTime,
      examEndTime: examSubjectModel.endTime,
    })
    .from(examCandidateModel)
    .leftJoin(examModel, eq(examCandidateModel.examId, examModel.id))
    .leftJoin(examTypeModel, eq(examTypeModel.id, examModel.examTypeId))
    .leftJoin(classModel, eq(classModel.id, examModel.classId))
    .leftJoin(
      academicYearModel,
      eq(academicYearModel.id, examModel.academicYearId),
    )
    .leftJoin(
      examRoomModel,
      eq(examCandidateModel.examRoomId, examRoomModel.id),
    )
    .leftJoin(roomModel, eq(roomModel.id, examRoomModel.roomId))
    .leftJoin(floorModel, eq(floorModel.id, roomModel.floorId))
    .leftJoin(
      promotionModel,
      eq(promotionModel.id, examCandidateModel.promotionId),
    )
    .leftJoin(studentModel, eq(studentModel.id, promotionModel.studentId))
    .leftJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(paperModel, eq(paperModel.id, examCandidateModel.paperId))
    .leftJoin(
      examSubjectModel,
      eq(examSubjectModel.id, examCandidateModel.examSubjectId),
    )
    .where(eq(examCandidateModel.examId, examId))
    .orderBy(
      asc(examSubjectModel.startTime),
      asc(examCandidateModel.seatNumber),
      asc(floorModel.name),
      asc(roomModel.name),
    );

  const zip = new JSZip();

  // ---------- SOCKET START ----------
  if (io && userId) {
    io.to(`user:${userId}`).emit("download_progress", {
      id: uploadSessionId,
      userId,
      message: "Generating attendance sheets...",
      progress: 0,
      status: "started",
      stage: "pdf_generation",
    });
  }

  // ---------- GROUP ROOMS ----------
  const rooms = Array.from(new Set(result.map((r) => r.room!).filter(Boolean)));
  const paperCodes = Array.from(
    new Set(result.map((r) => r.paperCode!).filter(Boolean)),
  );
  const totalRooms = rooms.length;

  const limit = pLimit(5); // max 5 parallel PDFs
  let completed = 0;

  await Promise.all(
    rooms.map((room) =>
      limit(async () => {
        const filteredResult = result
          .filter((r) => r.room === room)
          .sort((a, b) => {
            // Sort by seat number
            const seatA = a.seatNumber || "";
            const seatB = b.seatNumber || "";
            return seatA.localeCompare(seatB, undefined, {
              numeric: true,
              sensitivity: "base",
            });
          });

        if (!filteredResult.length) return;

        // ---------- ENSURE DATE-TIME-PAPER SEQUENCE ----------
        const examSlots: {
          date: string;
          time: string;
          paperCode: string;
        }[] = [];

        const seen = new Set<string>();

        for (const item of filteredResult) {
          if (!item.examStartTime) continue;

          const d = item.examStartTime;

          const date = `${String(d.getDate()).padStart(2, "0")}/${String(
            d.getMonth() + 1,
          ).padStart(2, "0")}/${d.getFullYear()}`;

          let hours = d.getHours();
          const minutes = String(d.getMinutes()).padStart(2, "0");
          const ampm = hours >= 12 ? "PM" : "AM";
          hours = hours % 12 || 12;

          const time = `${hours}:${minutes} ${ampm}`;
          const paperCode = item.paperCode!;

          const key = `${date}|${time}|${paperCode}`;

          if (!seen.has(key)) {
            seen.add(key);
            examSlots.push({ date, time, paperCode });
          }
        }

        // ---------- PDF GENERATION ----------
        console.log({
          semester: filteredResult[0].class!.split(" ")[1],
          examType: filteredResult[0].examType!,
          session: filteredResult[0].academicYear!,
          roomNumber: room!,
          examDates: examSlots.map((s) => s.date),
          examTimings: examSlots.map((s) => s.time),
          examPapersCodes: examSlots.map((s) => s.paperCode),
          examCandidates: filteredResult.map((r) => ({
            name: r.name!,
            identifier: r.orderType === "UID" ? r.uid! : r.rollNumber!,
            seatNumber: r.seatNumber!,
          })),
        });

        const uniqueCandidates = new Map<string, any>();

        filteredResult.forEach((r) => {
          // Use the most reliable unique identifier
          const key = r.orderType === "UID" ? r.uid : r.rollNumber;

          if (key && !uniqueCandidates.has(key)) {
            uniqueCandidates.set(key, {
              name: r.name!,
              identifier: r.orderType === "UID" ? r.uid! : r.rollNumber!,
              seatNumber: r.seatNumber!,
            });
          }
        });

        const pdfBuffer =
          await pdfGenerationService.generateExamAttendanceSheetPdfBuffer({
            semester: filteredResult[0].class!.split(" ")[1],
            examType: filteredResult[0].examType!,
            session: filteredResult[0].academicYear!,
            roomNumber: room!,
            examDates: examSlots.map((s) => s.date),
            examTimings: examSlots.map((s) => s.time),
            examPapersCodes: examSlots.map((s) => s.paperCode),
            examCandidates: Array.from(uniqueCandidates.values()),
          });

        const fileDate = filteredResult[0].examStartTime
          ? filteredResult[0].examStartTime.toISOString().split("T")[0]
          : "date";

        zip.file(
          `${filteredResult[0].examType}_${filteredResult[0].class}_room_${room}_${fileDate}.pdf`,
          pdfBuffer,
        );

        // ---------- SOCKET PROGRESS ----------
        completed++;

        if (io && userId) {
          io.to(`user:${userId}`).emit("download_progress", {
            id: uploadSessionId,
            userId,
            message: `Generated ${completed}/${totalRooms} PDFs`,
            progress: Math.round((completed / totalRooms) * 100),
            status: "processing",
            stage: "pdf_generation",
          });
        }
      }),
    ),
  );

  // ---------- ZIP FINALIZE ----------
  if (io && userId) {
    io.to(`user:${userId}`).emit("download_progress", {
      id: uploadSessionId,
      userId,
      message: "Creating ZIP file...",
      progress: 100,
      status: "finalizing",
      stage: "zipping",
    });
  }

  console.log("Creating zip file...");

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  console.log("sending zip file from service...");
  return {
    zipBuffer,
    roomCount: totalRooms,
  };
}

interface OldStudentPapers {
  affiliation: string;
  regulation: string;
  program_course: string;
  uid: string;
  user_name: string;
  is_active: string;
  registration_year: string;
  promotion_academic_year: string;
  promotion_status: string;
  semester: string;
  shift: string;
  section: string;
  class_roll_number: string;
  university_roll_number: string;
  university_registration_number: string;
  subject: string;
  subject_type: string;
  selection_label: string;
  selection_version: string;
  paper_type: string;
  paper: string;
  paper_code: string;
  credit: string;
  is_elective: string;
  legacy_student_id: number;
  legacy_promotion_id: number;
  legacy_paper_id: number;
  legacy_subject_type_id: number;
  legacy_subject_id: number;
  legacy_course_id: number;
  legacy_class_id: number;
}

interface NotFoundLegacyPaper {
  affiliation: string;
  regulation: string;
  program_course: string;

  semester: string;

  subject: string;
  subject_type: string;

  paper_type: string;
  paper: string;
  paper_code: string;
  credit: string;
  is_elective: string;

  legacy_paper_id: number;
  legacy_subject_type_id: number;
  legacy_subject_id: number;
  legacy_course_id: number;
  legacy_class_id: number;
}

export async function getIrpNotFoundCourseDesigns() {
  const [oldStudentPapers] = (await mysqlConnection.query(`
        SELECT
            'Calcutta University' AS affiliation,
            s.courseType AS regulation,
            co.courseName AS program_course,
            s.codenumber AS uid,
            s.name AS user_name,
            CASE WHEN s.active = 1 THEN 'Yes' ELSE 'No' END AS is_active,
            COALESCE(hr_reg.registration_year, '') AS registration_year,
            CONCAT(
                SUBSTRING(pr_sess.sessionName, 1, 4),
                '-',
                RIGHT(pr_sess.sessionName, 2)
            ) AS promotion_academic_year,
            prs.spltype AS promotion_status,
            REPLACE(cl.classname, 'Semester ', '') AS semester,
            sh.shiftName AS shift,
            COALESCE(sec.sectionName, '') AS section,
            COALESCE(h.rollNo, '') AS class_roll_number,
            
            h.univrollno AS university_roll_number,
            s.univregno AS university_registration_number,
            COALESCE(sb.univcode, sb.subjectname) AS subject,
            COALESCE(st.shortname, st.subjecttypename) AS subject_type,
            '' AS selection_label,
            '' AS selection_version,
            
            CASE WHEN p.allstudents = 1 THEN 'Mandatory' ELSE 'Elective' END AS paper_type,
            pl.paperName AS paper,
            pl.paperShortName AS paper_code,
            pl.paperCreditPoint AS credit,
            CASE WHEN p.allstudents = 1 THEN 'No' ELSE 'Yes' END AS is_elective,
            s.id AS legacy_student_id,
            h.id AS legacy_promotion_id,
            pl.id AS legacy_paper_id,
            st.id AS legacy_subject_type_id,
            sb.id AS legacy_subject_id,
            co.id AS legacy_course_id,
            cl.id AS legacy_class_id

        FROM studentpaperlinkingmain m
        JOIN studentpaperlinkingpaperlist p
            ON m.id = p.parent_id

        JOIN historicalrecord h
            ON m.courseid   = h.courseid
        AND m.classid    = h.classid
        AND m.sectionid = h.sectionid
        AND m.shiftid   = h.shiftid
        AND m.sessionid = h.sessionid

        JOIN studentpersonaldetails s
            ON h.parent_id = s.id

        JOIN course co ON m.courseid = co.id
        JOIN classes cl ON m.classid = cl.id
        JOIN subjecttype st ON p.subjectTypeId = st.id
        JOIN subject sb ON p.subjectId = sb.id
        JOIN paperlist pl ON pl.id = p.paperId
        JOIN currentsessionmaster pr_sess ON pr_sess.id = h.sessionid
        JOIN shift sh ON sh.id = h.shiftId
        JOIN section sec ON sec.id = h.sectionId
        JOIN promotionstatus prs ON prs.id = h.promotionstatus
        LEFT JOIN (
            SELECT parent_id, YEAR(MIN(dateOfJoining)) AS registration_year
            FROM historicalrecord
            WHERE classid = 4
            GROUP BY parent_id
        ) hr_reg ON hr_reg.parent_id = s.id

        WHERE
            m.sessionid = 18
            AND cl.id IN (5, 8)
            AND p.allstudents IN (0, 1)

        ORDER BY
        hr_reg.registration_year,
            program_course,
            cl.id,
            h.id,
            uid,
            subject_type
        ;
    `)) as [OldStudentPapers[], any];

  console.log("Processing for legacy-subject-types...");
  const foundLegacySubjectTypeIds = [
    ...new Set(oldStudentPapers.map((p) => p.legacy_subject_type_id)),
  ];
  const notFoundLegacySubjectTypeIds: number[] = [];
  let count = 0;
  for (const legacySubjectTypeId of foundLegacySubjectTypeIds) {
    console.log(`${count++} / ${foundLegacySubjectTypeIds.length}`);
    const [[oldSubjectType]] = (await mysqlConnection.query(`
            SELECT * FROM subjecttype WHERE id = ${legacySubjectTypeId}
        `)) as [OldSubjectType[], any];

    if (!oldSubjectType) {
      notFoundLegacySubjectTypeIds.push(legacySubjectTypeId);
      continue;
    }

    const [foundNewSubjectType] = await db
      .select()
      .from(subjectTypeModel)
      .where(
        or(
          eq(subjectTypeModel.legacySubjectTypeId, legacySubjectTypeId),
          ilike(subjectTypeModel.name, oldSubjectType.subjectTypeName!.trim()),
        ),
      );

    if (!foundNewSubjectType) {
      notFoundLegacySubjectTypeIds.push(legacySubjectTypeId);
    }
  }

  console.log("Processing for legacy-courses...");
  const foundLegacyCourseIds = [
    ...new Set(oldStudentPapers.map((p) => p.legacy_course_id)),
  ];
  const notFoundLegacyCourseIds: number[] = [];
  count = 0;
  for (const legacyCourseId of foundLegacyCourseIds) {
    console.log(`${count++} / ${foundLegacyCourseIds.length}`);
    const [[oldCourse]] = (await mysqlConnection.query(`
            SELECT * FROM course WHERE id = ${legacyCourseId}
        `)) as [OldCourse[], any];

    if (!oldCourse) {
      notFoundLegacyCourseIds.push(legacyCourseId);
      continue;
    }

    const [foundNewCourse] = await db
      .select()
      .from(courseModel)
      .where(
        or(
          eq(courseModel.legacyCourseId, legacyCourseId),
          ilike(courseModel.name, oldCourse.courseName!.trim()),
        ),
      );

    if (!foundNewCourse) {
      notFoundLegacyCourseIds.push(legacyCourseId);
    }
  }

  console.log("Processing for legacy-subjects...");
  const foundLegacySubjectIds = [
    ...new Set(oldStudentPapers.map((p) => p.legacy_subject_id)),
  ];
  const notFoundLegacySubjectIds: number[] = [];
  count = 0;
  for (const legacySubjectId of foundLegacySubjectIds) {
    console.log(`${count++} / ${foundLegacySubjectIds.length}`);
    const [[oldSubject]] = (await mysqlConnection.query(`
            SELECT * FROM subject WHERE id = ${legacySubjectId}
        `)) as [OldSubject[], any];

    if (!oldSubject) {
      notFoundLegacySubjectIds.push(legacySubjectId);
      continue;
    }

    const [foundNewSubject] = await db
      .select()
      .from(subjectModel)
      .where(
        or(
          eq(subjectModel.legacySubjectId, legacySubjectId),
          ilike(subjectModel.name, oldSubject.subjectName!.trim()),
        ),
      );

    if (!foundNewSubject) {
      notFoundLegacySubjectIds.push(legacySubjectId);
    }
  }

  console.log("Processing for legacy-papers...");
  // const foundLegacyPaperIds = [...new Set(oldStudentPapers.map((p) => p.legacy_paper_id))];
  const notFoundLegacyPaperMap = new Map<string, NotFoundLegacyPaper>();

  const uniquePaperCandidates = Array.from(
    new Map(
      oldStudentPapers.map((p) => [
        [
          p.legacy_subject_type_id,
          p.legacy_subject_id,
          p.legacy_course_id,
          p.legacy_class_id,
          p.legacy_paper_id,
        ].join("-"),
        p,
      ]),
    ).values(),
  );

  console.log(
    `Reduced from ${oldStudentPapers.length} → ${uniquePaperCandidates.length}`,
  );

  count = 0;
  for (let i = 0; i < uniquePaperCandidates.length; i++) {
    const paper = uniquePaperCandidates[i];

    console.log(
      `Student Iteration: ${count++} / ${uniquePaperCandidates.length}`,
    );
    const [[oldSubjectType]] = (await mysqlConnection.query(`
            SELECT * FROM subjecttype WHERE id = ${paper.legacy_subject_type_id}
        `)) as [OldSubjectType[], any];

    const [[oldSubject]] = (await mysqlConnection.query(`
            SELECT * FROM subject WHERE id = ${paper.legacy_subject_id}
        `)) as [OldSubject[], any];

    const [[oldCourse]] = (await mysqlConnection.query(`
            SELECT * FROM course WHERE id = ${paper.legacy_course_id}
        `)) as [OldCourse[], any];

    const [[oldClass]] = (await mysqlConnection.query(`
            SELECT * FROM classes WHERE id = ${paper.legacy_class_id}
        `)) as [OldClass[], any];

    const [foundNewPaper] = await db
      .select()
      .from(paperModel)
      .leftJoin(
        subjectTypeModel,
        eq(paperModel.subjectTypeId, subjectTypeModel.id),
      )
      .leftJoin(subjectModel, eq(paperModel.subjectId, subjectModel.id))
      .leftJoin(
        programCourseModel,
        eq(paperModel.programCourseId, programCourseModel.id),
      )
      .leftJoin(courseModel, eq(programCourseModel.courseId, courseModel.id))
      .leftJoin(classModel, eq(paperModel.classId, classModel.id))
      .where(
        and(
          or(
            eq(subjectTypeModel.legacySubjectTypeId, oldSubjectType?.id!),
            ilike(
              subjectTypeModel.name,
              oldSubjectType?.subjectTypeName!.trim(),
            ),
          ),
          or(
            eq(subjectModel.legacySubjectId, oldSubject?.id!),
            ilike(subjectModel.name, oldSubject?.subjectName!.trim()),
          ),
          or(
            eq(courseModel.legacyCourseId, oldCourse?.id!),
            ilike(courseModel.name, oldCourse?.courseName!.trim()),
            ilike(programCourseModel.name, oldCourse?.courseName!.trim()),
          ),
          or(ilike(classModel.name, oldClass?.classname!.trim())),
        ),
      );

    if (!foundNewPaper) {
      const key = [
        paper.legacy_paper_id,
        paper.legacy_subject_id,
        paper.legacy_subject_type_id,
        paper.legacy_course_id,
        paper.legacy_class_id,
      ].join("-");

      if (!notFoundLegacyPaperMap.has(key)) {
        notFoundLegacyPaperMap.set(key, {
          affiliation: paper.affiliation,
          regulation: paper.regulation,
          program_course: paper.program_course,
          semester: paper.semester,
          subject: paper.subject,
          subject_type: paper.subject_type,
          paper_type: paper.paper_type,
          paper: paper.paper,
          paper_code: paper.paper_code,
          credit: paper.credit,
          is_elective: paper.is_elective,
          legacy_paper_id: paper.legacy_paper_id,
          legacy_subject_type_id: paper.legacy_subject_type_id,
          legacy_subject_id: paper.legacy_subject_id,
          legacy_course_id: paper.legacy_course_id,
          legacy_class_id: paper.legacy_class_id,
        });
      }
    }
  }

  // console.log("notFoundLegacySubjectTypeIds", notFoundLegacySubjectTypeIds);
  // console.log("notFoundLegacyCourseIds", notFoundLegacyCourseIds);
  // console.log("notFoundLegacySubjectIds", notFoundLegacySubjectIds);
  // console.log("notFoundLegacyPaperIds", JSON.stringify(notFoundLegacyPaperIds, null, 2));

  const notFoundLegacyPaper = Array.from(notFoundLegacyPaperMap.values());

  if (notFoundLegacyPaper.length === 0) {
    console.log("No missing papers found. Excel not generated.");
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(notFoundLegacyPaper);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "irp-missing-papers");

  const outputDir = path.join(process.cwd(), "exports");
  if (!fsO.existsSync(outputDir)) {
    fsO.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(
    outputDir,
    `irp_not_found_course_designs_${Date.now()}.xlsx`,
  );

  XLSX.writeFile(workbook, filePath);

  console.log(`✅ Excel file generated at: ${filePath}`);
}
