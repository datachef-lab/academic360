import { db } from "@/db/index.js";
import { streamModel, createStreamModel, Stream } from "@/features/course-design/models/stream.model.js";
import { eq } from "drizzle-orm";

export async function createStream(data: Omit<Stream, 'id' | 'createdAt' | 'updatedAt'>) {
    const validated = createStreamModel.parse(data);
    const [created] = await db.insert(streamModel).values(validated).returning();
    return created;
}

export async function getStreamById(id: number) {
    const [stream] = await db.select().from(streamModel).where(eq(streamModel.id, id));
    return stream;
}

export async function getAllStreams() {
    return db.select().from(streamModel);
}

export async function updateStream(id: number, data: Partial<Stream>) {
    const { createdAt, updatedAt, ...rest } = data;
    const validated = createStreamModel.partial().parse(rest);
    const [updated] = await db.update(streamModel).set(validated).where(eq(streamModel.id, id)).returning();
    return updated;
}

export async function deleteStream(id: number) {
    const [deleted] = await db.delete(streamModel).where(eq(streamModel.id, id)).returning();
    return deleted;
} 