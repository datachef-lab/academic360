import { dbPostgres } from "@/db";
import { boardUniversities, BoardUniversity, degree } from "@/db/schema";
import { BoardUniversityDto } from "@/types/admissions";
import { eq, ilike } from "drizzle-orm";
import { createSubject, getSubjectByBoardUniversityId } from "./academic-subject.service";

export async function getAllBoardUniversities(disabled?: boolean) {
    const query = dbPostgres.select().from(boardUniversities);
    if (disabled !== undefined) {
        const arr = await query.where(eq(boardUniversities.disabled, disabled));
        return await Promise.all(
            arr.map(async (ele) => await formatToDto(ele))
        )
    }
    return await Promise.all(
        (await query).map(async (ele) => await formatToDto(ele))
    );
}

export async function getBoardUniversityById(id: number) {
    const [university] = await dbPostgres
        .select()
        .from(boardUniversities)
        .where(eq(boardUniversities.id, id));
    return university ? await formatToDto(university) : null;
}

export async function createBoardUniversity(data: BoardUniversityDto) {
    const {subjects, ...base } = data;
    const [existingUniversity] = await dbPostgres
        .select()
        .from(boardUniversities)
        .where(ilike(boardUniversities.name, base.name));

    if (existingUniversity) {
        for (const subject of subjects) {
            subject.boardUniversityId = existingUniversity.id;
            await createSubject(subject);
        }
        return { university: existingUniversity, message: "Board/University already exists." };
    }

    const [newUniversity] = await dbPostgres
        .insert(boardUniversities)
        .values(base)
        .returning();

    // Add the academic subjects
    for (const subject of subjects) {
        subject.boardUniversityId = newUniversity.id;
        await createSubject(subject);
    }
    const university = await formatToDto(newUniversity);
    return { university, message: "New Board/University Created!" };
}

export async function updateBoardUniversity(id: number, data: Omit<BoardUniversityDto, "id" | "createdAt" | "updatedAt">) {
    const  { subjects, ...base } = data;
    const [updatedUniversity] = await dbPostgres
        .update(boardUniversities)
        .set(base)
        .where(eq(boardUniversities.id, id))
        .returning();
    return (await formatToDto(updatedUniversity)) || null;
}

export async function toggleBoardUniversityStatus(id: number) {
    // First get the current status
    const [university] = await dbPostgres
        .select()
        .from(boardUniversities)
        .where(eq(boardUniversities.id, id));

    if (!university) {
        return null;
    }

    // Toggle the disabled status
    const [updatedUniversity] = await dbPostgres
        .update(boardUniversities)
        .set({ disabled: !university.disabled })
        .where(eq(boardUniversities.id, id))
        .returning();
const dto = await formatToDto(updatedUniversity);
    return {
        university: dto,
        message: updatedUniversity?.disabled 
            ? "Board/University disabled successfully" 
            : "Board/University enabled successfully"
    };
}

async function formatToDto(boardUniversity: BoardUniversity): Promise<BoardUniversityDto | null> {
    const subjects = await getSubjectByBoardUniversityId(boardUniversity.id!);

    let degreeName: string | undefined;
    if (boardUniversity.degreeId) {
        const [foundDegree] = await dbPostgres
            .select()
            .from(degree)
            .where(
                eq(degree.id, boardUniversity.degreeId)
            );
        degreeName = foundDegree.name;
    }

    return {
        ...boardUniversity,
        subjects,
        degreeName
    }
}