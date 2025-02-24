import { db } from "@/db/index.js";
import { Shift, shiftModel } from "../models/shift.model.js";
import { eq } from "drizzle-orm";

export async function findShiftById(id: number): Promise<Shift | null> {
    const [foundShift] = await db.select().from(shiftModel).where(eq(shiftModel.id, id));

    return foundShift;
}