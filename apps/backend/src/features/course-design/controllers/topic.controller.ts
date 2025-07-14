import { Request, Response } from "express";
import { db } from "@/db";
import { topics } from "../models/topic.model";
import { eq } from "drizzle-orm";
import { TopicSchema } from "@/types/course-design";

export const createTopic = async (req: Request, res: Response) => {
  try {
    const topicData = TopicSchema.parse(req.body);
    const newTopic = await db.insert(topics).values({
      ...topicData,
      paperId: req.body.paperId,
    }).returning();
    res.status(201).json(newTopic[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllTopics = async (_req: Request, res: Response) => {
  try {
    const allTopics = await db.select().from(topics);
    res.json(allTopics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTopicById = async (req: Request, res: Response) => {
  try {
    const topic = await db
      .select()
      .from(topics)
      .where(eq(topics.id, req.params.id));
    if (!topic.length) {
      return res.status(404).json({ error: "Topic not found" });
    }
    res.json(topic[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTopic = async (req: Request, res: Response) => {
  try {
    const topicData = TopicSchema.parse(req.body);
    const updatedTopic = await db
      .update(topics)
      .set({
        ...topicData,
        paperId: req.body.paperId,
      })
      .where(eq(topics.id, req.params.id))
      .returning();
    if (!updatedTopic.length) {
      return res.status(404).json({ error: "Topic not found" });
    }
    res.json(updatedTopic[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const deletedTopic = await db
      .delete(topics)
      .where(eq(topics.id, req.params.id))
      .returning();
    if (!deletedTopic.length) {
      return res.status(404).json({ error: "Topic not found" });
    }
    res.json({ message: "Topic deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
