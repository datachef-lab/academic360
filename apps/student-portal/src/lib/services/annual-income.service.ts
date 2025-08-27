import { dbPostgres } from "@/db";
import { AnnualIncome, annualIncomes } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function createAnnualIncome(givenAnnualIncome: AnnualIncome) {
    try {
        // Check if annual income range already exists
        const existingIncome = await dbPostgres
            .select()
            .from(annualIncomes)
            .where(eq(annualIncomes.range, givenAnnualIncome.range))
            .limit(1);

        if (existingIncome.length > 0) {
            return { 
                success: false, 
                error: `Annual income range '${givenAnnualIncome.range}' already exists.` 
            };
        }

        const [newAnnualIncome] = await dbPostgres.insert(annualIncomes).values(givenAnnualIncome).returning();
        return { success: true, data: newAnnualIncome };
    } catch (error) {
        console.error("Error creating annual income:", error);
        return { 
            success: false, 
            error: "Failed to create annual income. Please try again." 
        };
    }
}

export async function getAllAnnualIncomes() {
    const incomes = await dbPostgres.select().from(annualIncomes).where(eq(annualIncomes.disabled, false));
    return incomes;
}

export async function getAnnualIncomeById(id: number) {
    const [incomeRecord] = await dbPostgres
        .select()
        .from(annualIncomes)
        .where(eq(annualIncomes.id, id))
        .limit(1);
    return incomeRecord;
}

export async function updateAnnualIncome(id: number, givenAnnualIncome: Partial<AnnualIncome>) {
    try {
        // If range is being updated, check for duplicates
        if (givenAnnualIncome.range) {
            const existingIncome = await dbPostgres
                .select()
                .from(annualIncomes)
                .where(
                    and(
                        eq(annualIncomes.range, givenAnnualIncome.range),
                        ne(annualIncomes.id, id)
                    )
                )
                .limit(1);

            if (existingIncome.length > 0) {
                return { 
                    success: false, 
                    error: `Annual income range '${givenAnnualIncome.range}' already exists.` 
                };
            }
        }

        const [updatedIncome] = await dbPostgres
            .update(annualIncomes)
            .set({ ...givenAnnualIncome, updatedAt: new Date().toISOString() })
            .where(eq(annualIncomes.id, id))
            .returning();

        if (!updatedIncome) {
            return { success: false, error: "Annual income not found" };
        }

        return { success: true, data: updatedIncome };
    } catch (error) {
        console.error("Error updating annual income:", error);
        return { 
            success: false, 
            error: "Failed to update annual income. Please try again." 
        };
    }
}

export async function toggleAnnualIncomeStatus(id: number) {
    try {
        const [currentIncome] = await dbPostgres
            .select()
            .from(annualIncomes)
            .where(eq(annualIncomes.id, id))
            .limit(1);

        if (!currentIncome) {
            return { success: false, error: "Annual income not found" };
        }

        const [toggledIncome] = await dbPostgres
            .update(annualIncomes)
            .set({ 
                disabled: !currentIncome.disabled,
                updatedAt: new Date().toISOString() 
            })
            .where(eq(annualIncomes.id, id))
            .returning();

        return { success: true, data: toggledIncome };
    } catch (error) {
        console.error("Error toggling annual income status:", error);
        return { 
            success: false, 
            error: "Failed to toggle annual income status. Please try again." 
        };
    }
}