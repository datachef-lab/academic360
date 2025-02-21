import { db } from "@/db/index";
import { Shift, shiftModel } from "../models/shift.model";
import { eq } from "drizzle-orm";

export async function findShiftById(id: number): Promise<Shift | null> {
    const [foundShift] = await db.select().from(shiftModel).where(eq(shiftModel.id, id));

    return foundShift;
}