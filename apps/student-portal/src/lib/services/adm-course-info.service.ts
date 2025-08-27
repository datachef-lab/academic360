import {dbPostgres} from "@/db";
import { admissionCourseApplications, AdmissionCourseApplication } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function createAdmissionCourse(givenCourse: AdmissionCourseApplication) {
    const [existingEntry] = await dbPostgres
        .select()
        .from(admissionCourseApplications)
        .where(
            and(
                eq(admissionCourseApplications.applicationFormId, givenCourse.applicationFormId),
                eq(admissionCourseApplications.admissionCourseId, givenCourse.admissionCourseId),
            )
        );

    if (existingEntry) {
        return { course: existingEntry, message: "Course already exists." };
    }

    const [newCourse] = await dbPostgres
        .insert(admissionCourseApplications)
        .values(givenCourse)
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
        .from(admissionCourseApplications)
        .where(eq(admissionCourseApplications.id, id));

    return course || null;
}

// ✅ Read by Application Form ID
export async function findAdmissionCoursesByApplicationFormId(applicationFormId: number) {
    const courses = await dbPostgres
        .select()
        .from(admissionCourseApplications)
        .where(eq(admissionCourseApplications.applicationFormId, applicationFormId));

    return courses;
}

// ✅ Update
export async function updateAdmissionCourse(course: AdmissionCourseApplication) {
    if (!course.id) return null;

    const [updatedCourse] = await dbPostgres
        .update(admissionCourseApplications)
        .set(course)
        .where(eq(admissionCourseApplications.id, course.id))
        .returning();

    return updatedCourse;
}

// ✅ Delete
export async function deleteAdmissionCourse(id: number) {
    const deleted = await dbPostgres
        .delete(admissionCourseApplications)
        .where(eq(admissionCourseApplications.id, id));

    return deleted.length > 0;
}

export async function findCourseApplicationByApplicationFormId(applicationFormId: number) {
    const results = await dbPostgres
        .select()
        .from(admissionCourseApplications)
        .where(eq(admissionCourseApplications.applicationFormId, applicationFormId));

    return results;
}