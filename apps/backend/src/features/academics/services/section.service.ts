import { db } from "@/db/index.js";
import { Section, sectionModel } from "../models/section.model.js";
import { eq } from "drizzle-orm";

export async function findSectionById(id: number): Promise<Section | null> {
    const [foundSection] = await db.select().from(sectionModel).where(eq(sectionModel.id, id));

    return foundSection;
}