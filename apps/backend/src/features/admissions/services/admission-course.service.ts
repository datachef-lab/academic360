import { db } from "@/db/index.js";
import { admissionCourseModel, AdmissionCourse } from "../models/admission-course.model.js";
import { courseModel } from "@/features/academics/models/course.model.js";
import { admissionModel } from "../models/admission.model.js";
import { and, eq } from "drizzle-orm";
import { academicYearModel } from "@/features/academics/models/academic-year.model.js";

// CREATE
export async function createAdmissionCourse(givenAdmCourse: AdmissionCourse) {
    const [existingEntry] = await db
        .select()
        .from(admissionCourseModel)
        .where(
            and(
                eq(admissionCourseModel.admissionId, givenAdmCourse.admissionId),
                eq(admissionCourseModel.courseId, givenAdmCourse.courseId),
            )
        );

    if (existingEntry) {
        return { course: existingEntry, message: "Admission course already exists." };
    }

    const [newCourse] = await db
        .insert(admissionCourseModel)
        .values(givenAdmCourse)
        .returning();

    return {
        course: newCourse,
        message: "New Admission Course Created!"
    };
}

// READ by ID
export async function findAdmissionCourseById(id: number) {
    const [course] = await db
        .select()
        .from(admissionCourseModel)
        .where(eq(admissionCourseModel.id, id));

    return course || null;
}

// READ by ID with course and admission details
export async function findAdmissionCourseByIdWithDetails(id: number) {
    const [course] = await db
        .select({
            id: admissionCourseModel.id,
            admissionId: admissionCourseModel.admissionId,
            courseId: admissionCourseModel.courseId,
            disabled: admissionCourseModel.disabled,
            createdAt: admissionCourseModel.createdAt,
            updatedAt: admissionCourseModel.updatedAt,
            remarks: admissionCourseModel.remarks,
            course: {
                id: courseModel.id,
                name: courseModel.name,
                shortName: courseModel.shortName,
                codePrefix: courseModel.codePrefix,
                universityCode: courseModel.universityCode
            },
            admission: {
                id: admissionModel.id,
                year: academicYearModel.year,
                isClosed: admissionModel.isClosed,
                startDate: admissionModel.startDate,
                lastDate: admissionModel.lastDate,
                isArchived: admissionModel.isArchived
            }
        })
        .from(admissionCourseModel)
        .leftJoin(courseModel, eq(admissionCourseModel.courseId, courseModel.id))
        .leftJoin(admissionModel, eq(admissionCourseModel.admissionId, admissionModel.id))
        .leftJoin(admissionModel, eq(academicYearModel.id, admissionModel.academicYearId))
        .where(eq(admissionCourseModel.id, id));

    return course || null;
}

// READ by Admission ID
export async function findAdmissionCoursesByAdmissionId(admissionId: number) {
    const admissionCoursesList = await db
        .select()
        .from(admissionCourseModel)
        .where(eq(admissionCourseModel.admissionId, admissionId));

    return admissionCoursesList;
}

// READ by Admission ID with course details
export async function findAdmissionCoursesByAdmissionIdWithDetails(admissionId: number) {
    const admissionCoursesList = await db
        .select({
            id: admissionCourseModel.id,
            admissionId: admissionCourseModel.admissionId,
            courseId: admissionCourseModel.courseId,
            disabled: admissionCourseModel.disabled,
            createdAt: admissionCourseModel.createdAt,
            updatedAt: admissionCourseModel.updatedAt,
            remarks: admissionCourseModel.remarks,
            course: {
                id: courseModel.id,
                name: courseModel.name,
                shortName: courseModel.shortName,
                codePrefix: courseModel.codePrefix,
                universityCode: courseModel.universityCode
            }
        })
        .from(admissionCourseModel)
        .leftJoin(courseModel, eq(admissionCourseModel.courseId, courseModel.id))
        .where(eq(admissionCourseModel.admissionId, admissionId));

    return admissionCoursesList;
}

// READ by Course ID
export async function findAdmissionCoursesByCourseId(courseId: number) {
    const admissionCoursesList = await db
        .select()
        .from(admissionCourseModel)
        .where(eq(admissionCourseModel.courseId, courseId));

    return admissionCoursesList;
}

