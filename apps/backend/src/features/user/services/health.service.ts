import { HealthType } from "@/types/user/health.js";
import { Health, healthModel, createHealthSchema } from "../models/health.model.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { findBloodGroupById } from "@/features/resources/services/bloodGroup.service.js";
import { bloodGroupModel } from "@/features/resources/models/bloodGroup.model.js";
import { z } from "zod";

// Helper function to ensure we have proper Date objects, strictly typed
function ensureDateObjects<T extends { createdAt?: string | Date; updatedAt?: string | Date }>(obj: T): T {
    if (!obj) return obj;
    const result = { ...obj };
    if (typeof result.createdAt === 'string') {
        result.createdAt = new Date(result.createdAt);
    }
    if (typeof result.updatedAt === 'string') {
        result.updatedAt = new Date(result.updatedAt);
    }
    return result;
}

// Validate input using Zod schema
function validateHealthInput(data: Omit<HealthType, 'id'>) {
    const parseResult = createHealthSchema.safeParse(data);
    if (!parseResult.success) {
        const error = new Error("Validation failed: " + JSON.stringify(parseResult.error.issues));
        // @ts-expect-error
        error.status = 400;
        throw error;
    }
    return parseResult.data;
}

export async function addHealth(health: HealthType): Promise<HealthType | null> {
    try {
        const { bloodGroup, ...props } = health;
        // Validate input (excluding nested objects)
        validateHealthInput(props);
        // Ensure we have proper Date objects
        const sanitizedProps = ensureDateObjects(props);
        // Set dates if not provided
        if (!sanitizedProps.createdAt) {
            sanitizedProps.createdAt = new Date();
        }
        if (!sanitizedProps.updatedAt) {
            sanitizedProps.updatedAt = new Date();
        }
        // Insert the new health record
        const [newHealth] = await db.insert(healthModel).values({
            ...sanitizedProps,
            bloodGroupId: bloodGroup?.id
        }).returning();
        if (!newHealth) {
            return null;
        }
        // Now fetch the complete health record with blood group
        return findHealthById(newHealth.id);
    } catch (error) {
        console.error("Error in addHealth service:", error);
        return null;
    }
}

export async function findHealthById(id: number): Promise<HealthType | null> {
    try {
        // Perform a join with the blood group table to get ALL blood group fields
        const result = await db
            .select({
                health: healthModel,
                bloodGroup: {
                    id: bloodGroupModel.id,
                    type: bloodGroupModel.type,
                    createdAt: bloodGroupModel.createdAt,
                    updatedAt: bloodGroupModel.updatedAt
                }
            })
            .from(healthModel)
            .leftJoin(bloodGroupModel, eq(healthModel.bloodGroupId, bloodGroupModel.id))
            .where(eq(healthModel.id, id));
        if (!result || result.length === 0) {
            return null;
        }
        const { health, bloodGroup } = result[0];
        const { bloodGroupId, ...healthProps } = health;
        let sanitizedBloodGroup = null;
        if (bloodGroup?.id) {
            sanitizedBloodGroup = ensureDateObjects(bloodGroup);
        }
        const formattedHealth: HealthType = {
            ...ensureDateObjects(healthProps),
            bloodGroup: sanitizedBloodGroup
        };
        return formattedHealth;
    } catch (error) {
        console.error("Error in findHealthById service:", error);
        return null;
    }
}

export async function findHealthByStudentId(studentId: number): Promise<HealthType | null> {
    try {
        const result = await db
            .select({
                health: healthModel,
                bloodGroup: {
                    id: bloodGroupModel.id,
                    type: bloodGroupModel.type,
                    createdAt: bloodGroupModel.createdAt,
                    updatedAt: bloodGroupModel.updatedAt
                }
            })
            .from(healthModel)
            .leftJoin(bloodGroupModel, eq(healthModel.bloodGroupId, bloodGroupModel.id))
            .where(eq(healthModel.studentId, studentId));
        if (!result || result.length === 0) {
            return null;
        }
        const { health, bloodGroup } = result[0];
        const { bloodGroupId, ...healthProps } = health;
        let sanitizedBloodGroup = null;
        if (bloodGroup?.id) {
            sanitizedBloodGroup = ensureDateObjects(bloodGroup);
        }
        const formattedHealth: HealthType = {
            ...ensureDateObjects(healthProps),
            bloodGroup: sanitizedBloodGroup
        };
        return formattedHealth;
    } catch (error) {
        console.error("Error in findHealthByStudentId service:", error);
        return null;
    }
}

export async function updateHealth(id: number, health: HealthType): Promise<HealthType | null> {
    try {
        const { bloodGroup, studentId, ...props } = health;
        // Validate input (excluding nested objects)
        validateHealthInput({ ...props, studentId });
        // Ensure we have proper Date objects
        const sanitizedProps = ensureDateObjects({ ...props, studentId });
        sanitizedProps.updatedAt = new Date();
        // Update the health record
        const [updatedHealth] = await db.update(healthModel).set({
            ...sanitizedProps,
            bloodGroupId: bloodGroup?.id,
            updatedAt: new Date()
        }).where(eq(healthModel.id, id)).returning();
        if (!updatedHealth) {
            return null;
        }
        return findHealthById(updatedHealth.id);
    } catch (error) {
        console.error("Error in updateHealth service:", error);
        return null;
    }
}

export async function removeHealth(id: number): Promise<boolean | null> {
    try {
        const [foundHealth] = await db.select().from(healthModel).where(eq(healthModel.id, id));
        if (!foundHealth) {
            return null;
        }
        const [deletedHealth] = await db.delete(healthModel).where(eq(healthModel.id, id)).returning();
        if (!deletedHealth) {
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error in removeHealth service:", error);
        return false;
    }
}

export async function removeHealthByStudentId(studentId: number): Promise<boolean | null> {
    try {
        const [foundHealth] = await db.select().from(healthModel).where(eq(healthModel.studentId, studentId));
        if (!foundHealth) {
            return null;
        }
        const [deletedHealth] = await db.delete(healthModel).where(eq(healthModel.studentId, studentId)).returning();
        if (!deletedHealth) {
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error in removeHealthByStudentId service:", error);
        return false;
    }
}

export async function healthResponseFormat(health: Health): Promise<HealthType | null> {
    try {
        if (!health) {
            return null;
        }
        const { bloodGroupId, ...props } = health;
        const sanitizedProps = ensureDateObjects(props);
        const formattedHealth: HealthType = { ...sanitizedProps };
        if (bloodGroupId) {
            const bloodGroup = await findBloodGroupById(bloodGroupId);
            formattedHealth.bloodGroup = bloodGroup ? ensureDateObjects(bloodGroup) : null;
        } else {
            formattedHealth.bloodGroup = null;
        }
        return formattedHealth;
    } catch (error) {
        console.error("Error in healthResponseFormat service:", error);
        return null;
    }
}

export async function getAllHealths(): Promise<Health[]> {
    const healths = await db.select().from(healthModel);
    return healths;
}