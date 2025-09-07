import { Router } from "express";
import {
  createStreamHandler,
  getAllStreamsHandler,
  getStreamByIdHandler,
  updateStreamHandler,
  deleteStreamHandler,
  bulkUploadStreamsHandler,
} from "../controllers/stream.controller.js";
import { RequestHandler } from "express";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

// Stream routes
router.post("/", createStreamHandler as RequestHandler);
router.post(
  "/bulk-upload",
  uploadExcelMiddleware,
  bulkUploadStreamsHandler as RequestHandler,
);
router.get("/", getAllStreamsHandler as RequestHandler);
router.get("/:id", getStreamByIdHandler as RequestHandler);
router.put("/:id", updateStreamHandler as RequestHandler);
router.delete("/:id", deleteStreamHandler as RequestHandler);

export default router;
