import { Router } from "express";
import {
  createTopicHandler,
  getAllTopicsHandler,
  getTopicByIdHandler,
  updateTopicHandler,
  deleteTopicHandler,
} from "../controllers/topic.controller.js";
import { RequestHandler } from "express";

const router = Router();

// Topic routes
router.post("/", createTopicHandler as RequestHandler);
router.get("/", getAllTopicsHandler as RequestHandler);
router.get("/:id", getTopicByIdHandler as RequestHandler);
router.put("/:id", updateTopicHandler as RequestHandler);
router.delete("/:id", deleteTopicHandler as RequestHandler);

export default router;
