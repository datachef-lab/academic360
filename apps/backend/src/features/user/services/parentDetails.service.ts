import { db } from "@/db/index";
import { Parent, parentModel } from "../models/parent.model";
import { eq } from "drizzle-orm";
import { addPerson, findPersonById, removePerson, savePerson } from "./person.service";
import { ParentType } from "@/types/user/parent";
import { findAnnualIncomeById } from "@/features/resources/services/annualIncome.service";

export async function addParent(parent: ParentType): Promise<ParentType | null> {
    let { annualIncome, fatherDetails, motherDetails, parentType, ...props } = parent;

    if (fatherDetails) {
        fatherDetails = await addPerson(fatherDetails);
    }

    if (motherDetails) {
        motherDetails = await addPerson(motherDetails);
    }

    // Figure out the parent-type
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

    const [newParent] = await db.insert(parentModel).values({
        ...props,
        parentType,
        annualIncomeId: annualIncome?.id,
    }).returning();

    const formattedParent = await parentResponseFormat(newParent);

    return formattedParent;
}

export async function findParentById(id: number): Promise<ParentType | null> {
    const [foundParent] = await db.select().from(parentModel).where(eq(parentModel.id, id));

    const formattedParent = await parentResponseFormat(foundParent);

    return formattedParent;
}

export async function findParentByStudentId(studentId: number): Promise<ParentType | null> {
    const [foundParent] = await db.select().from(parentModel).where(eq(parentModel.studentId, studentId));

    const formattedParent = await parentResponseFormat(foundParent);

    return formattedParent;
}

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

export async function saveParent(id: number, parent: ParentType): Promise<ParentType | null> {
    const [foundParent] = await db.select().from(parentModel).where(eq(parentModel.id, id));

    if (!foundParent) {
        return null;
    }

    const { fatherDetails, motherDetails, ...props } = parent;

    // Update the parent fields
    const [updatedParent] = await db.update(parentModel).set({
        ...props,
        updatedAt: new Date(),
    }).returning();

    // Update the father-person
    if (fatherDetails) {
        const updatedFather = await savePerson(fatherDetails.id as number, fatherDetails);
        if (!updatedFather) {
            return null;
        }
    }

    // Update the mother-person
    if (motherDetails) {
        const updatedMother = await savePerson(motherDetails.id as number, motherDetails);
        if (!updatedMother) {
            return null;
        }
    }

    const formattedParent = await parentResponseFormat(updatedParent);

    return formattedParent;
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

export async function parentResponseFormat(parent: Parent): Promise<ParentType | null> {
    if (!parent) {
        return null;
    }

    const { annualIncomeId, fatherDetailsId, motherDetailsId, ...props } = parent;

    const formattedParent: ParentType = { ...props }

    if (annualIncomeId) {
        formattedParent.annualIncome = await findAnnualIncomeById(annualIncomeId);
    }

    if (fatherDetailsId) {
        formattedParent.fatherDetails = await findPersonById(fatherDetailsId);
    }

    if (motherDetailsId) {
        formattedParent.motherDetails = await findPersonById(motherDetailsId);
    }

    return formattedParent;
}