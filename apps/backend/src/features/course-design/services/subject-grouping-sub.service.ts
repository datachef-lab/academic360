import { db } from "@/db/index.js";
import {
  SubjectGroupingSubject,
  subjectGroupingSubjectModel,
} from "@repo/db/schemas/models/course-design";
import { eq } from "drizzle-orm";

export type SubjectGroupingSubjectData = SubjectGroupingSubject;

export async function createSubjectGroupingSubject(
  data: SubjectGroupingSubjectData,
) {
  const { id, createdAt, updatedAt, ...values } = data;
  const [created] = await db
    .insert(subjectGroupingSubjectModel)
    .values(values)
    .returning();
  return created ?? null;
}

export async function getAllSubjectGroupingSubjects() {
  return db.select().from(subjectGroupingSubjectModel);
}

export async function getSubjectGroupingSubjectById(id: number) {
  const rows = await db
    .select()
    .from(subjectGroupingSubjectModel)
    .where(eq(subjectGroupingSubjectModel.id, id));
  return rows[0] ?? null;
}

export async function updateSubjectGroupingSubject(
  id: number,
  data: SubjectGroupingSubjectData,
) {
  const { id: _id, createdAt, updatedAt, ...values } = data;
  const [updated] = await db
    .update(subjectGroupingSubjectModel)
    .set(values)
    .where(eq(subjectGroupingSubjectModel.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteSubjectGroupingSubject(id: number) {
  const [deleted] = await db
    .delete(subjectGroupingSubjectModel)
    .where(eq(subjectGroupingSubjectModel.id, id))
    .returning();
  return deleted ?? null;
}
