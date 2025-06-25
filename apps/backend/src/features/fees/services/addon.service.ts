import { db } from "@/db/index.js";
import { addonModel, AddOn } from "../models/addon.model.js";
// import { AddOn } from "../types/addon";
import { eq } from "drizzle-orm";

export const getAddons = async () => {
    try {
        const addons = await db.select().from(addonModel);
        return addons;
    } catch (error) {
        return null;
    }
};

export const getAddonById = async (id: number) => {
    try {
        const addon = await db.select().from(addonModel).where(eq(addonModel.id, id));
        return addon[0];
    } catch (error) {
        return null;
    }
};

export const createAddon = async (addon: AddOn) => {
    try {
        const newAddon = await db.insert(addonModel).values(addon).returning();
        return newAddon[0];
    } catch (error) {
        return null;
    }
};

export const updateAddon = async (id: number, addon: AddOn) => {
    try {
        const updatedAddon = await db.update(addonModel).set(addon).where(eq(addonModel.id, id)).returning();
        return updatedAddon[0];
    } catch (error) {
        return null;
    }
};

export const deleteAddon = async (id: number) => {
    try {
        const deletedAddon = await db.delete(addonModel).where(eq(addonModel.id, id)).returning();
        return deletedAddon[0];
    } catch (error) {
        return null;
    }
};
