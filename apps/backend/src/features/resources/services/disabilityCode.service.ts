import { db } from "@/db/index.js";
import { Disability, disabilityCodeModel } from "@repo/db/schemas/models/user";
import { eq } from "drizzle-orm";

export async function addDisabilityCode(
  disabilityCode: Disability,
): Promise<Disability | null> {
  const [foundDisability] = await db
    .insert(disabilityCodeModel)
    .values(disabilityCode)
    .returning();

  return foundDisability;
}

export async function findDisabilityCodeById(
  id: number,
): Promise<Disability | null> {
  const [foundDisability] = await db
    .select()
    .from(disabilityCodeModel)
    .where(eq(disabilityCodeModel.id, id));

  return foundDisability;
}

export async function findDisabilityCodeByCode(
  code: string,
): Promise<Disability | null> {
  const [foundDisability] = await db
    .select()
    .from(disabilityCodeModel)
    .where(eq(disabilityCodeModel.code, code));

  return foundDisability;
}
