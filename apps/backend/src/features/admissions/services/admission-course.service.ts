import { db } from "@/db/index.js";
import { admissionProgramCourseModel } from "@repo/db/schemas";
import { eq } from "drizzle-orm";

type Insert = typeof admissionProgramCourseModel.$inferInsert;
type Writable = Omit<Insert, "id" | "createdAt" | "updatedAt">;

export async function findAdmissionCoursesByAdmissionId(admissionId: number) {
  return await db
    .select()
    .from(admissionProgramCourseModel)
    .where(eq(admissionProgramCourseModel.admissionId, admissionId))
    .orderBy(admissionProgramCourseModel.id);
}

export async function findAdmissionCourseById(id: number) {
  const [row] = await db
    .select()
    .from(admissionProgramCourseModel)
    .where(eq(admissionProgramCourseModel.id, id));
  return row ?? null;
}

export async function createAdmissionCourse(data: Writable) {
  const [row] = await db
    .insert(admissionProgramCourseModel)
    .values(data)
    .returning();
  return row;
}

export async function updateAdmissionCourse(
  id: number,
  data: Partial<Writable>,
) {
  const [row] = await db
    .update(admissionProgramCourseModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(admissionProgramCourseModel.id, id))
    .returning();
  return row ?? null;
}

export async function deleteAdmissionCourse(id: number) {
  const [row] = await db
    .delete(admissionProgramCourseModel)
    .where(eq(admissionProgramCourseModel.id, id))
    .returning();
  return row ?? null;
}
