import { db } from "@/db/index";
import { Stream, streamModel } from "../models/stream.model";
import { eq } from "drizzle-orm";

export async function findStreamById(id: number): Promise<Stream | null> {
    const [foundStream] = await db.select().from(streamModel).where(eq(streamModel.id, id));

    return foundStream;
}