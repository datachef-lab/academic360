import { db } from "@/db/index";
import { Degree, degreeModel } from "../models/degree.model";
import { eq } from "drizzle-orm";

export async function findDegreeById(id: number): Promise<Degree | null> {
    const [foundDegree] = await db.select().from(degreeModel).where(eq(degreeModel.id, id));

    return foundDegree;
}