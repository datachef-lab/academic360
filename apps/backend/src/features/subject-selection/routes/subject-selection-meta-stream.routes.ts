import { Router, RequestHandler } from "express";
import {
  createSubjectSelectionMetaStreamHandler,
  deleteSubjectSelectionMetaStreamHandler,
  getAllSubjectSelectionMetaStreamsHandler,
  getSubjectSelectionMetaStreamByIdHandler,
  updateSubjectSelectionMetaStreamHandler,
} from "../controllers/subject-selection-meta-stream.controller.js";

const router = Router();

router.post("/", createSubjectSelectionMetaStreamHandler as RequestHandler);
router.get("/", getAllSubjectSelectionMetaStreamsHandler as RequestHandler);
router.get("/:id", getSubjectSelectionMetaStreamByIdHandler as RequestHandler);
router.put("/:id", updateSubjectSelectionMetaStreamHandler as RequestHandler);
router.delete(
  "/:id",
  deleteSubjectSelectionMetaStreamHandler as RequestHandler,
);

export default router;
