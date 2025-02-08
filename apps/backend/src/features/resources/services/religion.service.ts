import { db } from "@/db/index";
import { eq } from "drizzle-orm";
import { Religion, religionModel } from "../models/religion.model";

export async function addReligion(religion: Religion): Promise<Religion | null> {
    const [newReligion] = await db.insert(religionModel).values(religion).returning();
    return newReligion;
}

export async function findReligionById(id: number): Promise<Religion | null> {
    const [foundReligion] = await db.select().from(religionModel).where(eq(religionModel.id, id));
    return foundReligion;
}

export async function findReligionByName(name: string): Promise<Religion | null> {
    const [foundReligion] = await db.select().from(religionModel).where(eq(religionModel.name, name));
    return foundReligion;
}