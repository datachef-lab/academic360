import { db } from "@/db/index.js";
import {
  Family,
  familyModel,
  createFamilySchema,
} from "@repo/db/schemas/models/user";
import { eq } from "drizzle-orm";
import {
  addPerson,
  findPersonById,
  removePerson,
  savePerson,
} from "./person.service.js";
import { FamilyType } from "@/types/user/family.js";
import { findAnnualIncomeById } from "@/features/resources/services/annualIncome.service.js";
import { z } from "zod";

// Validate input using Zod schema
function validateFamilyInput(data: Omit<FamilyType, "id">) {
  const parseResult = createFamilySchema.safeParse(data);
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

export async function addFamily(
  family: FamilyType,
): Promise<FamilyType | null> {
  // let { annualIncome, fatherDetails, motherDetails, guardianDetails, parentType, ...props } = family;

  // // Validate input (excluding nested objects)
  // validateFamilyInput(props);

  // if (fatherDetails) {
  //     fatherDetails = await addPerson(fatherDetails);
  // }

  // if (motherDetails) {
  //     motherDetails = await addPerson(motherDetails);
  // }

  // if (guardianDetails) {
  //     guardianDetails = await addPerson(guardianDetails);
  // }

  // // Figure out the Family-type
  // if (fatherDetails && motherDetails) {
  //     parentType = "BOTH";
  // }
  // else if (motherDetails) {
  //     parentType = "MOTHER_ONLY";
  // }
  // else if (fatherDetails) {
  //     parentType = "FATHER_ONLY";
  // }
  // else {
  //     parentType = null;
  // }

  // const [newFamily] = await db.insert(familyModel).values({
  //     ...props,
  //     parentType,
  //     fatherDetailsId: fatherDetails?.id,
  //     motherDetailsId: motherDetails?.id,
  //     guardianDetailsId: guardianDetails?.id,
  //     annualIncomeId: annualIncome?.id,
  // }).returning();

  // const formattedFamily = await familyResponseFormat(newFamily);
  return null;
}

export async function findFamilyById(id: number): Promise<FamilyType | null> {
  const [foundFamily] = await db
    .select()
    .from(familyModel)
    .where(eq(familyModel.id, id));
  if (!foundFamily) return null;
  const formattedFamily = await familyResponseFormat(foundFamily);
  return formattedFamily;
}

export async function findFamilyByStudentId(
  studentId: number,
): Promise<FamilyType | null> {
  // const [foundFamily] = await db.select().from(familyModel).where(eq(familyModel.studentId, studentId));
  const foundFamily = null;
  if (!foundFamily) return null;
  const formattedFamily = await familyResponseFormat(foundFamily);
  return formattedFamily;
}

export async function removeFamily(id: number): Promise<boolean | null> {
  // Return if the Family does not exist
  const [foundFamily] = await db
    .select()
    .from(familyModel)
    .where(eq(familyModel.id, id));
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
  if (foundFamily.guardianDetailsId) {
    isDeleted = await removePerson(foundFamily.guardianDetailsId);
    if (isDeleted !== null && !isDeleted) {
      return false;
    }
  }
  // Delete the family record itself
  const [deletedFamily] = await db
    .delete(familyModel)
    .where(eq(familyModel.id, id))
    .returning();
  if (!deletedFamily) {
    return false;
  }
  return true; // Success!
}

export async function saveFamily(
  id: number,
  family: FamilyType,
): Promise<FamilyType | null> {
  // const [foundFamily] = await db.select().from(familyModel).where(eq(familyModel.id, id));
  // if (!foundFamily) {
  //     return null;
  // }
  // const { fatherDetails, motherDetails, guardianDetails, annualIncome, createdAt, updatedAt, studentId, ...props } = family;
  // console.log("annual income", annualIncome);
  // console.log("Mother details: ", motherDetails)
  //  console.log("Father details: ", fatherDetails)
  //   console.log("Guardian details: ", guardianDetails)
  // // Validate input (excluding nested objects)
  // // validateFamilyInput({ ...props, studentId });
  // // Update the Family fields
  // const [updatedFamily] = await db.update(familyModel).set({
  //     ...props,
  //     // studentId, // Ensure studentId is included in the update
  //     // updatedAt: new Date(),
  //     fatherDetailsId: fatherDetails?.id,
  //     motherDetailsId: motherDetails?.id,
  //     guardianDetailsId: guardianDetails?.id,
  //     annualIncomeId: annualIncome?.id,
  // }).where(eq(familyModel.id, id)).returning();
  // // Update the father-person
  // console.log(updatedFamily);
  // if (fatherDetails && fatherDetails.id) {
  //     const {createdAt,updatedAt, ...rest}= fatherDetails
  //     await savePerson(fatherDetails.id, rest);
  // }
  // // Update the mother-person
  // if (motherDetails && motherDetails.id) {
  //     const {createdAt,updatedAt, ...rest}= motherDetails
  //     await savePerson(motherDetails.id, rest);
  // }
  // // Update the guardian-person
  // if (guardianDetails && guardianDetails.id) {
  //     const {createdAt,updatedAt, ...rest}= guardianDetails
  //     await savePerson(guardianDetails.id, rest);
  // }
  // const formattedFamily = await familyResponseFormat(updatedFamily);
  return null;
}

export async function removeFamilysByStudentId(
  studentId: number,
): Promise<boolean | null> {
  // Return if the Family does not exist
  // const [foundFamily] = await db.select().from(familyModel).where(eq(familyModel.studentId, studentId));
  // if (!foundFamily) {
  //     return null; // No Content
  // }
  // // Delete the Family-person
  // let isDeleted: boolean | null = false;
  // if (foundFamily.fatherDetailsId) {
  //     isDeleted = await removePerson(foundFamily.fatherDetailsId);
  //     if (isDeleted !== null && !isDeleted) {
  //         return false; // Failure!
  //     }
  // }
  // if (foundFamily.motherDetailsId) {
  //     isDeleted = await removePerson(foundFamily.motherDetailsId);
  //     if (isDeleted !== null && !isDeleted) {
  //         return false; // Failure!
  //     }
  // }
  // if (foundFamily.guardianDetailsId) {
  //     isDeleted = await removePerson(foundFamily.guardianDetailsId);
  //     if (isDeleted !== null && !isDeleted) {
  //         return false; // Failure!
  //     }
  // }
  // // Delete the family record itself
  // const [deletedFamily] = await db.delete(familyModel).where(eq(familyModel.studentId, studentId)).returning();
  // if (!deletedFamily) {
  //     return false;
  // }
  return false; // Success!
}

export async function getAllFamilies(): Promise<Family[]> {
  const families = await db.select().from(familyModel);
  return families;
}

export async function familyResponseFormat(
  family: Family,
): Promise<FamilyType | null> {
  if (!family) {
    return null;
  }
  const {
    annualIncomeId,
    fatherDetailsId,
    motherDetailsId,
    guardianDetailsId,
    ...props
  } = family;
  const formattedFamily: FamilyType = { ...props };
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
