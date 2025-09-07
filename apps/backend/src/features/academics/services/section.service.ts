import { db } from "@/db/index.js";
import { Section, sectionModel } from "@repo/db/schemas/models/academics";
import { eq } from "drizzle-orm";

export async function findById(id: number): Promise<Section | null> {
    const [foundSection] = await db.select().from(sectionModel).where(eq(sectionModel.id, id));

    return foundSection;
}