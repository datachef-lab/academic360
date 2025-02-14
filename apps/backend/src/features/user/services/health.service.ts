import { HealthType } from "@/types/user/health.js";
import { Health, healthModel } from "../models/health.model.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { findBloodGroupById } from "@/features/resources/services/bloodGroup.service.js";

export async function addHealth(health: HealthType): Promise<HealthType | null> {
    const { bloodGroup, ...props } = health;

    const [newHealth] = await db.insert(healthModel).values({ ...props, bloodGroupId: bloodGroup?.id }).returning();

    const formatedHealth = await healthResponseFormat(newHealth);

    return formatedHealth;
}

export async function findHealthById(id: number): Promise<HealthType | null> {
    const [foundHealth] = await db.select().from(healthModel).where(eq(healthModel.id, id));

    const formatedHealth = await healthResponseFormat(foundHealth);

    return formatedHealth;
}

export async function removeHealth(id: number): Promise<boolean | null> {
    // Return if the health doesn't exist
    const [foundHealth] = await db.select().from(healthModel).where(eq(healthModel.id, id));
    if (!foundHealth) {
        return null;
    }
    // Delete the health
    const [deletedHealth] = await db.delete(healthModel).where(eq(healthModel.id, id)).returning();
    if (!deletedHealth) {
        return false; // Failure!
    }

    return true; // Success!
}

export async function removeHealthByStudentId(studentId: number): Promise<boolean | null> {
    // Return if the health doesn't exist
    const [foundHealth] = await db.select().from(healthModel).where(eq(healthModel.studentId, studentId));
    if (!foundHealth) {
        return null;
    }
    // Delete the health
    const [deletedHealth] = await db.delete(healthModel).where(eq(healthModel.studentId, studentId)).returning();
    if (!deletedHealth) {
        return false; // Failure!
    }

    return true; // Success!
}

export async function healthResponseFormat(health: Health): Promise<HealthType | null> {
    if (!health) {
        return null;
    }

    const { bloodGroupId, ...props } = health;

    const formattedHealth: HealthType = { ...props };

    if (bloodGroupId) {
        formattedHealth.bloodGroup = await findBloodGroupById(bloodGroupId);
    }

    return formattedHealth;
}