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

export async function createCourse(course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<CourseDto> {
    const [newCourse] = await db
        .insert(courseModel)
        .values(course)
        .returning();

    const formattedCourse = await courseFormatResponse(newCourse);

    if (!formattedCourse) {
        throw new Error('Failed to create course');
    }

    return formattedCourse;
}

export async function updateCourse(id: number, course: Omit<CourseDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<CourseDto | null> {
    console.log("in update course in service, course:", course, "id:", id);
    const [updatedCourse] = await db
        .update(courseModel)
        .set({ ...course, degreeId: course.degree?.id })
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
                ilike(courseModel.codePrefix, `%${query}%`)
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

function or(...conditions: any[]) {
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
