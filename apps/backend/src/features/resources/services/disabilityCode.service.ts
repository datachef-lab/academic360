import { db } from "@/db/index";
import { Disability, disabilityCodeModel } from "@/features/user/models/disabilityCode.model";
import { eq } from "drizzle-orm";

export async function addDisabilityCode(disabilityCode: Disability): Promise<Disability | null> {
    const [foundDisability] = await db.insert(disabilityCodeModel).values(disabilityCode).returning();

    return foundDisability;
}

export async function findDisabilityCodeById(id: number): Promise<Disability | null> {
    const [foundDisability] = await db.select().from(disabilityCodeModel).where(eq(disabilityCodeModel.id, id));

    return foundDisability;
}

export async function findDisabilityCodeByCode(code: string): Promise<Disability | null> {
    const [foundDisability] = await db.select().from(disabilityCodeModel).where(eq(disabilityCodeModel.code, code));

    return foundDisability;
}