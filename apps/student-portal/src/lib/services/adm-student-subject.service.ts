import {dbPostgres} from "@/db"
import { studentAcademicSubjects, StudentAcademicSubject } from "@/db/schema"
import { and, eq } from "drizzle-orm"

export async function createSubject(subject: Omit<StudentAcademicSubject, "id" | "createdAt" | "updatedAt">) {
    // Remove any createdAt/updatedAt fields and set updatedAt to now
    // delete (subject as any).createdAt;
    // delete (subject as any).updatedAt;
    // (subject as any).updatedAt = new Date().toISOString();
    const [existingEntry] = await dbPostgres
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
        const [updatedSubject] = await dbPostgres
            .update(studentAcademicSubjects)
            .set(subject)
            .where(eq(studentAcademicSubjects.id, existingEntry.id))
            .returning();
        
        return {
            subject: updatedSubject,
            message: "Subject updated successfully!"
        };
    }

    const [newSubject] = await dbPostgres
        .insert(studentAcademicSubjects)
        .values(subject)
        .returning();

    return {
        subject: newSubject,
        message: "New Subject Created!"
    }
}

export async function findSubjectById(id: number) {
    const [subject] = await dbPostgres
        .select()
        .from(studentAcademicSubjects)
        .where(eq(studentAcademicSubjects.id, id));

    return subject || null;
}

// Read all for a specific academic info
export async function findSubjectsByAcademicInfoId(admissionAcademicInfoId: number) {
    const subjects = await dbPostgres
        .select()
        .from(studentAcademicSubjects)
        .where(eq(studentAcademicSubjects.admissionAcademicInfoId, admissionAcademicInfoId));

    return subjects;
}

export async function updateSubject(subject: Omit<StudentAcademicSubject, "createdAt" | "updatedAt">) {
    if (!subject.id) throw new Error("Subject ID is required for update.");

    const [updated] = await dbPostgres
        .update(studentAcademicSubjects)
        .set(subject)
        .where(eq(studentAcademicSubjects.id, subject.id))
        .returning();

    return updated;
}

// Delete
export async function deleteSubject(id: number) {
    const [deleted] = await dbPostgres
        .delete(studentAcademicSubjects)
        .where(eq(studentAcademicSubjects.id, id))
        .returning();

    return deleted !== undefined;
}