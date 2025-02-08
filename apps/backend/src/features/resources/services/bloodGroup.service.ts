import { db } from "@/db/index.js";
import { BloodGroup, bloodGroupModel } from "../models/bloodGroup.model.js";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";
import { count, desc, eq } from "drizzle-orm";

export async function findBloodGroupById(id: number): Promise<BloodGroup | null> {
    const [foundBloodGroup] = await db.select().from(bloodGroupModel).where(eq(bloodGroupModel.id, id));

    return foundBloodGroup;
}