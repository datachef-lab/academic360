import { dbPostgres } from "@/db";
import { admissionCourses, AdmissionCourse, courses, admissions, academicYears } from "@/db/schema";
import { and, eq } from "drizzle-orm";

// ✅ Create
export async function createAdmissionCourse(givenAdmCourse: AdmissionCourse) {
    const [existingEntry] = await dbPostgres
        .select()
        .from(admissionCourses)
        .where(
            and(
                eq(admissionCourses.admissionId, givenAdmCourse.admissionId),
                eq(admissionCourses.courseId, givenAdmCourse.courseId),
            )
        );

    if (existingEntry) {
        return { course: existingEntry, message: "Admission course already exists." };
    }

    const [newCourse] = await dbPostgres
        .insert(admissionCourses)
        .values(givenAdmCourse)
        .returning();

    return {
        course: newCourse,
        message: "New Admission Course Created!"
    };
}

// ✅ Read by ID
export async function findAdmissionCourseById(id: number) {
    const [course] = await dbPostgres
        .select()
        .from(admissionCourses)
        .where(eq(admissionCourses.id, id));

    return course || null;
}

// ✅ Read by ID with course and admission details
export async function findAdmissionCourseByIdWithDetails(id: number) {
    const [course] = await dbPostgres
        .select({
            id: admissionCourses.id,
            admissionId: admissionCourses.admissionId,
            courseId: admissionCourses.courseId,
            disabled: admissionCourses.disabled,
            createdAt: admissionCourses.createdAt,
            updatedAt: admissionCourses.updatedAt,
            remarks: admissionCourses.remarks,
            course: {
                id: courses.id,
                name: courses.name,
                shortName: courses.shortName,
                codePrefix: courses.codePrefix,
                universityCode: courses.universityCode,
                disabled: courses.disabled,
                amount: courses.amount
            },
            admission: {
                id: admissions.id,
                year: academicYears.year,
                isClosed: admissions.isClosed,
                startDate: admissions.startDate,
                lastDate: admissions.lastDate,
            }
        })
        .from(admissionCourses)
        .leftJoin(courses, eq(admissionCourses.courseId, courses.id))
        .leftJoin(admissions, eq(admissionCourses.admissionId, admissions.id))
        .leftJoin(academicYears, eq(academicYears.id, admissions.academicYearId))
        .where(eq(admissionCourses.id, id));

    return course || null;
}

// ✅ Read by Admission ID
export async function findAdmissionCoursesByAdmissionId(admissionId: number) {
    const admissionCoursesList = await dbPostgres
        .select()
        .from(admissionCourses)
        .where(eq(admissionCourses.admissionId, admissionId));

    return admissionCoursesList;
}

// ✅ Read by Admission ID with course details
export async function findAdmissionCoursesByAdmissionIdWithDetails(admissionId: number) {
    const admissionCoursesList = await dbPostgres
        .select({
            id: admissionCourses.id,
            admissionId: admissionCourses.admissionId,
            courseId: admissionCourses.courseId,
            disabled: admissionCourses.disabled,
            createdAt: admissionCourses.createdAt,
            updatedAt: admissionCourses.updatedAt,
            remarks: admissionCourses.remarks,
            course: {
                id: courses.id,
                name: courses.name,
                shortName: courses.shortName,
                codePrefix: courses.codePrefix,
                universityCode: courses.universityCode,
                disabled: courses.disabled,
                amount: courses.amount
            }
        })
        .from(admissionCourses)
        .leftJoin(courses, eq(admissionCourses.courseId, courses.id))
        .where(eq(admissionCourses.admissionId, admissionId));

    return admissionCoursesList;
}

// ✅ Read by Course ID
export async function findAdmissionCoursesByCourseId(courseId: number) {
    const admissionCoursesList = await dbPostgres
        .select()
        .from(admissionCourses)
        .where(eq(admissionCourses.courseId, courseId));

    return admissionCoursesList;
}

// ✅ Read by Course ID with admission details
export async function findAdmissionCoursesByCourseIdWithDetails(courseId: number) {
    const admissionCoursesList = await dbPostgres
        .select({
            id: admissionCourses.id,
            admissionId: admissionCourses.admissionId,
            courseId: admissionCourses.courseId,
            disabled: admissionCourses.disabled,
            createdAt: admissionCourses.createdAt,
            updatedAt: admissionCourses.updatedAt,
            remarks: admissionCourses.remarks,
            admission: {
                id: admissions.id,
                year: academicYears.year,
                isClosed: admissions.isClosed,
                startDate: admissions.startDate,
                lastDate: admissions.lastDate,

            }
        })
        .from(admissionCourses)
        .leftJoin(admissions, eq(admissionCourses.admissionId, admissions.id))
        .leftJoin(academicYears, eq(academicYears.id, admissions.academicYearId))
        .where(eq(admissionCourses.courseId, courseId));

    return admissionCoursesList;
}

