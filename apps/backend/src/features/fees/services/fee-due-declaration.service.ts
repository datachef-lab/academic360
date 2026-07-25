import { and, eq } from "drizzle-orm";

import { db } from "@/db/index.js";
import {
  studentFeeDueDeclarationModel,
  type StudentFeeDueDeclarationT,
} from "@repo/db/schemas";

/**
 * Pending-fees declaration made once per (student, semesterLabel) on the exam
 * screen. Existence of a row = the student has already declared; the dialog is
 * not shown again for that dues context.
 */
export async function findFeeDueDeclaration(
  studentId: number,
  semesterLabel: string,
): Promise<StudentFeeDueDeclarationT | null> {
  const [row] = await db
    .select()
    .from(studentFeeDueDeclarationModel)
    .where(
      and(
        eq(studentFeeDueDeclarationModel.studentId, studentId),
        eq(studentFeeDueDeclarationModel.semesterLabel, semesterLabel),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function createFeeDueDeclaration(input: {
  studentId: number;
  semesterLabel: string;
  undertakingClearDate: string; // yyyy-mm-dd
}): Promise<StudentFeeDueDeclarationT> {
  // Idempotent: re-declaring the same context returns the existing row
  // (unique (student, semesterLabel)); the first declaration wins.
  const existing = await findFeeDueDeclaration(
    input.studentId,
    input.semesterLabel,
  );
  if (existing) return existing;
  const [row] = await db
    .insert(studentFeeDueDeclarationModel)
    .values({
      studentId: input.studentId,
      semesterLabel: input.semesterLabel,
      undertakingClearDate: input.undertakingClearDate,
    })
    .onConflictDoNothing()
    .returning();
  if (row) return row;
  // conflict raced: fetch the winner
  return (await findFeeDueDeclaration(
    input.studentId,
    input.semesterLabel,
  )) as StudentFeeDueDeclarationT;
}
