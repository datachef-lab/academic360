import { Request, Response } from "express";
import {
  createTopic as createTopicService,
  getAllTopics as getAllTopicsService,
  getTopicById as getTopicByIdService,
  updateTopic as updateTopicService,
  deleteTopic as deleteTopicService,
} from "../services/topic.service";

export const createTopic = async (req: Request, res: Response) => {
  try {
    const newTopic = await createTopicService({
      ...req.body,
      paperId: req.body.paperId,
    });
    res.status(201).json(newTopic);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllTopics = async (_req: Request, res: Response) => {
  try {
    const allTopics = await getAllTopicsService();
    res.json(allTopics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTopicById = async (req: Request, res: Response) => {
  try {
    const topic = await getTopicByIdService(req.params.id);
    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }
    res.json(topic);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTopic = async (req: Request, res: Response) => {
  try {
    const updatedTopic = await updateTopicService(req.params.id, {
      ...req.body,
      paperId: req.body.paperId,
    });
    if (!updatedTopic) {
      return res.status(404).json({ error: "Topic not found" });
    }
    res.json(updatedTopic);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const deletedTopic = await deleteTopicService(req.params.id);
    if (!deletedTopic) {
      return res.status(404).json({ error: "Topic not found" });
    }
    res.json({ message: "Topic deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
