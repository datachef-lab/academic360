import { db } from "@/db/index";
import { AnnualIncome, annualIncomeModel } from "../models/annualIncome.model";
import { eq } from "drizzle-orm";

export async function findAnnualIncomeById(id: number): Promise<AnnualIncome | null> {
    const [foundAnnualIncome] = await db.select().from(annualIncomeModel).where(eq(annualIncomeModel.id, id));
    return foundAnnualIncome;   
}