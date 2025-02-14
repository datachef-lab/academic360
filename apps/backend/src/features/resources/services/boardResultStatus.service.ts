import { db } from "@/db/index.js";
import { boardResultStatusModel } from "@/features/resources/models/boardResultStatus.model.js";
import { eq } from "drizzle-orm";

export async function findBoardResultStatusById(id: number) {
    const [foundBoardResultStatus] = await db.select().from(boardResultStatusModel).where(eq(boardResultStatusModel.id, id));

    return foundBoardResultStatus;
}