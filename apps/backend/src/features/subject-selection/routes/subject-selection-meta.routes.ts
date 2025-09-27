import { Router, RequestHandler } from "express";
import {
  createSubjectSelectionMetaHandler,
  deleteSubjectSelectionMetaHandler,
  getAllSubjectSelectionMetasHandler,
  getSubjectSelectionMetaByIdHandler,
  updateSubjectSelectionMetaHandler,
} from "../controllers/subject-selection-meta.controller.js";

const router = Router();

router.post("/", createSubjectSelectionMetaHandler as RequestHandler);
router.get("/", getAllSubjectSelectionMetasHandler as RequestHandler);
router.get("/:id", getSubjectSelectionMetaByIdHandler as RequestHandler);
router.put("/:id", updateSubjectSelectionMetaHandler as RequestHandler);
router.delete("/:id", deleteSubjectSelectionMetaHandler as RequestHandler);

export default router;
