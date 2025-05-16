import { db } from "@/db/index.js";
import { Family, familyModel } from "../models/family.model.js";
import { eq } from "drizzle-orm";
import { addPerson, findPersonById, removePerson, savePerson } from "./person.service.js";
import { FamilyType } from "@/types/user/family.js";
import { findAnnualIncomeById } from "@/features/resources/services/annualIncome.service.js";

export async function addFamily(family: FamilyType): Promise<FamilyType | null> {
    let { annualIncome, fatherDetails, motherDetails, parentType, ...props } = family;

    if (fatherDetails) {
        fatherDetails = await addPerson(fatherDetails);
    }

    if (motherDetails) {
        motherDetails = await addPerson(motherDetails);
    }

    // Figure out the Family-type
    if (fatherDetails && motherDetails) {
        parentType = "BOTH";
    }
    else if (motherDetails) {
        parentType = "MOTHER_ONLY";
    }
    else if (fatherDetails) {
        parentType = "FATHER_ONLY";
    }
    else {
        parentType = null;
    }

    const [newFamily] = await db.insert(familyModel).values({
        ...props,
        parentType,
        annualIncomeId: annualIncome?.id,
    }).returning();

    const formattedFamily = await familyResponseFormat(newFamily);

    return formattedFamily;
}

export async function findFamilyById(id: number): Promise<FamilyType | null> {
    const [foundFamily] = await db.select().from(familyModel).where(eq(familyModel.id, id));

    const formattedFamily = await familyResponseFormat(foundFamily);

    return formattedFamily;
}

export async function findFamilyByStudentId(studentId: number): Promise<FamilyType | null> {
    const [foundFamily] = await db.select().from(familyModel).where(eq(familyModel.studentId, studentId));

    const formattedFamily = await familyResponseFormat(foundFamily);

    return formattedFamily;
}

export async function removeFamily(id: number): Promise<boolean | null> {
    // Return if the Family does not exist
    const [foundFamily] = await db.select().from(familyModel).where(eq(familyModel.id, id));
    if (!foundFamily) {
        return null; // No Content
    }

    // Delete the Family-person
    let isDeleted: boolean | null = false;
    if (foundFamily.fatherDetailsId) {
        isDeleted = await removePerson(foundFamily.fatherDetailsId);
        if (isDeleted !== null && !isDeleted) {
            return false;
        }
    }

    if (foundFamily.motherDetailsId) {
        isDeleted = await removePerson(foundFamily.motherDetailsId);
        if (isDeleted !== null && !isDeleted) {
            return false;
        }
    }

    return true; // Success!
}

export async function saveFamily(id: number, Family: FamilyType): Promise<FamilyType | null> {
    try {
        const [foundFamily] = await db.select().from(familyModel).where(eq(familyModel.id, id));

        if (!foundFamily) {
            return null;
        }

        const { fatherDetails, motherDetails, guardianDetails, annualIncome, ...props } = Family;

        // Ensure dates are proper Date objects
        const updatedProps = {
            ...props,
            updatedAt: new Date(),
        };

        // Update the Family fields
        const [updatedFamily] = await db.update(familyModel).set(updatedProps).where(eq(familyModel.id, id)).returning();

        // Update the father-person
        if (fatherDetails && fatherDetails.id) {
            const updatedFather = await savePerson(fatherDetails.id as number, fatherDetails);
            if (!updatedFather) {
                console.warn("Failed to update father details");
            }
        }

        // Update the mother-person
        if (motherDetails && motherDetails.id) {
            const updatedMother = await savePerson(motherDetails.id as number, motherDetails);
            if (!updatedMother) {
                console.warn("Failed to update mother details");
            }
        }
        
        // Update the guardian-person
        if (guardianDetails && guardianDetails.id) {
            const updatedGuardian = await savePerson(guardianDetails.id as number, guardianDetails);
            if (!updatedGuardian) {
                console.warn("Failed to update guardian details");
            }
        }

        const formattedFamily = await familyResponseFormat(updatedFamily);

        return formattedFamily;
    } catch (error) {
        console.error("Error in saveFamily service:", error);
        throw error;
    }
}

export async function removeFamilysByStudentId(studentId: number): Promise<boolean | null> {
    // Return if the Familys does not exist
    const [foundFamily] = await db.select().from(familyModel).where(eq(familyModel.studentId, studentId));
    if (!foundFamily) {
        return null; // No Content
    }
    // Delete the Family-person
    let isDeleted: boolean | null = false;
    if (foundFamily.fatherDetailsId) {
        isDeleted = await removePerson(foundFamily.fatherDetailsId);
        if (isDeleted !== null && !isDeleted) {
            return false; // Failure!
        }
    }

    if (foundFamily.motherDetailsId) {
        isDeleted = await removePerson(foundFamily.motherDetailsId);
        if (isDeleted !== null && !isDeleted) {
            return false; // Failure!
        }
    }

    return true; // Success!
}

export async function familyResponseFormat(Family: Family): Promise<FamilyType | null> {
    if (!Family) {
        return null;
    }

    const { annualIncomeId, fatherDetailsId, motherDetailsId, guardianDetailsId, ...props } = Family;

    const formattedFamily: FamilyType = { ...props }

    if (annualIncomeId) {
        formattedFamily.annualIncome = await findAnnualIncomeById(annualIncomeId);
    }

    if (fatherDetailsId) {
        formattedFamily.fatherDetails = await findPersonById(fatherDetailsId);
    }

    if (motherDetailsId) {
        formattedFamily.motherDetails = await findPersonById(motherDetailsId);
    }

    if (guardianDetailsId) {
        formattedFamily.guardianDetails = await findPersonById(guardianDetailsId);
    }

    return formattedFamily;
}