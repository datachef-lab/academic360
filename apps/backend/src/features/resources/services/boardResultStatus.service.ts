import { db } from "@/db/index.js";
import { BoardResultStatus, boardResultStatusModel } from "@/features/resources/models/boardResultStatus.model.js";
import { eq } from "drizzle-orm";

export async function findBoardResultStatusById(id: number): Promise<BoardResultStatus | null> {
    const [foundBoardResultStatus] = await db.select().from(boardResultStatusModel).where(eq(boardResultStatusModel.id, id));
    return foundBoardResultStatus;
}

export async function findAllBoardResultStatuses(): Promise<BoardResultStatus[]> {
    return await db.select().from(boardResultStatusModel).orderBy(boardResultStatusModel.sequence);
}

export async function createBoardResultStatus(data: Omit<BoardResultStatus, 'id' | 'createdAt' | 'updatedAt'>): Promise<BoardResultStatus> {
    const [newBoardResultStatus] = await db
        .insert(boardResultStatusModel)
        .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        .returning();
    
    return newBoardResultStatus;
}

export async function updateBoardResultStatus(id: number, data: Partial<Omit<BoardResultStatus, 'id' | 'createdAt' | 'updatedAt'>>): Promise<BoardResultStatus | null> {
    const [updatedBoardResultStatus] = await db
        .update(boardResultStatusModel)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(boardResultStatusModel.id, id))
        .returning();
    
    return updatedBoardResultStatus || null;
}

export async function deleteBoardResultStatus(id: number): Promise<BoardResultStatus | null> {
    const [deletedBoardResultStatus] = await db
        .delete(boardResultStatusModel)
        .where(eq(boardResultStatusModel.id, id))
        .returning();
    
    return deletedBoardResultStatus || null;
}

export async function findBoardResultStatusByName(name: string): Promise<BoardResultStatus | null> {
    const [foundBoardResultStatus] = await db
        .select()
        .from(boardResultStatusModel)
        .where(eq(boardResultStatusModel.name, name));
    
    return foundBoardResultStatus || null;
}

// Legacy function for backward compatibility
export async function CreateResultStatus(data: BoardResultStatus) {
    const newBoardResultStatus = await db.insert(boardResultStatusModel).values(data);
    return newBoardResultStatus;
}

// asda