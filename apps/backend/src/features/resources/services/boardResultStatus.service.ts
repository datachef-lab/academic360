import { db } from "@/db/index";
import { boardResultStatusModel } from "../models/boardResultStatus.model";
import { eq } from "drizzle-orm";

export async function findBoardResultStatusById(id: number) {
    const [foundBoardResultStatus] = await db.select().from(boardResultStatusModel).where(eq(boardResultStatusModel.id, id));

    return foundBoardResultStatus;
}