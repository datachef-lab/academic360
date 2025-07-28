import { HealthType } from "@/types/user/health.js";
import { Health, healthModel } from "../models/health.model.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { findBloodGroupById } from "@/features/resources/services/bloodGroup.service.js";
import { bloodGroupModel } from "@/features/resources/models/bloodGroup.model.js";
import { BloodGroupType } from "@/types/resources/blood-group.js";

interface DateObject {
    createdAt?: string | Date;
    updatedAt?: string | Date;
    [key: string]: unknown;
}

// Helper function to ensure we have proper Date objects
const ensureDateObjects = (obj: DateObject): DateObject => {
    if (!obj) return obj;
    
    // Create a new object with the same properties
    const result = { ...obj };
    
    // Convert string dates to Date objects
    if (typeof result.createdAt === 'string') {
        result.createdAt = new Date(result.createdAt);
    }
    
    if (typeof result.updatedAt === 'string') {
        result.updatedAt = new Date(result.updatedAt);
    }
    
    return result;
};

export async function addHealth(health: HealthType): Promise<HealthType | null> {
    try {
        const { bloodGroup, ...props } = health;

        // Ensure we have proper Date objects
        const sanitizedProps = ensureDateObjects(props);
        
        // Set dates if not provided
        if (!sanitizedProps.createdAt) {
            sanitizedProps.createdAt = new Date();
        }
        if (!sanitizedProps.updatedAt) {
            sanitizedProps.updatedAt = new Date();
        }

        // Prepare insert data without bloodGroupId
        const insertData = {
            ...sanitizedProps,
            createdAt: sanitizedProps.createdAt as Date,
            updatedAt: sanitizedProps.updatedAt as Date,
            bloodGroupId: bloodGroup?.id || null
        };

        // Insert the new health record
        const [newHealth] = await db.insert(healthModel).values(insertData).returning();

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
                // Select all fields from health model
                health: healthModel,
                // Select all fields from blood group model
                bloodGroup: {
                    id: bloodGroupModel.id,
                    type: bloodGroupModel.type,
                    sequence: bloodGroupModel.sequence,
                    disabled: bloodGroupModel.disabled,
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
        
        // Format the response with complete blood group data
        const { bloodGroupId, ...healthProps } = health;
        
        // Convert string dates to Date objects in bloodGroup
        let sanitizedBloodGroup: BloodGroupType | null = null;
        if (bloodGroup?.id) {
            const sanitized = ensureDateObjects(bloodGroup);
            sanitizedBloodGroup = {
                id: sanitized.id as number,
                type: sanitized.type as string,
                sequence: sanitized.sequence as number | null,
                disabled: sanitized.disabled as boolean,
                createdAt: sanitized.createdAt as Date,
                updatedAt: sanitized.updatedAt as Date
            };
        }
        
        const sanitizedHealthProps = ensureDateObjects(healthProps);
        const formattedHealth: HealthType = {
            ...sanitizedHealthProps,
            createdAt: sanitizedHealthProps.createdAt as Date,
            updatedAt: sanitizedHealthProps.updatedAt as Date,
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
        // Perform a join with the blood group table to get ALL blood group fields
        const result = await db
            .select({
                // Select all fields from health model
                health: healthModel,
                // Select all fields from blood group model
                bloodGroup: {
                    id: bloodGroupModel.id,
                    type: bloodGroupModel.type,
                    sequence: bloodGroupModel.sequence,
                    disabled: bloodGroupModel.disabled,
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
        
        // Format the response with complete blood group data
        const { bloodGroupId, ...healthProps } = health;
        
        // Convert string dates to Date objects in bloodGroup
        let sanitizedBloodGroup: BloodGroupType | null = null;
        if (bloodGroup?.id) {
            const sanitized = ensureDateObjects(bloodGroup);
            sanitizedBloodGroup = {
                id: sanitized.id as number,
                type: sanitized.type as string,
                sequence: sanitized.sequence as number | null,
                disabled: sanitized.disabled as boolean,
                createdAt: sanitized.createdAt as Date,
                updatedAt: sanitized.updatedAt as Date
            };
        }
        
        const sanitizedHealthProps = ensureDateObjects(healthProps);
        const formattedHealth: HealthType = {
            ...sanitizedHealthProps,
            createdAt: sanitizedHealthProps.createdAt as Date,
            updatedAt: sanitizedHealthProps.updatedAt as Date,
            bloodGroup: sanitizedBloodGroup
        };
        
        return formattedHealth;
    } catch (error) {
        console.error("Error in findHealthByStudentId service:", error);
        return null;
    }
}

export async function removeHealth(id: number): Promise<boolean | null> {
    try {
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
    } catch (error) {
        console.error("Error in removeHealth service:", error);
        return false;
    }
}

export async function removeHealthByStudentId(studentId: number): Promise<boolean | null> {
    try {
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

        // Ensure we have proper Date objects
        const sanitizedProps = ensureDateObjects(props);

        const formattedHealth: HealthType = { 
            ...sanitizedProps,
            createdAt: sanitizedProps.createdAt as Date,
            updatedAt: sanitizedProps.updatedAt as Date
        };

        // Always include bloodGroup in the response, even if null
        if (bloodGroupId) {
            const bloodGroup = await findBloodGroupById(bloodGroupId);
            if (bloodGroup) {
                const sanitized = ensureDateObjects(bloodGroup);
                formattedHealth.bloodGroup = {
                    id: sanitized.id as number,
                    type: sanitized.type as string,
                    sequence: sanitized.sequence as number | null,
                    disabled: sanitized.disabled as boolean,
                    createdAt: sanitized.createdAt as Date,
                    updatedAt: sanitized.updatedAt as Date
                };
            } else {
                formattedHealth.bloodGroup = null;
            }
        } else {
            formattedHealth.bloodGroup = null;
        }

        return formattedHealth;
    } catch (error) {
        console.error("Error in healthResponseFormat service:", error);
        return null;
    }
}