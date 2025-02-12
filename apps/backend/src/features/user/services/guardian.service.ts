import { GuardianType } from "@/types/user/guardian";
import { addPerson, findPersonById, removePerson, savePerson } from "./person.service";
import { db } from "@/db/index";
import { gaurdianModel, Guardian } from "../models/guardian.model";
import { eq } from "drizzle-orm";

export async function addGuardian(guardian: GuardianType): Promise<GuardianType | null> {
    let { gaurdianDetails, ...props } = guardian;

    if (gaurdianDetails) {
        gaurdianDetails = await addPerson(gaurdianDetails);
    }

    const [newGuardian] = await db.insert(gaurdianModel).values({ ...props, gaurdianDetailsId: gaurdianDetails?.id }).returning();

    const formatedGuardian = await guardianResponseFormat(newGuardian);

    return formatedGuardian;
}

export async function findGuardianById(id: number): Promise<GuardianType | null> {
    const [foundGuardian] = await db.select().from(gaurdianModel).where(eq(gaurdianModel.id, id));

    const formatedGuardian = await guardianResponseFormat(foundGuardian);

    return formatedGuardian;
}

export async function findGuardianByStudentId(studentId: number): Promise<GuardianType | null> {
    const [foundGuardian] = await db.select().from(gaurdianModel).where(eq(gaurdianModel.studentId, studentId));

    const formatedGuardian = await guardianResponseFormat(foundGuardian);

    return formatedGuardian;
}

export async function saveGuardian(id: number, guardian: GuardianType): Promise<GuardianType | null> {
    const [foundGuardian] = await db.select().from(gaurdianModel).where(eq(gaurdianModel.id, id));

    if (!foundGuardian) {
        return null;
    }

    if (guardian.gaurdianDetails) {
        const updatedGuardianPerson = await savePerson(guardian.gaurdianDetails?.id as number, guardian.gaurdianDetails);
        if (!updatedGuardianPerson) {
            return null;
        }
    }

    const formatedGuardian = await guardianResponseFormat(foundGuardian);

    return formatedGuardian;
}

export async function removeGuardian(id: number): Promise<boolean | null> {
    // Return if the guardian does not exist
    const [foundGuardian] = await db.select().from(gaurdianModel).where(eq(gaurdianModel.id, id));
    if (!foundGuardian) {
        return null;
    }

    // Delete the guardian-person
    let isDeleted: boolean | null = await removePerson(id);
    if (!isDeleted) {
        return false;
    }

    return true;
}

export async function removeGuardianByStudentId(studentId: number): Promise<boolean | null> {
    // Return if the guardian does not exist
    const [foundGuardian] = await db.select().from(gaurdianModel).where(eq(gaurdianModel.studentId, studentId));
    if (!foundGuardian) {
        return null;
    }
    // Delete the guardian-person
    let isDeleted: boolean | null = await removePerson(foundGuardian.id);
    if (!isDeleted) {
        return false; // Failure!
    }

    return true; // Success!
}

export async function guardianResponseFormat(guardian: Guardian): Promise<GuardianType | null> {
    if (!guardian) {
        return null;
    }

    const { gaurdianDetailsId, ...props } = guardian;

    const formatedGuardian: GuardianType = { gaurdianDetails: null, ...props };

    if (gaurdianDetailsId) {
        formatedGuardian.gaurdianDetails = await findPersonById(gaurdianDetailsId);
    }

    return formatedGuardian;
}