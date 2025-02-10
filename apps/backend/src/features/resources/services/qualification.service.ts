import { db } from "@/db/index";
import { eq } from "drizzle-orm";
import { Qualification, qualificationModel } from "../models/qualification.model";

export async function addQualification(qualification: Qualification): Promise<Qualification | null> {
    const [newQualification] = await db.insert(qualificationModel).values(qualification).returning();
    return newQualification;
}

export async function findQualificationById(id: number): Promise<Qualification | null> {
    const [foundQualification] = await db.select().from(qualificationModel).where(eq(qualificationModel.id, id));
    return foundQualification;
}

export async function findQualificationByName(name: string): Promise<Qualification | null> {
    const [foundQualification] = await db.select().from(qualificationModel).where(eq(qualificationModel.name, name.toUpperCase().trim()));
    return foundQualification;
}