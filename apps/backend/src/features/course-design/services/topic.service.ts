import { db } from "@/db/index.js";
import { topicModel, createTopicSchema, Topic } from "@/features/course-design/models/topic.model.js";
import { eq } from "drizzle-orm";

export async function createTopic(data: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>) {
    const validated = createTopicSchema.parse(data);
    const [created] = await db.insert(topicModel).values(validated).returning();
    return created;
}

export async function getTopicById(id: number) {
    const [topic] = await db.select().from(topicModel).where(eq(topicModel.id, id));
    return topic;
}

export async function getAllTopics() {
    return db.select().from(topicModel);
}

export async function updateTopic(id: number, data: Partial<Topic>) {
    const { createdAt, updatedAt, ...rest } = data;
    const validated = createTopicSchema.partial().parse(rest);
    const [updated] = await db.update(topicModel).set(validated).where(eq(topicModel.id, id)).returning();
    return updated;
}

export async function deleteTopic(id: number) {
    const [deleted] = await db.delete(topicModel).where(eq(topicModel.id, id)).returning();
    return deleted;
} 
