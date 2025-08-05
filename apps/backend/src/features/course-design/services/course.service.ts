import { db, mysqlConnection } from "@/db/index.js";
import { CourseDto } from "@/types/course-design/index.type.js";
import { Course, courseModel, createCourseModel } from "../../course-design/models/course.model.js";
import { and, count, eq, ilike, sql } from "drizzle-orm";
// import { StreamType } from "@/types/academics/stream.js";
// import { findStreamById } from "./stream.service.js";
// import { streamModel } from "../models/stream.model.js";
import { OldCourse } from "@/types/old-data/old-course.js";
// import { processCourse } from "./batch.service.js";
import { studentModel } from "@/features/user/models/student.model.js";
import { academicIdentifierModel } from "@/features/user/models/academicIdentifier.model.js";
import { OldStudent } from "@/types/old-student.js";
import { Degree } from "@/features/resources/models/degree.model.js";
import { findDegreeById } from "@/features/resources/services/degree.service.js";
import XLSX from "xlsx";
import fs from "fs";

export interface BulkUploadResult {
  success: Course[];
  errors: Array<{ row: number; data: unknown[]; error: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export const bulkUploadCourses = async (
  filePath: string,
  io?: any,
  uploadSessionId?: string
): Promise<BulkUploadResult> => {
  const result: BulkUploadResult = { 
    success: [], 
    errors: [], 
    summary: { total: 0, successful: 0, failed: 0 } 
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
          code: row[1]?.toString()?.trim(),
          shortName: row[2]?.toString()?.trim() || null,
          sequence: row[3] ? parseInt(row[3].toString()) : null,
          degreeId: row[4] ? parseInt(row[4].toString()) : null,
          disabled: row[5]?.toString()?.toLowerCase() === 'inactive' || row[5]?.toString()?.toLowerCase() === 'false',
        };
        if (!courseData.name) {
          result.errors.push({ row: rowNumber, data: row, error: "Name is required" });
          result.summary.failed++;
          continue;
        }
        // Insert the course
        const [newCourse] = await db.insert(courseModel).values(courseData).returning();
        result.success.push(newCourse);
        result.summary.successful++;
      } catch (error: unknown) {
        console.error(`Error processing row ${rowNumber}:`, error);
        result.errors.push({ row: rowNumber, data: row, error: error instanceof Error ? error.message : "Unknown error" });
        result.summary.failed++;
      }
      if (io && uploadSessionId) {
        io.to(uploadSessionId).emit("bulk-upload-progress", {
          processed: i,
          total: data.length - 1,
          percent: Math.round((i / (data.length - 1)) * 100)
        });
      }
    }
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (io && uploadSessionId) {
      if (result.errors.length > 0) {
        io.to(uploadSessionId).emit("bulk-upload-failed", { errorCount: result.errors.length });
      } else {
        io.to(uploadSessionId).emit("bulk-upload-done", { successCount: result.success.length });
      }
    }
    return result;
  } catch (error: unknown) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw new Error(`Failed to process Excel file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

export async function findAllCourses(): Promise<CourseDto[]> {
    const courses = await db
        .select()
        .from(courseModel);

    const formattedCourses = await Promise.all(
        courses.map(course => courseFormatResponse(course))
    );

    return formattedCourses.filter((course): course is CourseDto => course !== null);
}

export async function findCourseById(id: number): Promise<CourseDto | null> {
    const [foundCourse] = await db
        .select()
        .from(courseModel)
        .where(eq(courseModel.id, id));

    const formattedCourse = await courseFormatResponse(foundCourse);

    return formattedCourse;
}

export async function createCourse(course: CourseDto): Promise<CourseDto | null> {
    const { degree, id, createdAt, updatedAt, ...props } = course;
    console.log("in create course in service, course:", course);
    const courseData: Course = {
        ...props,
        degreeId: degree?.id,
    }

    const [existingCourse] = await db
        .select()
        .from(courseModel)
        .where(
            and(
                ilike(courseModel.name, courseData.name.trim()),
                eq(courseModel.degreeId, courseData.degreeId!),
            )
        );

    if (existingCourse) return null;

    const [newCourse] = await db
        .insert(courseModel)
        .values(courseData)
        .returning();

    const formattedCourse = await courseFormatResponse(newCourse);

    if (!formattedCourse) {
        throw new Error('Failed to create course');
    }

    return formattedCourse;
}

export async function updateCourse(id: number, course: CourseDto): Promise<CourseDto | null> {
    const { degree, id: idObj, createdAt, updatedAt, ...props } = course;
    console.log("in update course in service, course:", course, "id:", id);
    const [updatedCourse] = await db
        .update(courseModel)
        .set({ ...props, degreeId: course.degree?.id, ...props })
        .where(eq(courseModel.id, id))
        .returning();

    const formattedCourse = await courseFormatResponse(updatedCourse);

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

export async function searchCourses(query: string): Promise<CourseDto[]> {
    const courses = await db
        .select()
        .from(courseModel)
        .where(
            or(
                ilike(courseModel.name, `%${query}%`),
                ilike(courseModel.shortName, `%${query}%`),
                ilike(courseModel.sequence, `%${query}%`)
            )
        );

    const formattedCourses = await Promise.all(
        courses.map(course => courseFormatResponse(course))
    );

    return formattedCourses.filter((course): course is CourseDto => course !== null);
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

export async function courseFormatResponse(course: Course | null): Promise<CourseDto | null> {
    if (!course) {
        return null;
    }

    const { degreeId, ...props } = course;

    let degree: Degree | null = null;
    if (degreeId) {
        degree = await findDegreeById(degreeId);
    }

    return {
        ...props,
        degree,
    }
}

function or(...conditions: unknown[]) {
    return sql`(${conditions.join(' OR ')})`;
}

export async function mapStudentCourses() {
    // Fetch all the old courses
    const [oldCourses] = await mysqlConnection.query(`SELECT * FROM course;`) as [OldCourse[], any];

    const BATCH_SIZE = 500;

    // Iterate the old courses fetched
    for (let c = 0; c < oldCourses.length; c++) {
        // Process the each course (upsert)
        // const course = await processCourse(oldCourses[c].id);

        // TODO: Paginate the students and map the course
        const [{ totalRows }] = await db.select({ totalRows: count() }).from(studentModel);
        const totalBatches = totalRows / BATCH_SIZE;
        for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
            const paginatedResult = await db
                .select({
                    id: studentModel.id,
                    uid: academicIdentifierModel.uid,
                    academicIdentifierId: academicIdentifierModel.id
                })
                .from(studentModel)
                .leftJoin(academicIdentifierModel, eq(academicIdentifierModel.studentId, studentModel.id))
                .limit(BATCH_SIZE)
                .offset(offset);

            // Fetch the old students
            const [oldStudents] =
                await mysqlConnection.query(`
                    SELECT *
                    FROM studentpersonaldetails
                    WHERE
                        codeNumber IN (${paginatedResult.map(std => std.uid!.trim())})
                        AND ;
                `) as [OldStudent[], any];

            for (let i = 0; i < paginatedResult.length; i++) {
                const oldStudent = oldStudents.find(
                    (std) => std.codeNumber.trim().toLowerCase() == paginatedResult[i].uid!.trim().toLowerCase()
                );

                if (!oldStudent) {
                    console.log("Old Student not found therefore continue")
                    continue;
                }



            }


        }

    }
}
