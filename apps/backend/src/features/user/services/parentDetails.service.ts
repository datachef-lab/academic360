import { db } from "@/db/index";
import { parentModel } from "../models/parent.model";
import { eq } from "drizzle-orm";
import { removePerson } from "./person.service";

export async function removeParent(id: number): Promise<boolean | null> {
    // Return if the parent does not exist
    const [foundParent] = await db.select().from(parentModel).where(eq(parentModel.id, id));
    if (!foundParent) {
        return null; // No Content
    }

    // Delete the parent-person
    let isDeleted: boolean | null = false;
    if (foundParent.fatherDetailsId) {
        isDeleted = await removePerson(foundParent.fatherDetailsId);
        if (isDeleted !== null && !isDeleted) {
            return false;
        }
    }

    if (foundParent.motherDetailsId) {
        isDeleted = await removePerson(foundParent.motherDetailsId);
        if (isDeleted !== null && !isDeleted) {
            return false;
        }
    }

    return true; // Success!
}

export async function removeParentsByStudentId(studentId: number): Promise<boolean | null> {
    // Return if the parents does not exist
    const [foundParent] = await db.select().from(parentModel).where(eq(parentModel.studentId, studentId));
    if (!foundParent) {
        return null; // No Content
    }
    // Delete the parent-person
    let isDeleted: boolean | null = false;
    if (foundParent.fatherDetailsId) {
        isDeleted = await removePerson(foundParent.fatherDetailsId);
        if (isDeleted !== null && !isDeleted) {
            return false; // Failure!
        }
    }

    if (foundParent.motherDetailsId) {
        isDeleted = await removePerson(foundParent.motherDetailsId);
        if (isDeleted !== null && !isDeleted) {
            return false; // Failure!
        }
    }

    return true; // Success!
}