import { Router } from "express";
import {
  createStreamHandler,
  getAllStreamsHandler,
  getStreamByIdHandler,
  updateStreamHandler,
  deleteStreamHandler,
} from "../controllers/stream.controller.js";
import { RequestHandler } from "express";

const router = Router();

// Stream routes
router.post("/", createStreamHandler as RequestHandler);
router.get("/", getAllStreamsHandler as RequestHandler);
router.get("/:id", getStreamByIdHandler as RequestHandler);
router.put("/:id", updateStreamHandler as RequestHandler);
router.delete("/:id", deleteStreamHandler as RequestHandler);

export default router;
