import { db, mysqlConnection } from "@/db/index.js";
import { CourseDto } from "@/types/course-design/index.type.js";
import { Course, courseModel, createCourseModel } from "@repo/db/schemas";
import { recomposeProgramCourseNamesFor } from "./program-course.service.js";
import { and, count, countDistinct, eq, ilike, sql } from "drizzle-orm";
// import { StreamType } from "@/types/academics/stream.js";
// import { findStreamById } from "./stream.service.js";
// import { streamModel } from "../models/stream.model.js";
import { OldCourse } from "@/types/old-data/old-course.js";
// import { processCourse } from "./batch.service.js";
// import { studentModel } from "@/features/user/models/student.model.js";

import { OldStudent } from "@/types/old-student.js";
// import { feesStructureModel } from "@/features/fees/models/fees-structure.model.js";
import { admissionCourseModel } from "@/features/admissions/models/admission-course.model.js";
import { admissionAcademicInfoModel } from "@/features/admissions/models/admission-academic-info.model.js";
import { admissionCourseApplication } from "@/features/admissions/models/admission-course-application.model.js";
import { programCourseModel } from "@repo/db/schemas/models/course-design";
import { batchModel } from "@repo/db/schemas/models/academics";
import XLSX from "xlsx";
import fs from "fs";
import { studentModel } from "@repo/db/schemas/index.js";

export interface BulkUploadResult {
  success: Course[];
  errors: Array<{ row: number; data: unknown[]; error: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export async function loadOldCourses() {
  const [oldCourses] = (await mysqlConnection.query(`
    SELECT * FROM course;
  `)) as [OldCourse[], any];

  for (let i = 0; i < oldCourses.length; i++) {
    const oldCourse = oldCourses[i];
    console.log("loading old course", oldCourse);
    const [foundCourse] = await db
      .select()
      .from(courseModel)
      .where(
        and(
          ilike(courseModel.name, oldCourse.courseName.trim()),
          eq(courseModel.legacyCourseId, oldCourse.id!),
        ),
      );
    if (foundCourse) continue;
    await db
      .insert(courseModel)
      .values({
        legacyCourseId: oldCourse.id!,
        name: oldCourse.courseName.trim(),
        shortName: oldCourse.courseSName?.trim(),
      })
      .returning();
  }
}

export const bulkUploadCourses = async (
  filePath: string,
  io?: any,
  uploadSessionId?: string,
): Promise<BulkUploadResult> => {
  const result: BulkUploadResult = {
    success: [],
    errors: [],
    summary: { total: 0, successful: 0, failed: 0 },
  };
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    result.summary.total = data.length - 1;

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      const rowNumber = i + 1;
      try {
        const courseData = {
          name: row[0]?.toString()?.trim(),
          // code column not present in courseModel; ignore
          shortName: row[2]?.toString()?.trim() || null,
          sequence: row[3] ? parseInt(row[3].toString()) : null,
          // degreeId not present in courseModel; ignore
          isActive:
            row[5]?.toString()?.toLowerCase() === "inactive" ||
            row[5]?.toString()?.toLowerCase() === "false",
        } as const;
        if (!courseData.name) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: "Name is required",
          });
          result.summary.failed++;
          continue;
        }

        // Check for duplicates before insertion
        const existingCourse = await db
          .select()
          .from(courseModel)
          .where(eq(courseModel.name, courseData.name));

