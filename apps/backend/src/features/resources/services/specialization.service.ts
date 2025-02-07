import { db } from "@/db/index";
import { Specialization, specializationModel } from "@/features/user/models/specialization.model";
import { eq } from "drizzle-orm";

export async function findSpecializationById(id: number): Promise<Specialization | null> {
    const [foundSpecialization] = await db.select().from(specializationModel).where(eq(specializationModel.id, id));

    return foundSpecialization;
}