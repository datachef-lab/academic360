import { db } from "@/db/index.js";
import {
  admissionCourseApplication,
  AdmissionCourseApplication,
} from "../models/admission-course-application.model.js";
import { and, eq } from "drizzle-orm";

// CREATE
export async function createAdmissionCourse(
  givenCourse: AdmissionCourseApplication,
) {
  const [existingEntry] = await db
    .select()
    .from(admissionCourseApplication)
    .where(
      and(
        eq(
          admissionCourseApplication.applicationFormId,
          givenCourse.applicationFormId,
        ),
        eq(
          admissionCourseApplication.admissionCourseId,
          givenCourse.admissionCourseId,
        ),
      ),
    );

  if (existingEntry) {
    return { course: existingEntry, message: "Course already exists." };
  }

  const [newCourse] = await db
    .insert(admissionCourseApplication)
    .values(givenCourse)
    .returning();

  return {
    course: newCourse,
    message: "New Admission Course Created!",
  };
}

// READ by ID
export async function findAdmissionCourseById(id: number) {
  const [course] = await db
    .select()
    .from(admissionCourseApplication)
    .where(eq(admissionCourseApplication.id, id));

  return course || null;
}

// READ by Application Form ID
export async function findAdmissionCoursesByApplicationFormId(
  applicationFormId: number,
) {
  const courses = await db
    .select()
    .from(admissionCourseApplication)
    .where(eq(admissionCourseApplication.applicationFormId, applicationFormId));

  return courses;
}

// UPDATE
export async function updateAdmissionCourse(
  course: AdmissionCourseApplication,
) {
  if (!course.id) return null;

  const [updatedCourse] = await db
    .update(admissionCourseApplication)
    .set(course)
    .where(eq(admissionCourseApplication.id, course.id))
    .returning();

  return updatedCourse;
}

// DELETE
export async function deleteAdmissionCourse(id: number) {
  const deleted = await db
    .delete(admissionCourseApplication)
    .where(eq(admissionCourseApplication.id, id))
    .returning();

  return deleted.length > 0;
}

export async function findCourseApplicationByApplicationFormId(
  applicationFormId: number,
) {
  const results = await db
    .select()
    .from(admissionCourseApplication)
    .where(eq(admissionCourseApplication.applicationFormId, applicationFormId));

  return results;
}
