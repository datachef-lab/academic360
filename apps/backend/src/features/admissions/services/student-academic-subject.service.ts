import { db } from "@/db/index.js";
import { StudentAcademicSubjectsDto } from "@repo/db/dtos";
import {
  academicYearModel,
  paperModel,
  sessionModel,
  studentModel,
} from "@repo/db/schemas";
import {
  admissionAcademicInfoModel,
  admissionModel,
  applicationFormModel,
  boardSubjectModel,
  boardSubjectNameModel,
  studentAcademicSubjectModel,
  StudentAcademicSubjects,
} from "@repo/db/schemas/models/admissions";
import { and, eq } from "drizzle-orm";
import * as relatedSubjectService from "../../subject-selection/services/related-subject-main.service";

type StudentAcademicSubjectInsert =
  typeof studentAcademicSubjectModel.$inferInsert;

// CREATE or UPDATE
export async function createSubject(
  subject: Omit<StudentAcademicSubjectInsert, "id" | "createdAt" | "updatedAt">,
) {
  const [existingEntry] = await db
    .select()
    .from(studentAcademicSubjectModel)
    .where(
      and(
        eq(
          studentAcademicSubjectModel.admissionAcademicInfoId,
          subject.admissionAcademicInfoId,
        ),
        eq(studentAcademicSubjectModel.boardSubjectId, subject.boardSubjectId),
      ),
    );

  if (existingEntry) {
    // Update existing subject
    const [updatedSubject] = await db
      .update(studentAcademicSubjectModel)
      .set(subject)
      .where(eq(studentAcademicSubjectModel.id, existingEntry.id))
      .returning();
    return {
      subject: updatedSubject,
      message: "Subject updated successfully!",
    };
  }

  const [newSubject] = await db
    .insert(studentAcademicSubjectModel)
    .values(subject)
    .returning();

  return {
    subject: newSubject,
    message: "New Subject Created!",
  };
}

// READ by ID
export async function findSubjectById(id: number) {
  const [subject] = await db
    .select()
    .from(studentAcademicSubjectModel)
    .where(eq(studentAcademicSubjectModel.id, id));

  return subject || null;
}

// READ all for a specific academic info
export async function findSubjectsByAcademicInfoId(
  admissionAcademicInfoId: number,
): Promise<StudentAcademicSubjectsDto[]> {
  const subjects = await db
    .select()
    .from(studentAcademicSubjectModel)
    .where(
      eq(
        studentAcademicSubjectModel.admissionAcademicInfoId,
        admissionAcademicInfoId,
      ),
    );

  return await Promise.all(
    subjects.map((subject) => mapStudentAcademicSubjectToDto(subject)),
  );
}

async function mapStudentAcademicSubjectToDto(
  s: StudentAcademicSubjects,
): Promise<StudentAcademicSubjectsDto> {
  const { boardSubjectId, ...rest } = s;

  const [boardSubject] = await db
    .select()
    .from(boardSubjectModel)
    .where(eq(boardSubjectModel.id, boardSubjectId));

  const [boardSubjectName] = await db
    .select()
    .from(boardSubjectNameModel)
    .where(eq(boardSubjectNameModel.id, boardSubject?.boardSubjectNameId));

  return {
    ...rest,
    boardSubject: {
      ...boardSubject!,
      boardSubjectName: boardSubjectName!,
    },
  };
}

// UPDATE
export async function updateSubject(
  subject: Omit<StudentAcademicSubjectInsert, "createdAt" | "updatedAt">,
) {
  if (!subject.id) throw new Error("Subject ID is required for update.");

  const [updated] = await db
    .update(studentAcademicSubjectModel)
    .set(subject)
    .where(eq(studentAcademicSubjectModel.id, subject.id))
    .returning();

  return updated;
}

// DELETE
export async function deleteSubject(id: number) {
  const [deleted] = await db
    .delete(studentAcademicSubjectModel)
    .where(eq(studentAcademicSubjectModel.id, id))
    .returning();

  return deleted !== undefined;
}
