import { db } from "@/db/index.js";
import { transportDetailsModel, createTransportDetailsSchema, TransportDetails } from "@repo/db/schemas/models/user";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Validate input using Zod schema
function validateTransportDetailsInput(data: Omit<TransportDetails, 'id'>) {
    const parseResult = createTransportDetailsSchema.safeParse(data);
    if (!parseResult.success) {
        const error = new Error("Validation failed: " + JSON.stringify(parseResult.error.issues));
        // @ts-expect-error
        error.status = 400;
        throw error;
    }
    return parseResult.data;
}

export async function addTransportDetails(transportDetails: TransportDetails): Promise<TransportDetails | null> {
    const { id, ...dataToValidate } = transportDetails;
    validateTransportDetailsInput(dataToValidate);
    const [newTransportDetails] = await db.insert(transportDetailsModel).values(dataToValidate).returning();
    return newTransportDetails;
}

export async function findTransportDetailsById(id: number): Promise<TransportDetails | null> {
    const [foundTransportDetail] = await db.select().from(transportDetailsModel).where(eq(transportDetailsModel.id, id));
    return foundTransportDetail || null;
}

export async function findTransportDetailsByStudentId(studentId: number): Promise<TransportDetails | null> {
    // const [foundTransportDetail] = await db.select().from(transportDetailsModel).where(eq(transportDetailsModel.studentId, studentId));
    return null;
}

export async function updateTransportDetails(id: number, transportDetails: TransportDetails): Promise<TransportDetails | null> {
    const { id: _id, ...dataToValidate } = transportDetails;
    validateTransportDetailsInput(dataToValidate);
    const [foundTransportDetail] = await db.select().from(transportDetailsModel).where(eq(transportDetailsModel.id, id));
    if (!foundTransportDetail) {
        return null;
    }
    const [updatedTransportDetail] = await db.update(transportDetailsModel).set(dataToValidate).where(eq(transportDetailsModel.id, id)).returning();
    return updatedTransportDetail || null;
}

export async function removeTransportDetails(id: number): Promise<boolean | null> {
    const [foundTransportDetail] = await db.select().from(transportDetailsModel).where(eq(transportDetailsModel.id, id));
    if (!foundTransportDetail) {
        return null; // No Content
    }
    const [deletedTransportDetail] = await db.delete(transportDetailsModel).where(eq(transportDetailsModel.id, id)).returning();
    if (!deletedTransportDetail) {
        return false; // Failure!
    }
    return true;
}

export async function removeTransportDetailsByStudentId(studentId: number): Promise<boolean | null> {
    // const [foundTransportDetail] = await db.select().from(transportDetailsModel).where(eq(transportDetailsModel.studentId, studentId));
    // if (!foundTransportDetail) {
    //     return null; // No Content
    // }
    // const [deletedTransportDetail] = await db.delete(transportDetailsModel).where(eq(transportDetailsModel.studentId, studentId)).returning();
    // if (!deletedTransportDetail) {
    //     return false; // Failure!
    // }
    return false; // Success!
}

export async function getAllTransportDetails(): Promise<TransportDetails[]> {
    const details = await db.select().from(transportDetailsModel);
    return details;
}