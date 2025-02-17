import { db } from "@/db/index.js";
import { Stream, streamModel } from "@/features/academics/models/stream.model.js";
import { eq } from "drizzle-orm";

export async function addStream(stream: Stream): Promise<Stream | null> {
    const [newStream] = await db.insert(streamModel).values(stream).returning();

    return newStream;
}

export async function findAllStreams(): Promise<Stream[]> {
    const streams = await db.select().from(streamModel);

    return streams;
}

export async function findStreamById(id: number): Promise<Stream | null> {
    const [foundStream] = await db.select().from(streamModel).where(eq(streamModel.id, id));

    return foundStream;
}

export async function findStreamByName(name: string): Promise<Stream | null> {
    const [foundStream] = await db.select().from(streamModel).where(eq(streamModel.name, name.toUpperCase().trim()));

    return foundStream;
}