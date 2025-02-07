import { AcademicIdentifierType } from "@/types/user/academic-identifier";
import { AcademicIdentifier, academicIdentifierModel } from "../models/academicIdentifier.model";
import { findStreamById } from "@/features/academics/services/stream.service";
import { db } from "@/db/index";
import { eq } from "drizzle-orm";

export async function findAcademicIdentifierById(id: number): Promise<AcademicIdentifierType | null> {
    // Return if the academic-identifier doesn't exist
    const [foundAcademicIdentifier] = await db.select().from(academicIdentifierModel).where(eq(academicIdentifierModel.id, id));

    const formattedAcademiIdentifier = await academicIdentifierResponseFormat(foundAcademicIdentifier);

    return formattedAcademiIdentifier;
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

    const { streamId, ...props } = academicIdentifier;

    const formattedAcademiIdentifier: AcademicIdentifierType = { ...props };

    if (streamId) {
        formattedAcademiIdentifier.stream = await findStreamById(streamId);
    }

    return formattedAcademiIdentifier;
}