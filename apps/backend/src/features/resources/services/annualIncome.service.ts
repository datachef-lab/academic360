import { db } from "@/db/index.js";
import {
  AnnualIncome,
  annualIncomeModel,
} from "@/features/resources/models/annualIncome.model.js";
import { eq } from "drizzle-orm";

export async function findAnnualIncomeById(
  id: number,
): Promise<AnnualIncome | null> {
  const [foundAnnualIncome] = await db
    .select()
    .from(annualIncomeModel)
    .where(eq(annualIncomeModel.id, id));
  return foundAnnualIncome;
}

export async function findAllAnnualIncomes(): Promise<AnnualIncome[]> {
  return await db
    .select()
    .from(annualIncomeModel)
    .orderBy(annualIncomeModel.sequence);
}

export async function createAnnualIncome(
  data: Omit<AnnualIncome, "id" | "createdAt" | "updatedAt">,
): Promise<AnnualIncome> {
  const [newAnnualIncome] = await db
    .insert(annualIncomeModel)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newAnnualIncome;
}

export async function updateAnnualIncome(
  id: number,
  data: Partial<Omit<AnnualIncome, "id" | "createdAt" | "updatedAt">>,
): Promise<AnnualIncome | null> {
  const [updatedAnnualIncome] = await db
    .update(annualIncomeModel)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(annualIncomeModel.id, id))
    .returning();

  return updatedAnnualIncome || null;
}

export async function deleteAnnualIncome(
  id: number,
): Promise<AnnualIncome | null> {
  const [deletedAnnualIncome] = await db
    .delete(annualIncomeModel)
    .where(eq(annualIncomeModel.id, id))
    .returning();

  return deletedAnnualIncome || null;
}

export async function findAnnualIncomeByRange(
  range: string,
): Promise<AnnualIncome | null> {
  const [foundAnnualIncome] = await db
    .select()
    .from(annualIncomeModel)
    .where(eq(annualIncomeModel.range, range));

  return foundAnnualIncome || null;
}
