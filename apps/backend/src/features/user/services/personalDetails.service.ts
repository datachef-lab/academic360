import { db } from "@/db/index";
import { personalDetailsModel } from "../models/personalDetails.model";
import { eq } from "drizzle-orm";

export async function removePersonalDetails(id: number): Promise<boolean | null> {
    // Return if the transport-detail doesn't exist
    const [foundPersonalDetail] = await db.select().from(personalDetailsModel).where(eq(personalDetailsModel.id, id));
    if (!foundPersonalDetail) {
        return null; // No Content
    }
    // Delete the transport-detail
    const [deletedTransportDetail] = await db.delete(personalDetailsModel).where(eq(personalDetailsModel.id, id)).returning();
    if (!deletedTransportDetail) {
        return false; // Failure!
    }

    return true; // Success!
}

export async function removePersonalDetailsByStudentId(studentId: number): Promise<boolean | null> {
    // Return if the personal-detail doesn't exist
    const [foundPersonalDetail] = await db.select().from(personalDetailsModel).where(eq(personalDetailsModel.studentId, studentId));
    if (!foundPersonalDetail) {
        return null; // No Content
    }
    // Delete the personal-detail
    const [deletedTransportDetail] = await db.delete(personalDetailsModel).where(eq(personalDetailsModel.studentId, studentId)).returning();
    if (!deletedTransportDetail) {
        return false; // Failure!
    }

    return true; // Success!
}

export async function removePersonalDetailsByAddressId(studentId: number): Promise<boolean | null> {
    
    return null;
}