import { db } from "@/db/index.js";
import { Degree, degreeModel } from "@/features/resources/models/degree.model.js";
import { eq } from "drizzle-orm";

export async function addDegree(name: string): Promise<Degree | null> {
    const [foundDegree] = await db.insert(degreeModel).values({
        name
    }).returning();

    return foundDegree;
}

export async function findDegreeById(id: number): Promise<Degree | null> {
    const [foundDegree] = await db.select().from(degreeModel).where(eq(degreeModel.id, id));

    return foundDegree;
}

export async function findDegreeByName(name: string): Promise<Degree | null> {
    const [foundDegree] = await db.select().from(degreeModel).where(eq(degreeModel.name, name));

    return foundDegree;
}