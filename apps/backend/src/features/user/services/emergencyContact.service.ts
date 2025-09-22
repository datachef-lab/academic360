import { db } from "@/db/index.js";
import {
  EmergencyContact,
  emergencyContactModel,
  createEmergencyContactSchema,
} from "@repo/db/schemas/models/user";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Validate input using Zod schema
function validateEmergencyContactInput(data: Omit<EmergencyContact, "id">) {
  const parseResult = createEmergencyContactSchema.safeParse(data);
  if (!parseResult.success) {
    const error = new Error(
      "Validation failed: " + JSON.stringify(parseResult.error.issues),
    );
    // @ts-expect-error
    error.status = 400;
    throw error;
  }
  return parseResult.data;
}

export async function addEmergencyContact(
  emergencyContact: EmergencyContact,
): Promise<EmergencyContact | null> {
  // Validate input (excluding id)
  const { id, ...props } = emergencyContact;
  validateEmergencyContactInput(props);
  const [newEmergencyContact] = await db
    .insert(emergencyContactModel)
    .values(props)
    .returning();
  return newEmergencyContact;
}

export async function findEmergencyContactById(
  id: number,
): Promise<EmergencyContact | null> {
  const [foundEmergencyContact] = await db
    .select()
    .from(emergencyContactModel)
    .where(eq(emergencyContactModel.id, id));
  return foundEmergencyContact;
}

export async function findEmergencyContactByStudentId(
  studentId: number,
): Promise<EmergencyContact | null> {
  // Current schema has no studentId on emergency_contacts.
  // Leave as placeholder until association is defined.
  return null;
}

export async function updateEmergencyContact(
  id: number,
  emergencyContact: EmergencyContact,
): Promise<EmergencyContact | null> {
  const { id: _id, createdAt, updatedAt, ...props } = emergencyContact as any;
  const [existing] = await db
    .select()
    .from(emergencyContactModel)
    .where(eq(emergencyContactModel.id, id));
  if (!existing) return null;

  const [updated] = await db
    .update(emergencyContactModel)
    .set({ ...props })
    .where(eq(emergencyContactModel.id, id))
    .returning();
  return updated ?? null;
}

export async function removeEmergencyContact(
  id: number,
): Promise<boolean | null> {
  const [foundEmergencyContact] = await db
    .select()
    .from(emergencyContactModel)
    .where(eq(emergencyContactModel.id, id));
  if (!foundEmergencyContact) {
    return null; // No Content
  }
  const [deletedEmergencyContact] = await db
    .delete(emergencyContactModel)
    .where(eq(emergencyContactModel.id, id))
    .returning();
  if (!deletedEmergencyContact) {
    return false; // Failure!
  }
  return true; // Success!
}

export async function removeEmergencyContactByStudentId(
  studentId: number,
): Promise<boolean | null> {
  // Not supported without an association in the schema
  return false; // Success!
}

export async function getAllEmergencyContacts(): Promise<EmergencyContact[]> {
  const contacts = await db.select().from(emergencyContactModel);
  return contacts;
}