        if (existingCourse.length > 0) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: `Course with name "${courseData.name}" already exists`,
          });
          result.summary.failed++;
          continue;
        }

        // Insert the course
        const [newCourse] = await db
          .insert(courseModel)
          .values({
            name: courseData.name!,
            shortName: courseData.shortName ?? undefined,
            sequence: courseData.sequence ?? undefined,
            isActive: courseData.isActive,
          })
          .returning();
        result.success.push(newCourse);
        result.summary.successful++;
      } catch (error: unknown) {
        console.error(`Error processing row ${rowNumber}:`, error);
        result.errors.push({
          row: rowNumber,
          data: row,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        result.summary.failed++;
      }
      if (io && uploadSessionId) {
        io.to(uploadSessionId).emit("bulk-upload-progress", {
          processed: i,
          total: data.length - 1,
          percent: Math.round((i / (data.length - 1)) * 100),
        });
      }
    }
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (io && uploadSessionId) {
      if (result.errors.length > 0) {
        io.to(uploadSessionId).emit("bulk-upload-failed", {
          errorCount: result.errors.length,
        });
      } else {
        io.to(uploadSessionId).emit("bulk-upload-done", {
          successCount: result.success.length,
        });
      }
    }
    return result;
  } catch (error: unknown) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw new Error(
      `Failed to process Excel file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export async function findAllCourses(): Promise<CourseDto[]> {
  const courses = await db.select().from(courseModel);

  const formattedCourses = await Promise.all(
    courses.map((course) => courseFormatResponse(course)),
  );

  return formattedCourses.filter(
    (course): course is CourseDto => course !== null,
  );
}

export async function findById(id: number): Promise<CourseDto | null> {
  const [foundCourse] = await db
    .select()
    .from(courseModel)
    .where(eq(courseModel.id, id));

  const formattedCourse = await courseFormatResponse(foundCourse);

  return formattedCourse;
}

export async function createCourse(
  course: CourseDto,
): Promise<CourseDto | null> {
  const { id, createdAt, updatedAt, degree, ...props } = course;
  console.log("in create course in service, course:", course);
  const courseData: Course = {
    name: course.name!,
    shortName: course.shortName!,
    sequence: props.sequence ?? null,
    isActive: props.isActive ?? true,
    legacyCourseId: props.legacyCourseId ?? null,
    courseHeaderId: props.courseHeaderId ?? undefined,
  };

  const [existingCourse] = await db
    .select()
    .from(courseModel)
    .where(ilike(courseModel.name, courseData.name.trim()));

  if (existingCourse) return null;

  const [newCourse] = await db
    .insert(courseModel)
    .values(courseData)
    .returning();

  const formattedCourse = await courseFormatResponse(newCourse);

  if (!formattedCourse) {
    throw new Error("Failed to create course");
  }

  return formattedCourse;
}

export async function updateCourse(
  id: number,
  course: CourseDto,
): Promise<CourseDto | null> {
  const { id: idObj, createdAt, updatedAt, degree, ...props } = course;
  console.log("in update course in service, course:", course, "id:", id);
  const [updatedCourse] = await db
    .update(courseModel)
    .set({
      name: props.name!,
      shortName: props.shortName ?? undefined,
      sequence: props.sequence ?? undefined,
      isActive: props.isActive ?? undefined,
      legacyCourseId: props.legacyCourseId ?? undefined,
      courseHeaderId: props.courseHeaderId ?? undefined,
    })
    .where(eq(courseModel.id, id))
    .returning();

  const formattedCourse = await courseFormatResponse(updatedCourse);

  if (props.name !== undefined) {
    await recomposeProgramCourseNamesFor({ courseId: id });
  }

  return formattedCourse;
}

export async function deleteCourse(id: number): Promise<CourseDto | null> {
  const [deletedCourse] = await db
    .delete(courseModel)
    .where(eq(courseModel.id, id))
    .returning();

  const formattedCourse = await courseFormatResponse(deletedCourse);

  return formattedCourse;
}

export async function deleteCourseSafe(id: number) {
  const [found] = await db
    .select()
    .from(courseModel)
    .where(eq(courseModel.id, id));
  if (!found) return null;

  const [
    [{ batchCount }],
    [{ studyMaterialCount }],
    [{ admAcademicInfoCount }],
    [{ admCourseAppCount }],
    [{ admCourseCount }],
    [{ programCourseCount }],
    // [{ feesStructureCount }],
  ] = await Promise.all([
    db
      .select({ batchCount: countDistinct(batchModel.id) })
      .from(batchModel)
      .where(eq(batchModel.classId, id)),
    db
      .select({ studyMaterialCount: sql<number>`0` })
      .from(courseModel)
      .where(eq(courseModel.id, id)),
    db
      .select({
        admAcademicInfoCount: countDistinct(admissionAcademicInfoModel.id),
      })
      .from(admissionAcademicInfoModel)
      .where(eq(admissionAcademicInfoModel.previouslyRegisteredCourseId, id)),
    db
      .select({
        admCourseAppCount: countDistinct(admissionCourseApplication.id),
      })
      .from(admissionCourseApplication)
      .leftJoin(
        admissionCourseModel,
        eq(
          admissionCourseModel.id,
          admissionCourseApplication.admissionCourseId,
        ),
      )
      .where(eq(admissionCourseModel.courseId, id)),
    db
      .select({ admCourseCount: countDistinct(admissionCourseModel.id) })
      .from(admissionCourseModel)
      .where(eq(admissionCourseModel.courseId, id)),
    db
      .select({ programCourseCount: countDistinct(programCourseModel.id) })
      .from(programCourseModel)
      .where(eq(programCourseModel.courseId, id)),
    // db
    //   .select({ feesStructureCount: countDistinct(feesStructureModel.id) })
    //   .from(feesStructureModel)
    //   .where(eq(feesStructureModel.courseId, id)),
  ]);

  if (
    batchCount > 0 ||
    studyMaterialCount > 0 ||
    admAcademicInfoCount > 0 ||
    admCourseAppCount > 0 ||
    admCourseCount > 0 ||
    programCourseCount > 0
    // feesStructureCount > 0
  ) {
    return {
      success: false,
      message: "Cannot delete course. It is associated with other records.",
      records: [
        { count: batchCount, type: "Batch" },
        { count: studyMaterialCount, type: "Study-material" },
        { count: admAcademicInfoCount, type: "Adm-academic-info" },
        { count: admCourseAppCount, type: "Adm-course-app" },
        { count: admCourseCount, type: "Adm-course" },
        { count: programCourseCount, type: "Program-course" },
        // { count: feesStructureCount, type: "Fees-structure" },
      ],
    };
  }

  const [deleted] = await db
    .delete(courseModel)
    .where(eq(courseModel.id, id))
    .returning();
  if (deleted)
    return {
      success: true,
      message: "Course deleted successfully.",
      records: [],
    };
  return { success: false, message: "Failed to delete course.", records: [] };
}

export async function searchCourses(query: string): Promise<CourseDto[]> {
  const courses = await db
    .select()
    .from(courseModel)
    .where(
      or(
        ilike(courseModel.name, `%${query}%`),
        ilike(courseModel.shortName, `%${query}%`),
        ilike(courseModel.sequence, `%${query}%`),
      ),
    );

  const formattedCourses = await Promise.all(
    courses.map((course) => courseFormatResponse(course)),
  );

  return formattedCourses.filter(
    (course): course is CourseDto => course !== null,
  );
}

// export async function findCoursesByStreamId(streamId: number): Promise<CourseDto[]> {
//     const courses = await db
//         .select()
//         .from(courseModel)
//         .where(eq(courseModel.streamId, streamId));

//     const formattedCourses = await Promise.all(
//         courses.map(course => courseFormatResponse(course))
//     );

//     return formattedCourses.filter((course): course is CourseDto => course !== null);
// }

export async function courseFormatResponse(
  course: Course | null,
): Promise<CourseDto | null> {
  if (!course) {
    return null;
  }

  return {
    ...course,
    degree: undefined,
  } as unknown as CourseDto;
}

function or(...conditions: unknown[]) {
  return sql`(${conditions.join(" OR ")})`;
}

export async function mapStudentCourses() {
  // Fetch all the old courses
  const [oldCourses] = (await mysqlConnection.query(
    `SELECT * FROM course;`,
  )) as [OldCourse[], any];

  const BATCH_SIZE = 500;

  // Iterate the old courses fetched
  for (let c = 0; c < oldCourses.length; c++) {
    // Process the each course (upsert)
    // const course = await processCourse(oldCourses[c].id);

    // TODO: Paginate the students and map the course
    const [{ totalRows }] = await db
      .select({ totalRows: count() })
      .from(studentModel);
    const totalBatches = totalRows / BATCH_SIZE;
    for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
      const paginatedResult = await db
        .select({
          id: studentModel.id,
          // uid: academicIdentifierModel.uid,
          // academicIdentifierId: academicIdentifierModel.id
        })
        .from(studentModel)
        // .leftJoin(academicIdentifierModel, eq(academicIdentifierModel.studentId, studentModel.id))
        .limit(BATCH_SIZE)
        .offset(offset);

      // Fetch the old students
      const [oldStudents] = (await mysqlConnection.query(`
                    SELECT *
                    FROM studentpersonaldetails
                    WHERE
                        codeNumber IN ('')
                        AND ;
                `)) as [OldStudent[], any];

      for (let i = 0; i < paginatedResult.length; i++) {
        const oldStudent = oldStudents.find(
          (std) => std.codeNumber.trim().toLowerCase() == "",
        );

        if (!oldStudent) {
          console.log("Old Student not found therefore continue");
          continue;
        }
      }
    }
  }
}
