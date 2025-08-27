import { dbPostgres } from "@/db";
import { academicSubjects, AcademicSubject } from "@/db/schema";
import { and, eq, ilike } from "drizzle-orm";

export async function getAllSubjects(disabled?: boolean) {
    const query = dbPostgres.select().from(academicSubjects);
    if (disabled !== undefined) {
        return query.where(eq(academicSubjects.disabled, disabled));
    }
    return query;
}

export async function getSubjectById(id: number) {
    const [subject] = await dbPostgres
        .select()
        .from(academicSubjects)
        .where(eq(academicSubjects.id, id));
    return subject || null;
}


export async function getSubjectByBoardUniversityId(boardUniversityId: number) {
    const subjects = await dbPostgres
        .select()
        .from(academicSubjects)
        .where(eq(academicSubjects.boardUniversityId, boardUniversityId));
    return subjects || null;
}

export async function createSubject(data: Omit<AcademicSubject, "id" | "createdAt" | "updatedAt">) {
    const [existingSubject] = await dbPostgres
        .select()
        .from(academicSubjects)
        .where(
            and(
                ilike(academicSubjects.name, data.name),
                eq(academicSubjects.boardUniversityId, data.boardUniversityId)
            )
        );

    if (existingSubject) {
        return { subject: existingSubject, message: "Subject already exists." };
    }

    const [newSubject] = await dbPostgres
        .insert(academicSubjects)
        .values(data)
        .returning();

    return { subject: newSubject, message: "New Subject Created!" };
}

export async function updateSubject(id: number, data: Partial<Omit<AcademicSubject, "id" | "createdAt" | "updatedAt">>) {
    const [updatedSubject] = await dbPostgres
        .update(academicSubjects)
        .set(data)
        .where(eq(academicSubjects.id, id))
        .returning();
    return updatedSubject || null;
}

export async function toggleSubjectStatus(id: number) {
    // First get the current status
    const [subject] = await dbPostgres
        .select()
        .from(academicSubjects)
        .where(eq(academicSubjects.id, id));

    if (!subject) {
        return null;
    }

    // Toggle the disabled status
    const [updatedSubject] = await dbPostgres
        .update(academicSubjects)
        .set({ disabled: !subject.disabled })
        .where(eq(academicSubjects.id, id))
        .returning();

    return {
        subject: updatedSubject,
        message: updatedSubject?.disabled 
            ? "Subject disabled successfully" 
            : "Subject enabled successfully"
    };
}
