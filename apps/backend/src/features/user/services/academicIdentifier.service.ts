import { AcademicIdentifierType } from "@/types/user/academic-identifier.js";
import { AcademicIdentifier, academicIdentifierModel } from "../models/academicIdentifier.model.js";
// import { findStreamById } from "@/features/academics/services/stream.service.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { Shift } from "@/features/academics/models/shift.model.js";
import { getShiftById } from "@/features/academics/services/shift.service.js";
// import { StreamType } from "@/types/academics/stream.js";
import { Section } from "@/features/academics/models/section.model.js";
import { findSectionById } from "@/features/academics/services/section.service.js";

export async function addAcademicIdentifier(academicIdentifier: AcademicIdentifierType): Promise<AcademicIdentifierType | null> {
    const { section, shift, ...props } = academicIdentifier;

    const [newAcademicIdentifier] = await db.insert(academicIdentifierModel).values({ ...props }).returning();

    const formattedAcademiIdentifier = await academicIdentifierResponseFormat(newAcademicIdentifier);

    return formattedAcademiIdentifier;
}

export async function findAcademicIdentifierById(id: number): Promise<AcademicIdentifierType | null> {
    // Return if the academic-identifier doesn't exist
    const [foundAcademicIdentifier] = await db.select().from(academicIdentifierModel).where(eq(academicIdentifierModel.id, id));

    const formattedAcademiIdentifier = await academicIdentifierResponseFormat(foundAcademicIdentifier);

    return formattedAcademiIdentifier;
}

export async function findAcademicIdentifierByStudentId(studentId: number): Promise<AcademicIdentifierType | null> {
    // Return if the academic-identifier doesn't exist
    const [foundAcademicIdentifier] = await db.select().from(academicIdentifierModel).where(eq(academicIdentifierModel.studentId, studentId));

    const formattedAcademiIdentifier = await academicIdentifierResponseFormat(foundAcademicIdentifier);

    return formattedAcademiIdentifier;
}

export async function saveAcademicIdentifier(id: number, academicIdentifier: AcademicIdentifierType): Promise<AcademicIdentifierType | null> {
    const { studentId, createdAt,updatedAt, id: academicIdentifierId, ...props } = academicIdentifier;

    const [foundAcademicIdentifier] = await db.select().from(academicIdentifierModel).where(eq(academicIdentifierModel.id, id));
    if (!foundAcademicIdentifier) {
        return null;
    }

    const [updatedAcademicIdentifier] = await db.update(academicIdentifierModel).set({ ...props }).where(eq(academicIdentifierModel.id, id)).returning();

    const formatedAcademicIdentifier = await academicIdentifierResponseFormat(updatedAcademicIdentifier);

    return formatedAcademicIdentifier;
}

export async function removeAcademicIdentifier(id: number): Promise<boolean | null> {
    // Return if the academic-identifier doesn't exist
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
    // Return if the academic-identifier doesn't exist
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