import { Router } from "express";
import {
  createTopic,
  getAllTopics,
  getTopicById,
  updateTopic,
  deleteTopic,
} from "../controllers/topic.controller";
import { RequestHandler } from "express";

const router = Router();

// Topic routes
router.post("/", createTopic as RequestHandler);
router.get("/", getAllTopics as RequestHandler);
router.get("/:id", getTopicById as RequestHandler);
router.put("/:id", updateTopic as RequestHandler);
router.delete("/:id", deleteTopic as RequestHandler);

export default router;
