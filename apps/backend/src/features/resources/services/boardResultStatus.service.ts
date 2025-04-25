import { db } from "@/db/index.js";
import { BoardResultStatus, boardResultStatusModel } from "@/features/resources/models/boardResultStatus.model.js";
import { eq } from "drizzle-orm";

export async function findBoardResultStatusById(id: number) {
    const [foundBoardResultStatus] = await db.select().from(boardResultStatusModel).where(eq(boardResultStatusModel.id, id));

    return foundBoardResultStatus;
}
export async function CreateResultStatus (data:BoardResultStatus){
    const newBoardResultStatus = await db.insert(boardResultStatusModel).values(data);
    return newBoardResultStatus;
}

// asda