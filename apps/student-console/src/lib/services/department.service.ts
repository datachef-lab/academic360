import { dbPostgres } from "@/db";
import { Department, departments } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";

export async function createDepartment(data: Omit<Department, "id" | "createdAt" | "updatedAt">): Promise<Department> {
    const [existingDepartment] = await dbPostgres
        .select()
        .from(departments)
        .where(ilike(departments.name, data.name));
    if (existingDepartment) {
        return existingDepartment;
    }
    const [created] = await dbPostgres
        .insert(departments)
        .values(data)
        .returning();
    return created;
}

export async function getAllDepartments(): Promise<Department[]> {
    return await dbPostgres.select().from(departments);
}

export async function getDepartmentById(id: number): Promise<Department | null> {
    const [found] = await dbPostgres
        .select()
        .from(departments)
        .where(eq(departments.id, id));
    return found || null;
}

export async function updateDepartment(id: number, data: Partial<Omit<Department, "id">>): Promise<Department | null> {
    const [updated] = await dbPostgres
        .update(departments)
        .set(data)
        .where(eq(departments.id, id))
        .returning();
    return updated || null;
}

export async function deleteDepartment(id: number): Promise<boolean> {
    const result = await dbPostgres
        .delete(departments)
        .where(eq(departments.id, id));
    return result.length > 0;
}
