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

// 1. Standardized Response Type
export type ServiceResult<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
};

/**
 * Creates a new Addon.
 */
export const createAddon = async (
  data: AddOn,
): Promise<ServiceResult<typeof addonModel.$inferSelect>> => {
  try {
    const [newAddon] = await db.insert(addonModel).values(data).returning();

    return {
      success: true,
      message: "Addon created successfully",
      data: newAddon,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to create addon",
      error,
    };
  }
};

/**
 * Retrieves all Addons.
 */
export const getAllAddons = async (): Promise<
  ServiceResult<(typeof addonModel.$inferSelect)[]>
> => {
  try {
    const addons = await db.select().from(addonModel);

    return {
      success: true,
      message: "Addons retrieved successfully",
      data: addons,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to retrieve addons",
      error,
    };
  }
};

/**
 * Retrieves a single Addon by its ID.
 */
export const getAddonById = async (
  id: number,
): Promise<ServiceResult<typeof addonModel.$inferSelect>> => {
  try {
    const [addon] = await db
      .select()
      .from(addonModel)
      .where(eq(addonModel.id, id));

    if (!addon) {
      return {
        success: false,
        message: `Addon with ID ${id} not found`,
      };
    }

    return {
      success: true,
      message: "Addon retrieved successfully",
      data: addon,
    };
  } catch (error) {
    return {
      success: false,
      message: "Error retrieving addon",
      error,
    };
  }
};

/**
 * Updates an existing Addon.
 */
export const updateAddon = async (
  id: number,
  data: Partial<AddOn>,
): Promise<ServiceResult<typeof addonModel.$inferSelect>> => {
  try {
    const [updatedAddon] = await db
      .update(addonModel)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(addonModel.id, id))
      .returning();

    if (!updatedAddon) {
      return {
        success: false,
        message: `Addon with ID ${id} not found`,
      };
    }

    return {
      success: true,
      message: "Addon updated successfully",
      data: updatedAddon,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to update addon",
      error,
    };
  }
};

/**
 * Deletes an Addon by ID.
 */
export const deleteAddon = async (
  id: number,
): Promise<ServiceResult<typeof addonModel.$inferSelect>> => {
  try {
    const [deletedAddon] = await db
      .delete(addonModel)
      .where(eq(addonModel.id, id))
      .returning();

    if (!deletedAddon) {
      return {
        success: false,
        message: `Addon with ID ${id} not found`,
      };
    }

    return {
      success: true,
      message: "Addon deleted successfully",
      data: deletedAddon,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to delete addon",
      error,
    };
  }
};
