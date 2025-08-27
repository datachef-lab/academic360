import {dbPostgres, query } from "@/db";
import { Course } from "@/types/academics/course";
import { courses, Course as DbCourse} from "@/db/schema";
import { eq, ilike, sql } from "drizzle-orm";

export async function findAllCourse() {
    const sqlQuery = `SELECT * FROM course;`;
    const courses = await query(sqlQuery) as Course[];
    console.log("courses", courses);
    return courses;
}

export async function createCourse(course: DbCourse) {
    const [existingCourse] = await dbPostgres
        .select()
        .from(courses)
        .where(
            ilike(courses.name, course.name.trim()),
        );

    if (existingCourse) {
        return null;
    }

    const [newCourse] = await dbPostgres
        .insert(courses)
        .values(course)
        .returning();

    return newCourse;
}

export async function findAllDbCourses(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const paginatedCourses = await dbPostgres
        .select()
        .from(courses)
        .limit(limit)
        .offset(offset);

    const totalCourses = await dbPostgres
        .select({ count: sql<string>`count(*)` })
        .from(courses);

    const totalCount = parseInt(totalCourses[0].count, 10);

    return { courses: paginatedCourses, totalCount };
}

export async function findCourseById(id: number) {
    const [foundCourse] = await dbPostgres
        .select()
        .from(courses)
        .where(
            eq(courses.id, id)
        );

    return foundCourse ?? null;
}

export async function updateCourse(id: number, givenCourse: Partial<DbCourse>): Promise<DbCourse | null> {
    const [foundCourse] = await dbPostgres
        .select()
        .from(courses)
        .where(
            eq(courses.id, id)
        );

    if (!foundCourse) return null;

    const [updatedCourse] = await dbPostgres
        .update(courses)
        .set({
            ...foundCourse,
            ...givenCourse
        })
        .where(eq(courses.id, id));

    return updatedCourse;
}