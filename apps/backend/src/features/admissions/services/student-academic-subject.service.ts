import { db } from "@/db/index.js";
import { studentAcademicSubjects, StudentAcademicSubjects } from "../models/student-academic-subject.model.js";
import { and, eq } from "drizzle-orm";
type StudentAcademicSubjectInsert = typeof studentAcademicSubjects.$inferInsert;

// CREATE or UPDATE
export async function createSubject(subject: Omit<StudentAcademicSubjectInsert, "id" | "createdAt" | "updatedAt">) {
    const [existingEntry] = await db
        .select()
        .from(studentAcademicSubjects)
        .where(
            and(
                eq(studentAcademicSubjects.admissionAcademicInfoId, subject.admissionAcademicInfoId),
                eq(studentAcademicSubjects.academicSubjectId, subject.academicSubjectId),
            )
        );

    if (existingEntry) {
        // Update existing subject
        const [updatedSubject] = await db
            .update(studentAcademicSubjects)
            .set(subject)
            .where(eq(studentAcademicSubjects.id, existingEntry.id))
            .returning();
        return {
            subject: updatedSubject,
            message: "Subject updated successfully!"
        };
    }

    const [newSubject] = await db
        .insert(studentAcademicSubjects)
        .values(subject)
        .returning();

    return {
        subject: newSubject,
        message: "New Subject Created!"
    }
}

// READ by ID
export async function findSubjectById(id: number) {
    const [subject] = await db
        .select()
        .from(studentAcademicSubjects)
        .where(eq(studentAcademicSubjects.id, id));

    return subject || null;
}

// READ all for a specific academic info
export async function findSubjectsByAcademicInfoId(admissionAcademicInfoId: number) {
    const subjects = await db
        .select()
        .from(studentAcademicSubjects)
        .where(eq(studentAcademicSubjects.admissionAcademicInfoId, admissionAcademicInfoId));

    return subjects;
}

// UPDATE
export async function updateSubject(subject: Omit<StudentAcademicSubjectInsert, "createdAt" | "updatedAt">) {
    if (!subject.id) throw new Error("Subject ID is required for update.");

    const [updated] = await db
        .update(studentAcademicSubjects)
        .set(subject)
        .where(eq(studentAcademicSubjects.id, subject.id))
        .returning();

    return updated;
}

// DELETE
export async function deleteSubject(id: number) {
    const [deleted] = await db
        .delete(studentAcademicSubjects)
        .where(eq(studentAcademicSubjects.id, id))
        .returning();

    return deleted !== undefined;
}