// ✅ Read all active courses
export async function findAllActiveAdmissionCourses() {
    const admissionCoursesList = await dbPostgres
        .select()
        .from(admissionCourses)
        .where(eq(admissionCourses.disabled, false));

    return admissionCoursesList;
}

// ✅ Read all active courses with details
export async function findAllActiveAdmissionCoursesWithDetails() {
    const admissionCoursesList = await dbPostgres
        .select({
            id: admissionCourses.id,
            admissionId: admissionCourses.admissionId,
            courseId: admissionCourses.courseId,
            disabled: admissionCourses.disabled,
            createdAt: admissionCourses.createdAt,
            updatedAt: admissionCourses.updatedAt,
            remarks: admissionCourses.remarks,
            course: {
                id: courses.id,
                name: courses.name,
                shortName: courses.shortName,
                codePrefix: courses.codePrefix,
                universityCode: courses.universityCode,
                disabled: courses.disabled,
                amount: courses.amount
            },
            admission: {
                id: admissions.id,
                year: academicYears.year,
                isClosed: admissions.isClosed,
                startDate: admissions.startDate,
                lastDate: admissions.lastDate,
            }
        })
        .from(admissionCourses)
        .leftJoin(courses, eq(admissionCourses.courseId, courses.id))
        .leftJoin(admissions, eq(admissionCourses.admissionId, admissions.id))
        .leftJoin(academicYears, eq(academicYears.id, admissions.academicYearId))
        .where(eq(admissionCourses.disabled, false));

    return admissionCoursesList;
}

// ✅ Read all courses
export async function findAllAdmissionCourses() {
    const admissionCoursesList = await dbPostgres
        .select()
        .from(admissionCourses);

    return admissionCoursesList;
}

// ✅ Read all courses with details
export async function findAllAdmissionCoursesWithDetails() {
    const admissionCoursesList = await dbPostgres
        .select({
            id: admissionCourses.id,
            admissionId: admissionCourses.admissionId,
            courseId: admissionCourses.courseId,
            disabled: admissionCourses.disabled,
            createdAt: admissionCourses.createdAt,
            updatedAt: admissionCourses.updatedAt,
            remarks: admissionCourses.remarks,
            course: {
                id: courses.id,
                name: courses.name,
                shortName: courses.shortName,
                codePrefix: courses.codePrefix,
                universityCode: courses.universityCode,
                disabled: courses.disabled,
                amount: courses.amount
            },
            admission: {
                id: admissions.id,
                year: academicYears.year,
                isClosed: admissions.isClosed,
                startDate: admissions.startDate,
                lastDate: admissions.lastDate,
            }
        })
        .from(admissionCourses)
        .leftJoin(courses, eq(admissionCourses.courseId, courses.id))
        .leftJoin(academicYears, eq(academicYears.id, admissions.academicYearId))
        .leftJoin(admissions, eq(admissionCourses.admissionId, admissions.id));

    return admissionCoursesList;
}

// ✅ Update
export async function updateAdmissionCourse(course: AdmissionCourse) {
    if (!course.id) return null;

    const [updatedCourse] = await dbPostgres
        .update(admissionCourses)
        .set(course)
        .where(eq(admissionCourses.id, course.id))
        .returning();

    return updatedCourse;
}

// ✅ Delete
export async function deleteAdmissionCourse(id: number) {
    const deleted = await dbPostgres
        .delete(admissionCourses)
        .where(eq(admissionCourses.id, id));

    return deleted.length > 0;
}

// ✅ Soft delete (disable)
export async function disableAdmissionCourse(id: number) {
    const [disabledCourse] = await dbPostgres
        .update(admissionCourses)
        .set({ disabled: true })
        .where(eq(admissionCourses.id, id))
        .returning();

    return disabledCourse;
}

// ✅ Enable course
export async function enableAdmissionCourse(id: number) {
    const [enabledCourse] = await dbPostgres
        .update(admissionCourses)
        .set({ disabled: false })
        .where(eq(admissionCourses.id, id))
        .returning();

    return enabledCourse;
}