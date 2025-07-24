import { db } from "@/db/index.js";
import { affiliationModel, createAffiliationModel, Affiliation } from "@/features/course-design/models/affiliation.model.js";
import { eq } from "drizzle-orm";

export async function createAffiliation(data: Omit<Affiliation, 'id' | 'createdAt' | 'updatedAt'>) {
    const validated = createAffiliationModel.parse(data);
    const [created] = await db.insert(affiliationModel).values(validated).returning();
    return created;
}

export async function getAffiliationById(id: number) {
    const [affiliation] = await db.select().from(affiliationModel).where(eq(affiliationModel.id, id));
    return affiliation;
}

export async function getAllAffiliations() {
    return db.select().from(affiliationModel);
}

export async function updateAffiliation(id: number, data: Partial<Affiliation>) {
    const { createdAt, updatedAt, ...rest } = data;
    const validated = createAffiliationModel.partial().parse(rest);
    const [updated] = await db.update(affiliationModel).set(validated).where(eq(affiliationModel.id, id)).returning();
    return updated;
}

export async function deleteAffiliation(id: number) {
    const [deleted] = await db.delete(affiliationModel).where(eq(affiliationModel.id, id)).returning();
    return deleted;
} 