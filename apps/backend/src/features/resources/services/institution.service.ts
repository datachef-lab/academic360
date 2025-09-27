import { InstitutionType } from "@/types/resources/institution.js";
import { Institution, institutionModel } from "@repo/db/schemas";
import { findDegreeById } from "@/features/resources/services/degree.service.js";
import { findAddressById } from "@/features/user/services/address.service.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";

export async function findInstitutionById(
  id: number,
): Promise<InstitutionType | null> {
  const [foundInstitution] = await db
    .select()
    .from(institutionModel)
    .where(eq(institutionModel.id, id));

  const formattedInstitution = await instituionResponseFormat(foundInstitution);

  return formattedInstitution;
}

export async function findAllInstitutions(): Promise<Institution[]> {
  return await db
    .select()
    .from(institutionModel)
    .orderBy(institutionModel.sequence);
}

export async function createInstitution(
  data: Omit<Institution, "id" | "createdAt" | "updatedAt">,
): Promise<Institution> {
  const [newInstitution] = await db
    .insert(institutionModel)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newInstitution;
}

export async function updateInstitution(
  id: number,
  data: Partial<Omit<Institution, "id" | "createdAt" | "updatedAt">>,
): Promise<Institution | null> {
  const [updatedInstitution] = await db
    .update(institutionModel)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(institutionModel.id, id))
    .returning();

  return updatedInstitution || null;
}

export async function deleteInstitution(
  id: number,
): Promise<Institution | null> {
  const [deletedInstitution] = await db
    .delete(institutionModel)
    .where(eq(institutionModel.id, id))
    .returning();

  return deletedInstitution || null;
}

export async function findInstitutionByName(
  name: string,
): Promise<Institution | null> {
  const [foundInstitution] = await db
    .select()
    .from(institutionModel)
    .where(eq(institutionModel.name, name));

  return foundInstitution || null;
}

export async function findInstitutionsByDegreeId(
  degreeId: number,
): Promise<Institution[]> {
  return await db
    .select()
    .from(institutionModel)
    .where(eq(institutionModel.degreeId, degreeId))
    .orderBy(institutionModel.sequence);
}

export async function instituionResponseFormat(
  instituion: Institution,
): Promise<InstitutionType | null> {
  if (!instituion) {
    return null;
  }

  const { degreeId, ...props } = instituion;

  const formattedInstitution: InstitutionType = { ...props };

  if (degreeId) {
    formattedInstitution.degree = await findDegreeById(degreeId);
  }

  return formattedInstitution;
}
