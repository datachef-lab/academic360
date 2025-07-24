import { Router } from "express";
import {
  createStream,
  getAllStreams,
  getStreamById,
  updateStream,
  deleteStream,
} from "../controllers/stream.controller";
import { RequestHandler } from "express";

const router = Router();

// Stream routes
router.post("/", createStream as RequestHandler);
router.get("/", getAllStreams as RequestHandler);
router.get("/:id", getStreamById as RequestHandler);
router.put("/:id", updateStream as RequestHandler);
router.delete("/:id", deleteStream as RequestHandler);

export default router;
