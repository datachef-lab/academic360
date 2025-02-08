import { db } from "@/db/index";
import { Specialization, specializationModel } from "@/features/user/models/specialization.model";
import { eq } from "drizzle-orm";

export async function addSpecialization(specialization: Specialization): Promise<Specialization | null> {
    const [newSpecialization] = await db.insert(specializationModel).values(specialization).returning();

    return newSpecialization;
}

export async function findSpecializationById(id: number): Promise<Specialization | null> {
    const [foundSpecialization] = await db.select().from(specializationModel).where(eq(specializationModel.id, id));

    return foundSpecialization;
}

export async function findSpecializationByName(name: string): Promise<Specialization | null> {
    const [foundSpecialization] = await db.select().from(specializationModel).where(eq(specializationModel.name, name));

    return foundSpecialization;
}