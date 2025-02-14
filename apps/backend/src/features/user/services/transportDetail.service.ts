import { db } from "@/db/index.js";
import { transportDetailsModel } from "../models/transportDetails.model.js";
import { eq } from "drizzle-orm";

export async function removeTransportDetails(id: number): Promise<boolean | null> {
    // Return if the transport-detail doesn't exist
    const [foundTransportDetail] = await db.select().from(transportDetailsModel).where(eq(transportDetailsModel.id, id));
    if (!foundTransportDetail) {
        return null; // No Content
    }
    // Delete the transport-detail
    const [deletedTransportDetail] = await db.delete(transportDetailsModel).where(eq(transportDetailsModel.id, id)).returning();
    if (!deletedTransportDetail) {
        return false; // Failure!
    }

    return true; // Success!
}

export async function removeTransportDetailsByStudentId(studentId: number): Promise<boolean | null> {
    // Return if the transport-detail doesn't exist
    const [foundTransportDetail] = await db.select().from(transportDetailsModel).where(eq(transportDetailsModel.studentId, studentId));
    if (!foundTransportDetail) {
        return null; // No Content
    }
    // Delete the transport-detail
    const [deletedTransportDetail] = await db.delete(transportDetailsModel).where(eq(transportDetailsModel.studentId, studentId)).returning();
    if (!deletedTransportDetail) {
        return false; // Failure!
    }

    return true; // Success!
}