import { db } from "@/db/index.js";
import {
    academicYearModel,
    AcademicYear,
} from "../models/academic-year.model.js";
import { eq, and, desc } from "drizzle-orm";
import { Session, sessionModel } from "../models/session.model.js";

export async function createAcademicYear(
    academicYear: Omit<AcademicYear, "id" | "createdAt" | "updatedAt">,
    session: Omit<Session, "id" | "createdAt" | "updatedAt">,
): Promise<AcademicYear | null> {
    let [existingSession] = await db
        .select()
        .from(sessionModel)
        .where(
            and(
                eq(sessionModel.name, session.name),
                eq(sessionModel.from, session.from),
                eq(sessionModel.to, session.to),
            ),
        );
    if (!existingSession) {
        console.log("session:", session);

        existingSession = (
            await db
                .insert(sessionModel)
                .values({
                    name: session.name,
                    from: session.from,
                    to: session.to,
                    isCurrentSession: session.isCurrentSession || false,
                    codePrefix: session.codePrefix || null,
                })
                .returning()
        )[0];
    }

    const [newAcademicYear] = await db
        .insert(academicYearModel)
        .values(academicYear)
        .returning();

    return await newAcademicYear;
}

export async function findAllAcademicYears(): Promise<AcademicYear[]> {
    const academicYears = await db
        .select()
        .from(academicYearModel)
        .orderBy(desc(academicYearModel.year));
    return academicYears.filter((year) => year !== null);
}

export async function findAcademicYearById(
    id: number,
): Promise<AcademicYear | null> {
    const [academicYear] = await db
        .select()
        .from(academicYearModel)
        .where(eq(academicYearModel.id, id));
    return academicYear;
}

export async function findCurrentAcademicYear(): Promise<AcademicYear | null> {
    const [academicYear] = await db
        .select()
        .from(academicYearModel)
        .where(eq(academicYearModel.isCurrentYear, true));
    return academicYear || null;
}

export async function updateAcademicYear(
    id: number,
    academicYear: Partial<AcademicYear>,
): Promise<AcademicYear | null> {
    const [updatedAcademicYear] = await db
        .update(academicYearModel)
        .set(academicYear)
        .where(eq(academicYearModel.id, id))
        .returning();

    return await updatedAcademicYear;
}

export async function deleteAcademicYear(
    id: number,
): Promise<AcademicYear | null> {
    //   const [deletedAcademicYear] = await db
    //     .delete(academicYearModel)
    //     .where(eq(academicYearModel.id, id))
    //     .returning();

    return null;
}

export async function setCurrentAcademicYear(
    id: number,
): Promise<AcademicYear | null> {
    // First, set all academic years to not current
    await db
        .update(academicYearModel)
        .set({ isCurrentYear: false })
        .where(eq(academicYearModel.isCurrentYear, true));

    // Then set the specified academic year as current
    const [currentAcademicYear] = await db
        .update(academicYearModel)
        .set({ isCurrentYear: true })
        .where(eq(academicYearModel.id, id))
        .returning();

    return currentAcademicYear || null;
}

export async function findAcademicYearByYearRange(
    year: string,
    endYear: string,
): Promise<AcademicYear | null> {
    const [academicYear] = await db
        .select()
        .from(academicYearModel)
        .where(
            and(
                eq(academicYearModel.year, year),
                // eq(academicYearModel.endYear, endYear)
            ),
        );

    return academicYear;
}
