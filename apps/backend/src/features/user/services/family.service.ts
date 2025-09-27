import { db } from "@/db/index.js";
import {
  Family,
  familyModel,
  createFamilySchema,
} from "@repo/db/schemas/models/user";
import { eq } from "drizzle-orm";
import {
  addPerson,
  findPersonByFamilyId,
  findPersonById,
  removePerson,
  savePerson,
} from "./person.service.js";
import { FamilyType } from "@/types/user/family.js";
import { findAnnualIncomeById } from "@/features/resources/services/annualIncome.service.js";
import { z } from "zod";
import { FamilyDto } from "@repo/db/index.js";

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
  // validateFamilyInput(props);
  // if (fatherDetails) fatherDetails = await addPerson(fatherDetails);
  // if (motherDetails) motherDetails = await addPerson(motherDetails);
  // if (guardianDetails) guardianDetails = await addPerson(guardianDetails);
  // Determine parentType from presence of parents and insert
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
  //   if (foundFamily.      fatherDetailsId) {
  //     isDeleted = await removePerson(foundFamily.fatherDetailsId);
  //     if (isDeleted !== null && !isDeleted) {
  //       return false;
  //     }
  //   }
  //   if (foundFamily.motherDetailsId) {
  //     isDeleted = await removePerson(foundFamily.motherDetailsId);
  //     if (isDeleted !== null && !isDeleted) {
  //       return false;
  //     }
  //   }
  //   if (foundFamily.guardianDetailsId) {
  //     isDeleted = await removePerson(foundFamily.guardianDetailsId);
  //     if (isDeleted !== null && !isDeleted) {
  //       return false;
  //     }
  //   }
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
  const [foundFamily] = await db
    .select()
    .from(familyModel)
    .where(eq(familyModel.id, id));
  if (!foundFamily) {
    return null;
  }

  const {
    fatherDetailsId,
    motherDetailsId,
    guardianDetailsId,
    spouseDetailsId,
    otherGuardianDetailsId,
    familyOccupationId,
    annualIncomeId,
    parentType,
    createdAt, // ignore
    updatedAt, // ignore
    id: _id, // ignore
    ...rest
  } = family as any;

  const [updatedFamily] = await db
    .update(familyModel)
    .set({
      ...rest,
      parentType,
      fatherDetailsId,
      motherDetailsId,
      guardianDetailsId,
      otherGuardianDetailsId,
      spouseDetailsId,
      familyOccupationId,
      annualIncomeId,
    })
    .where(eq(familyModel.id, id))
    .returning();

  return updatedFamily ?? null;
}

export async function removeFamilysByStudentId(
  studentId: number,
): Promise<boolean | null> {
  // Not implemented without student relation on family table
  return false; // Success!
}

export async function getAllFamilies(): Promise<Family[]> {
  const families = await db.select().from(familyModel);
  return families;
}

export async function familyResponseFormat(
  family: Family,
): Promise<FamilyDto | null> {
  if (!family) {
    return null;
  }
  const {
    annualIncomeId,

    ...props
  } = family;
  const formattedFamily: FamilyDto = { ...props, members: [] };
  if (annualIncomeId) {
    formattedFamily.annualIncome = await findAnnualIncomeById(annualIncomeId);
  }

  formattedFamily.members = await findPersonByFamilyId(family.id!);

  return formattedFamily;
}
