import { db } from "@/db";
import { disabilityCodeModel } from "@repo/db/schemas/models/user";
import { eq } from "drizzle-orm";

/**
 * Creates a new disability code entry in the database.
 * @param data - Object containing the code string.
 * @returns The created disability code record.
 * @throws Error if the code is invalid or already exists.
 */
export async function createDisabilityCode(data: { code: string }) {
  if (
    !data.code ||
    typeof data.code !== "string" ||
    data.code.trim().length < 2
  ) {
    throw new Error("Invalid code");
  }

  // Optional: Check for duplicates
  const [existing] = await db
    .select()
    .from(disabilityCodeModel)
    .where(eq(disabilityCodeModel.code, data.code.trim()));
  if (existing) {
    throw new Error("Disability code already exists");
  }

  const [created] = await db
    .insert(disabilityCodeModel)
    .values({ code: data.code.trim() })
    .returning();

  return created;
}

/**
 * Retrieves all disability codes from the database.
 * @returns Array of all disability code records, ordered by ID.
 */
export async function getAllDisabilityCodes() {
  return db.select().from(disabilityCodeModel).orderBy(disabilityCodeModel.id);
}

/**
 * Retrieves a disability code by its ID.
 * @param id - The ID of the disability code.
 * @returns The found disability code record.
 * @throws Error if not found.
 */
export async function getDisabilityCodeById(id: number) {
  const [found] = await db
    .select()
    .from(disabilityCodeModel)
    .where(eq(disabilityCodeModel.id, id));

  if (!found) {
    throw new Error("Disability code with the specified ID was not found");
  }

  return found;
}

/**
 * Updates a disability code by its ID.
 * @param id - The ID of the disability code.
 * @param data - Object containing the new code string.
 * @returns The updated disability code record.
 * @throws Error if the code is invalid or not found.
 */
export async function updateDisabilityCode(id: number, data: { code: string }) {
  if (
    !data.code ||
    typeof data.code !== "string" ||
    data.code.trim().length < 2
  ) {
    throw new Error("Invalid code");
  }

  const [updated] = await db
    .update(disabilityCodeModel)
    .set({ code: data.code.trim() })
    .where(eq(disabilityCodeModel.id, id))
    .returning();

  if (!updated) {
    throw new Error("Disability code with the specified ID was not found");
  }

  return updated;
}

/**
 * Deletes a disability code by its ID.
 * @param id - The ID of the disability code.
 * @returns The deleted disability code record.
 * @throws Error if not found.
 */
export async function deleteDisabilityCode(id: number) {
  const [deleted] = await db
    .delete(disabilityCodeModel)
    .where(eq(disabilityCodeModel.id, id))
    .returning();

  if (!deleted) {
    throw new Error("Disability code with the specified ID was not found");
  }

  return deleted;
}
