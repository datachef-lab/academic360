import { AcademicIdentifierType } from "@/types/user/academic-identifier.js";
import { AcademicIdentifier, academicIdentifierModel, createAcademicIdentifierSchema } from "../models/academicIdentifier.model.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { Shift } from "@/features/academics/models/shift.model.js";
import { getShiftById } from "@/features/academics/services/shift.service.js";
import { Section } from "@/features/academics/models/section.model.js";
import { findSectionById } from "@/features/academics/services/section.service.js";
import { z } from "zod";

// Validate input using Zod schema
function validateAcademicIdentifierInput(data: Omit<AcademicIdentifierType, 'id'>) {
    const parseResult = createAcademicIdentifierSchema.safeParse(data);
    if (!parseResult.success) {
        const error = new Error("Validation failed: " + JSON.stringify(parseResult.error.issues));
        // @ts-expect-error
        error.status = 400;
        throw error;
    }
    return parseResult.data;
}

export async function addAcademicIdentifier(academicIdentifier: AcademicIdentifierType): Promise<AcademicIdentifierType | null> {
    // Remove id, but keep shift and section for validation
    const { id, ...dataToValidate } = academicIdentifier;
    validateAcademicIdentifierInput(dataToValidate);
    // Now destructure for DB insert
    const { section, shift, ...props } = dataToValidate;
    const [newAcademicIdentifier] = await db.insert(academicIdentifierModel).values({ ...props }).returning();
    const formattedAcademiIdentifier = await academicIdentifierResponseFormat(newAcademicIdentifier);
    return formattedAcademiIdentifier;
}

export async function findAcademicIdentifierById(id: number): Promise<AcademicIdentifierType | null> {
    const [foundAcademicIdentifier] = await db.select().from(academicIdentifierModel).where(eq(academicIdentifierModel.id, id));
    if (!foundAcademicIdentifier) return null;
    const formattedAcademiIdentifier = await academicIdentifierResponseFormat(foundAcademicIdentifier);
    return formattedAcademiIdentifier;
}

export async function findAcademicIdentifierByStudentId(studentId: number): Promise<AcademicIdentifierType | null> {
    const [foundAcademicIdentifier] = await db.select().from(academicIdentifierModel).where(eq(academicIdentifierModel.studentId, studentId));
    if (!foundAcademicIdentifier) return null;
    const formattedAcademiIdentifier = await academicIdentifierResponseFormat(foundAcademicIdentifier);
    return formattedAcademiIdentifier;
}

export async function saveAcademicIdentifier(id: number, academicIdentifier: AcademicIdentifierType): Promise<AcademicIdentifierType | null> {
    // Remove id, but keep shift and section for validation
    const { id: _id, ...dataToValidate } = academicIdentifier;
    validateAcademicIdentifierInput(dataToValidate);
    // Now destructure for DB update
    const { studentId, createdAt, updatedAt, section, shift, ...props } = dataToValidate;
    const [foundAcademicIdentifier] = await db.select().from(academicIdentifierModel).where(eq(academicIdentifierModel.id, id));
    if (!foundAcademicIdentifier) {
        return null;
    }
    const [updatedAcademicIdentifier] = await db.update(academicIdentifierModel).set({ ...props }).where(eq(academicIdentifierModel.id, id)).returning();
    const formatedAcademicIdentifier = await academicIdentifierResponseFormat(updatedAcademicIdentifier);
    return formatedAcademicIdentifier;
}

export async function removeAcademicIdentifier(id: number): Promise<boolean | null> {
    const [foundAcademicIdentifier] = await db.select().from(academicIdentifierModel).where(eq(academicIdentifierModel.id, id));
    if (!foundAcademicIdentifier) {
        return null; // No Content
    }
    const [deletedAcademicIdentifer] = await db.delete(academicIdentifierModel).where(eq(academicIdentifierModel.id, id)).returning();
    if (!deletedAcademicIdentifer) {
        return false; // Failure!
    }
    return true; // Success!
}

export async function removeAcademicIdentifierByStudentId(studentId: number): Promise<boolean | null> {
    const [foundAcademicIdentifier] = await db.select().from(academicIdentifierModel).where(eq(academicIdentifierModel.studentId, studentId));
    if (!foundAcademicIdentifier) {
        return null; // No Content
    }
    const [deletedAcademicIdentifer] = await db.delete(academicIdentifierModel).where(eq(academicIdentifierModel.studentId, studentId)).returning();
    if (!deletedAcademicIdentifer) {
        return false; // Failure!
    }
    return true; // Success!
}

export async function getAllAcademicIdentifiers(): Promise<AcademicIdentifier[]> {
    const identifiers = await db.select().from(academicIdentifierModel);
    return identifiers;
}

export async function academicIdentifierResponseFormat(academicIdentifier: AcademicIdentifier): Promise<AcademicIdentifierType | null> {
    if (!academicIdentifier) {
        return null;
    }
    const { shiftId, sectionId, ...props } = academicIdentifier;
    let shift: Shift | null = null;
    if (shiftId) {
        shift = await getShiftById(shiftId as number);
    }
    let section: Section | null = null;
    if (sectionId) {
        section = await findSectionById(sectionId as number);
    }
    const formattedAcademiIdentifier: AcademicIdentifierType = {
        ...props,
        section,
        shift
    };
    return formattedAcademiIdentifier;
}