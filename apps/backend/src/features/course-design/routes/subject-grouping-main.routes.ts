import { Router, RequestHandler } from "express";
import {
  createSubjectGroupingMainHandler,
  deleteSubjectGroupingMainHandler,
  getAllSubjectGroupingMainsHandler,
  getSubjectGroupingMainByIdHandler,
  updateSubjectGroupingMainHandler,
} from "../controllers/subject-grouping-main.controller.js";

const router = Router();

router.post("/", createSubjectGroupingMainHandler as RequestHandler);
router.get("/", getAllSubjectGroupingMainsHandler as RequestHandler);
router.get("/:id", getSubjectGroupingMainByIdHandler as RequestHandler);
router.put("/:id", updateSubjectGroupingMainHandler as RequestHandler);
router.delete("/:id", deleteSubjectGroupingMainHandler as RequestHandler);

export default router;
