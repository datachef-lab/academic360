import { db } from "@/db";
import { topics } from "../models/topic.model";
import { eq } from "drizzle-orm";
import { TopicSchema } from "@/types/course-design";
import { z } from "zod";

// Types
export type TopicData = z.infer<typeof TopicSchema>;

// Create a new topic
export const createTopic = async (topicData: TopicData & { paperId: string }) => {
  const validatedData = TopicSchema.parse(topicData);
  const newTopic = await db.insert(topics).values({
    ...validatedData,
    paperId: topicData.paperId,
  }).returning();
  return newTopic[0];
};

// Get all topics
export const getAllTopics = async () => {
  const allTopics = await db.select().from(topics);
  return allTopics;
};

// Get topic by ID
export const getTopicById = async (id: string) => {
  const topic = await db
    .select()
    .from(topics)
    .where(eq(topics.id, id));
  return topic.length > 0 ? topic[0] : null;
};

// Update topic
export const updateTopic = async (id: string, topicData: TopicData & { paperId: string }) => {
  const validatedData = TopicSchema.parse(topicData);
  const updatedTopic = await db
    .update(topics)
    .set({
      ...validatedData,
      paperId: topicData.paperId,
    })
    .where(eq(topics.id, id))
    .returning();
  return updatedTopic.length > 0 ? updatedTopic[0] : null;
};

// Delete topic
export const deleteTopic = async (id: string) => {
  const deletedTopic = await db
    .delete(topics)
    .where(eq(topics.id, id))
    .returning();
  return deletedTopic.length > 0 ? deletedTopic[0] : null;
};
