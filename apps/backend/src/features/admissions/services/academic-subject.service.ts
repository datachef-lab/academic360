import { db } from "@/db/index.js";
import { academicSubjectModel, AcademicSubject } from "../models/academic-subject.model.js";
import { and, eq, ilike } from "drizzle-orm";

// Get all subjects, optionally filter by disabled status
export async function getAllSubjects(disabled?: boolean): Promise<AcademicSubject[]> {
    const whereConditions = [];
    if (disabled !== undefined) {
        whereConditions.push(eq(academicSubjectModel.disabled, disabled));
    }

    let query = await db
        .select()
        .from(academicSubjectModel)
        .where(and(...whereConditions));
    return await query;
}

// Get a subject by its ID
export async function getSubjectById(id: number) {
    const [subject] = await db
        .select()
        .from(academicSubjectModel)
        .where(eq(academicSubjectModel.id, id));
    return subject || null;
}

// Get all subjects for a specific board/university
export async function getSubjectByBoardUniversityId(boardUniversityId: number) {
    const subjects = await db
        .select()
        .from(academicSubjectModel)
        .where(eq(academicSubjectModel.boardUniversityId, boardUniversityId));
    return subjects;
}

// Create a new subject, checking for duplicates
export async function createSubject(data: Omit<AcademicSubject, "id" | "createdAt" | "updatedAt">) {
    const [existingSubject] = await db
        .select()
        .from(academicSubjectModel)
        .where(
            and(
                ilike(academicSubjectModel.name, data.name),
                eq(academicSubjectModel.boardUniversityId, data.boardUniversityId)
            )
        );

    if (existingSubject) {
        return { subject: existingSubject, message: "Subject already exists." };
    }

    const [newSubject] = await db
        .insert(academicSubjectModel)
        .values(data)
        .returning();

    return { subject: newSubject, message: "New Subject Created!" };
}

// Update a subject by ID
export async function updateSubject(id: number, data: Partial<Omit<AcademicSubject, "id" | "createdAt" | "updatedAt">>) {
    const [updatedSubject] = await db
        .update(academicSubjectModel)
        .set(data)
        .where(eq(academicSubjectModel.id, id))
        .returning();
    return updatedSubject || null;
}

// Toggle the disabled status of a subject
export async function toggleSubjectStatus(id: number) {
    const [subject] = await db
        .select()
        .from(academicSubjectModel)
        .where(eq(academicSubjectModel.id, id));

    if (!subject) {
        return null;
    }

    const [updatedSubject] = await db
        .update(academicSubjectModel)
        .set({ disabled: !subject.disabled })
        .where(eq(academicSubjectModel.id, id))
        .returning();

    return {
        subject: updatedSubject,
        message: updatedSubject?.disabled
            ? "Subject disabled successfully"
            : "Subject enabled successfully"
    };
}
