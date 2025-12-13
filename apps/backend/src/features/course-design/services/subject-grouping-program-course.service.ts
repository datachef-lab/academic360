import { db } from "@/db/index.js";
import {
  SubjectGroupingProgramCourse,
  subjectGroupingProgramCourseModel,
} from "@repo/db/schemas/models/course-design";
import { eq } from "drizzle-orm";

export type SubjectGroupingProgramCourseData = SubjectGroupingProgramCourse;

export async function createSubjectGroupingProgramCourse(
  data: SubjectGroupingProgramCourseData,
) {
  const { id, createdAt, updatedAt, ...values } = data;
  const [created] = await db
    .insert(subjectGroupingProgramCourseModel)
    .values(values)
    .returning();
  return created ?? null;
}

export async function getAllSubjectGroupingProgramCourses() {
  return db.select().from(subjectGroupingProgramCourseModel);
}

export async function getSubjectGroupingProgramCourseById(id: number) {
  const rows = await db
    .select()
    .from(subjectGroupingProgramCourseModel)
    .where(eq(subjectGroupingProgramCourseModel.id, id));
  return rows[0] ?? null;
}

export async function updateSubjectGroupingProgramCourse(
  id: number,
  data: SubjectGroupingProgramCourseData,
) {
  const { id: _id, createdAt, updatedAt, ...values } = data;
  const [updated] = await db
    .update(subjectGroupingProgramCourseModel)
    .set(values)
    .where(eq(subjectGroupingProgramCourseModel.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteSubjectGroupingProgramCourse(id: number) {
  const [deleted] = await db
    .delete(subjectGroupingProgramCourseModel)
    .where(eq(subjectGroupingProgramCourseModel.id, id))
    .returning();
  return deleted ?? null;
}
