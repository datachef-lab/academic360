import { db } from "@/db/index.js";
import { Shift, shiftModel } from "@repo/db/schemas/models/academics";
import { eq } from "drizzle-orm";

export const loadShifts = async () => {
  const shifts: Shift[] = [
    { name: "Morning", codePrefix: "01", sequence: 1 },
    { name: "Evening", codePrefix: "03", sequence: 2 },
    { name: "Afternoon", codePrefix: "02", sequence: 3 },
    { name: "Day", codePrefix: "04", sequence: 4 },
  ];

  for (const shift of shifts) {
    const existing = await db
      .select()
      .from(shiftModel)
      .where(eq(shiftModel.name, shift.name));

    if (!existing.length) {
      await db.insert(shiftModel).values(shift);
    }
  }

  console.log("Shifts loaded successfully.");
};

export async function getAllShifts(): Promise<Shift[]> {
  return db.select().from(shiftModel);
}

export async function findById(id: number): Promise<Shift | null> {
  const [foundShift] = await db
    .select()
    .from(shiftModel)
    .where(eq(shiftModel.id, id));
  return foundShift || null;
}

export async function createShift(
  data: Omit<Shift, "id" | "createdAt" | "updatedAt">,
): Promise<Shift> {
  const [created] = await db
    .insert(shiftModel)
    .values(data as any)
    .returning();
  return created;
}

export async function updateShift(
  id: number,
  data: Partial<Omit<Shift, "id" | "createdAt" | "updatedAt">>,
): Promise<Shift | null> {
  const [updated] = await db
    .update(shiftModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(shiftModel.id, id))
    .returning();
  return updated || null;
}

export async function deleteShift(id: number): Promise<boolean> {
  const deleted = await db
    .delete(shiftModel)
    .where(eq(shiftModel.id, id))
    .returning();
  return deleted.length > 0;
}
