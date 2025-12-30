// import { db } from "@/db/index.js";
// import { addonModel, AddOn } from "../models/addon.model.js";
// // import { AddOn } from "../types/addon";
// import { eq } from "drizzle-orm";

// export const getAddons = async () => {
//   try {
//     const addons = await db.select().from(addonModel);
//     return addons;
//   } catch (error) {
//     return null;
//   }
// };

// export const getAddonById = async (id: number) => {
//   try {
//     const addon = await db
//       .select()
//       .from(addonModel)
//       .where(eq(addonModel.id, id));
//     return addon[0];
//   } catch (error) {
//     return null;
//   }
// };

// export const createAddon = async (addon: AddOn) => {
//   try {
//     const newAddon = await db.insert(addonModel).values(addon).returning();
//     return newAddon[0];
//   } catch (error) {
//     return null;
//   }
// };

// export const updateAddon = async (id: number, addon: AddOn) => {
//   try {
//     const updatedAddon = await db
//       .update(addonModel)
//       .set(addon)
//       .where(eq(addonModel.id, id))
//       .returning();
//     return updatedAddon[0];
//   } catch (error) {
//     return null;
//   }
// };

// export const deleteAddon = async (id: number) => {
//   try {
//     const deletedAddon = await db
//       .delete(addonModel)
//       .where(eq(addonModel.id, id))
//       .returning();
//     return deletedAddon[0];
//   } catch (error) {
//     return null;
//   }
// };

import { db } from "@/db";
import { AddOn, addonModel } from "@repo/db/schemas";
import { eq } from "drizzle-orm";

/**
 * Creates a new Addon.
 *
 * NOTE: Service functions must return raw DTOs / primitive values / null and not
 * wrap errors in try/catch – controller handles errors.
 */
export const createAddon = async (
  data: AddOn,
): Promise<typeof addonModel.$inferSelect> => {
  const [newAddon] = await db.insert(addonModel).values(data).returning();
  return newAddon;
};

/**
 * Retrieves all Addons.
 */
export const getAllAddons = async (): Promise<
  (typeof addonModel.$inferSelect)[]
> => {
  const addons = await db.select().from(addonModel);
  return addons;
};

/**
 * Retrieves a single Addon by its ID.
 */
export const getAddonById = async (
  id: number,
): Promise<typeof addonModel.$inferSelect | null> => {
  const [addon] = await db
    .select()
    .from(addonModel)
    .where(eq(addonModel.id, id));

  return addon ?? null;
};

/**
 * Updates an existing Addon.
 */
export const updateAddon = async (
  id: number,
  data: Partial<AddOn>,
): Promise<typeof addonModel.$inferSelect | null> => {
  const [updatedAddon] = await db
    .update(addonModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(addonModel.id, id))
    .returning();

  return updatedAddon ?? null;
};

/**
 * Deletes an Addon by ID.
 */
export const deleteAddon = async (
  id: number,
): Promise<typeof addonModel.$inferSelect | null> => {
  const [deletedAddon] = await db
    .delete(addonModel)
    .where(eq(addonModel.id, id))
    .returning();

  return deletedAddon ?? null;
};
