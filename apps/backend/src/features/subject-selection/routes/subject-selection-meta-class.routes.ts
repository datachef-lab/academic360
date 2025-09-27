import { Router, RequestHandler } from "express";
import {
  createSubjectSelectionMetaClassHandler,
  deleteSubjectSelectionMetaClassHandler,
  getAllSubjectSelectionMetaClassesHandler,
  getSubjectSelectionMetaClassByIdHandler,
  updateSubjectSelectionMetaClassHandler,
} from "../controllers/subject-selection-meta-class.controller.js";

const router = Router();

router.post("/", createSubjectSelectionMetaClassHandler as RequestHandler);
router.get("/", getAllSubjectSelectionMetaClassesHandler as RequestHandler);
router.get("/:id", getSubjectSelectionMetaClassByIdHandler as RequestHandler);
router.put("/:id", updateSubjectSelectionMetaClassHandler as RequestHandler);
router.delete("/:id", deleteSubjectSelectionMetaClassHandler as RequestHandler);

export default router;
