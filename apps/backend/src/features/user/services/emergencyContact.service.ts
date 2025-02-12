import { db } from "@/db/index.js";
import { EmergencyContact, emergencyContactModel } from "../models/emergencyContact.model.js";
import { eq } from "drizzle-orm";

export async function addEmergencyContact(emergencyContact: EmergencyContact): Promise<EmergencyContact | null> {
    const [newEmergencyContact] = await db.insert(emergencyContactModel).values(emergencyContact).returning();
    return newEmergencyContact;
}
export async function findEmergencyContactById(id: number): Promise<EmergencyContact | null> {
    const [foundEmergencyContact] = await db.select().from(emergencyContactModel).where(eq(emergencyContactModel.id, id));

    return foundEmergencyContact;
}

export async function findEmergencyContactByStudentId(studentId: number): Promise<EmergencyContact | null> {
    const [foundEmergencyContact] = await db.select().from(emergencyContactModel).where(eq(emergencyContactModel.studentId, studentId));

    return foundEmergencyContact;
}

export async function removeEmergencyContact(id: number): Promise<boolean | null> {
    // Return if the emergency-contact doesn't exist
    const [foundEmergencyContact] = await db.select().from(emergencyContactModel).where(eq(emergencyContactModel.id, id));
    if (!foundEmergencyContact) {
        return null; // No Content
    }
    // Delete the emergency-contact
    const [deletedEmergencyContact] = await db.delete(emergencyContactModel).where(eq(emergencyContactModel.id, id)).returning();
    if (!deletedEmergencyContact) {
        return false; // Failure!
    }

    return true; // Success!
}

export async function removeEmergencyContactByStudentId(studentId: number): Promise<boolean | null> {
    // Return if the emergency-contact doesn't exist
    const [foundEmergencyContact] = await db.select().from(emergencyContactModel).where(eq(emergencyContactModel.studentId, studentId));
    if (!foundEmergencyContact) {
        return null; // No Content
    }
    // Delete the emergency-contact
    const [deletedEmergencyContact] = await db.delete(emergencyContactModel).where(eq(emergencyContactModel.studentId, studentId)).returning();
    if (!deletedEmergencyContact) {
        return false; // Failure!
    }

    return true; // Success!
}
