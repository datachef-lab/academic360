import { Router, RequestHandler } from "express";
import {
  createSubjectGroupingSubjectHandler,
  deleteSubjectGroupingSubjectHandler,
  getAllSubjectGroupingSubjectsHandler,
  getSubjectGroupingSubjectByIdHandler,
  updateSubjectGroupingSubjectHandler,
} from "../controllers/subject-grouping-sub.controller.js";

const router = Router();

router.post("/", createSubjectGroupingSubjectHandler as RequestHandler);
router.get("/", getAllSubjectGroupingSubjectsHandler as RequestHandler);
router.get("/:id", getSubjectGroupingSubjectByIdHandler as RequestHandler);
router.put("/:id", updateSubjectGroupingSubjectHandler as RequestHandler);
router.delete("/:id", deleteSubjectGroupingSubjectHandler as RequestHandler);

export default router;
