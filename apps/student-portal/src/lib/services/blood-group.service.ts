import { dbPostgres } from "@/db/index";
import { BloodGroup, bloodGroup } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function createBloodGroup(givenBloodGroup: BloodGroup) {
    try {
        // Check if blood group type already exists
        const existingBloodGroup = await dbPostgres
            .select()
            .from(bloodGroup)
            .where(eq(bloodGroup.type, givenBloodGroup.type))
            .limit(1);

        if (existingBloodGroup.length > 0) {
            return { 
                success: false, 
                error: `Blood group type '${givenBloodGroup.type}' already exists.` 
            };
        }

        const [newBloodGroup] = await dbPostgres.insert(bloodGroup).values(givenBloodGroup).returning();
        return { success: true, data: newBloodGroup };
    } catch (error) {
        console.error("Error creating blood group:", error);
        return { 
            success: false, 
            error: "Failed to create blood group. Please try again." 
        };
    }
}

export async function getAllBloodGroups() {
    const bloodGroups = await dbPostgres.select().from(bloodGroup).where(eq(bloodGroup.disabled, false));
    return bloodGroups;
}

export async function getBloodGroupById(id: number) {
    const [bloodGroupRecord] = await dbPostgres
        .select()
        .from(bloodGroup)
        .where(eq(bloodGroup.id, id))
        .limit(1);
    return bloodGroupRecord;
}

export async function updateBloodGroup(id: number, givenBloodGroup: Partial<BloodGroup>) {
    try {
        // If type is being updated, check for duplicates
        if (givenBloodGroup.type) {
            const existingBloodGroup = await dbPostgres
                .select()
                .from(bloodGroup)
                .where(
                    and(
                        eq(bloodGroup.type, givenBloodGroup.type),
                        ne(bloodGroup.id, id)
                    )
                )
                .limit(1);

            if (existingBloodGroup.length > 0) {
                return { 
                    success: false, 
                    error: `Blood group type '${givenBloodGroup.type}' already exists.` 
                };
            }
        }

        const [updatedBloodGroup] = await dbPostgres
            .update(bloodGroup)
            .set({ ...givenBloodGroup, updatedAt: new Date().toISOString() })
            .where(eq(bloodGroup.id, id))
            .returning();

        if (!updatedBloodGroup) {
            return { success: false, error: "Blood group not found" };
        }

        return { success: true, data: updatedBloodGroup };
    } catch (error) {
        console.error("Error updating blood group:", error);
        return { 
            success: false, 
            error: "Failed to update blood group. Please try again." 
        };
    }
}

export async function toggleBloodGroupStatus(id: number) {
    try {
        const [currentBloodGroup] = await dbPostgres
            .select()
            .from(bloodGroup)
            .where(eq(bloodGroup.id, id))
            .limit(1);

        if (!currentBloodGroup) {
            return { success: false, error: "Blood group not found" };
        }

        const [toggledBloodGroup] = await dbPostgres
            .update(bloodGroup)
            .set({ 
                disabled: !currentBloodGroup.disabled,
                updatedAt: new Date().toISOString() 
            })
            .where(eq(bloodGroup.id, id))
            .returning();

        return { success: true, data: toggledBloodGroup };
    } catch (error) {
        console.error("Error toggling blood group status:", error);
        return { 
            success: false, 
            error: "Failed to toggle blood group status. Please try again." 
        };
    }
}