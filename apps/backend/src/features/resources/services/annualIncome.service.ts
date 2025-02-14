import { db } from "@/db/index.js";
import { AnnualIncome, annualIncomeModel } from "@/features/resources/models/annualIncome.model.js";
import { eq } from "drizzle-orm";

export async function findAnnualIncomeById(id: number): Promise<AnnualIncome | null> {
    const [foundAnnualIncome] = await db.select().from(annualIncomeModel).where(eq(annualIncomeModel.id, id));
    return foundAnnualIncome;   
}