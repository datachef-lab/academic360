import { dbPostgres } from "@/db";
import { AcademicYear, academicYears } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";

export async function createAcademicYear(data: Omit<AcademicYear, "id" | "createdAt" | "updatedAt">): Promise<AcademicYear> {
    const [existing] = await dbPostgres
        .select()
        .from(academicYears)
        .where(ilike(academicYears.year, data.year));
    if (existing) {
        return existing;
    }
    const [created] = await dbPostgres
        .insert(academicYears)
        .values(data)
        .returning();
    return created;
}

export async function getAllAcademicYears(): Promise<AcademicYear[]> {
    return await dbPostgres.select().from(academicYears);
}

export async function getAcademicYearById(id: number): Promise<AcademicYear | null> {
    const [found] = await dbPostgres
        .select()
        .from(academicYears)
        .where(eq(academicYears.id, id));
    return found || null;
}

export async function updateAcademicYear(id: number, data: Partial<Omit<AcademicYear, "id">>): Promise<AcademicYear | null> {
    const [updated] = await dbPostgres
        .update(academicYears)
        .set(data)
        .where(eq(academicYears.id, id))
        .returning();
    return updated || null;
}

export async function deleteAcademicYear(id: number): Promise<boolean> {
    const result = await dbPostgres
        .delete(academicYears)
        .where(eq(academicYears.id, id));
    return result.length > 0;
}