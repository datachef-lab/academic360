import { db } from "@/db";
import { feesComponentModel, FeesComponent } from "../models/fees-component.model";
// import { FeesComponent } from "../types/fees-component";
import { eq } from "drizzle-orm";
import { handleError } from "@/utils";

export const getFeesComponents = async () => {
    try {
        const feesComponents = await db.select().from(feesComponentModel);
        return feesComponents;
    } catch (error) {
        return null;
    }
};

export const getFeesComponentById = async (id: number) => {
    try {
        const feesComponent = await db.select().from(feesComponentModel).where(eq(feesComponentModel.id, id));
        return feesComponent[0];
    } catch (error) {
        return null;
    }
};

export const createFeesComponent = async (feesComponent: FeesComponent) => {
    try {
        const newFeesComponent = await db.insert(feesComponentModel).values(feesComponent).returning();
        return newFeesComponent[0];
    } catch (error) {
        return null;
    }
};

export const updateFeesComponent = async (id: number, feesComponent: FeesComponent) => {
    try {
        const updatedFeesComponent = await db.update(feesComponentModel).set(feesComponent).where(eq(feesComponentModel.id, id)).returning();
        return updatedFeesComponent[0];
    } catch (error) {
        return null;
    }
};

export const deleteFeesComponent = async (id: number) => {
    try {
        const deletedFeesComponent = await db.delete(feesComponentModel).where(eq(feesComponentModel.id, id)).returning();
        return deletedFeesComponent[0];
    } catch (error) {
        return null;
    }
};