// READ by Course ID with admission details
export async function findAdmissionCoursesByCourseIdWithDetails(courseId: number) {
    const admissionCoursesList = await db
        .select({
            id: admissionCourseModel.id,
            admissionId: admissionCourseModel.admissionId,
            courseId: admissionCourseModel.courseId,
            disabled: admissionCourseModel.disabled,
            createdAt: admissionCourseModel.createdAt,
            updatedAt: admissionCourseModel.updatedAt,
            remarks: admissionCourseModel.remarks,
            admission: {
                id: admissionModel.id,
                year: academicYearModel.year,
                isClosed: admissionModel.isClosed,
                startDate: admissionModel.startDate,
                lastDate: admissionModel.lastDate,
                isArchived: admissionModel.isArchived
            }
        })
        .from(admissionCourseModel)
        .leftJoin(admissionModel, eq(admissionCourseModel.admissionId, admissionModel.id))
        .leftJoin(admissionModel, eq(academicYearModel.id, admissionModel.academicYearId))
        .where(eq(admissionCourseModel.courseId, courseId));

    return admissionCoursesList;
}

// READ all active courses
export async function findAllActiveAdmissionCourses() {
    const admissionCoursesList = await db
        .select()
        .from(admissionCourseModel)
        .where(eq(admissionCourseModel.disabled, false));

    return admissionCoursesList;
}

// READ all active courses with details
export async function findAllActiveAdmissionCoursesWithDetails() {
    const admissionCoursesList = await db
        .select({
            id: admissionCourseModel.id,
            admissionId: admissionCourseModel.admissionId,
            courseId: admissionCourseModel.courseId,
            disabled: admissionCourseModel.disabled,
            createdAt: admissionCourseModel.createdAt,
            updatedAt: admissionCourseModel.updatedAt,
            remarks: admissionCourseModel.remarks,
            course: {
                id: courseModel.id,
                name: courseModel.name,
                shortName: courseModel.shortName,
                codePrefix: courseModel.codePrefix,
                universityCode: courseModel.universityCode
            },
            admission: {
                id: admissionModel.id,
                year: academicYearModel.year,
                isClosed: admissionModel.isClosed,
                startDate: admissionModel.startDate,
                lastDate: admissionModel.lastDate,
                isArchived: admissionModel.isArchived
            }
        })
        .from(admissionCourseModel)
        .leftJoin(courseModel, eq(admissionCourseModel.courseId, courseModel.id))
        .leftJoin(admissionModel, eq(academicYearModel.id, admissionModel.academicYearId))
        .leftJoin(admissionModel, eq(admissionCourseModel.admissionId, admissionModel.id))
        .where(eq(admissionCourseModel.disabled, false));

    return admissionCoursesList;
}

// READ all courses
export async function findAllAdmissionCourses() {
    const admissionCoursesList = await db
        .select()
        .from(admissionCourseModel);

    return admissionCoursesList;
}

// READ all courses with details
export async function findAllAdmissionCoursesWithDetails() {
    const admissionCoursesList = await db
        .select({
            id: admissionCourseModel.id,
            admissionId: admissionCourseModel.admissionId,
            courseId: admissionCourseModel.courseId,
            disabled: admissionCourseModel.disabled,
            createdAt: admissionCourseModel.createdAt,
            updatedAt: admissionCourseModel.updatedAt,
            remarks: admissionCourseModel.remarks,
            course: {
                id: courseModel.id,
                name: courseModel.name,
                shortName: courseModel.shortName,
                codePrefix: courseModel.codePrefix,
                universityCode: courseModel.universityCode
            },
            admission: {
                id: admissionModel.id,
                year: academicYearModel.year,
                isClosed: admissionModel.isClosed,
                startDate: admissionModel.startDate,
                lastDate: admissionModel.lastDate,
                isArchived: admissionModel.isArchived
            }
        })
        .from(admissionCourseModel)
        .leftJoin(courseModel, eq(admissionCourseModel.courseId, courseModel.id))
        .leftJoin(admissionModel, eq(academicYearModel.id, admissionModel.academicYearId))
        .leftJoin(admissionModel, eq(admissionCourseModel.admissionId, admissionModel.id));

    return admissionCoursesList;
}

// UPDATE
export async function updateAdmissionCourse(course: AdmissionCourse) {
    if (!course.id) return null;

    const [updatedCourse] = await db
        .update(admissionCourseModel)
        .set(course)
        .where(eq(admissionCourseModel.id, course.id))
        .returning();

    return updatedCourse;
}

// DELETE
export async function deleteAdmissionCourse(id: number) {
    const deleted = await db
        .delete(admissionCourseModel)
        .where(eq(admissionCourseModel.id, id))
        .returning();

    return deleted.length > 0;
}

// SOFT DELETE (disable)
export async function disableAdmissionCourse(id: number) {
    const [disabledCourse] = await db
        .update(admissionCourseModel)
        .set({ disabled: true })
        .where(eq(admissionCourseModel.id, id))
        .returning();

    return disabledCourse;
}

// ENABLE COURSE
export async function enableAdmissionCourse(id: number) {
    const [enabledCourse] = await db
        .update(admissionCourseModel)
        .set({ disabled: false })
        .where(eq(admissionCourseModel.id, id))
        .returning();

    return enabledCourse;
}
