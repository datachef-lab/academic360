import { db } from "@/db/index.js";
import { Stream, streamModel } from "@/features/academics/models/stream.model.js";
import { eq } from "drizzle-orm";

export async function findStreamById(id: number): Promise<Stream | null> {
    const [foundStream] = await db.select().from(streamModel).where(eq(streamModel.id, id));

    return foundStream;
}