import { Router } from "express";
import {
  createExamComponent,
  getAllExamComponents,
  getExamComponentById,
  updateExamComponent,
  deleteExamComponent,
} from "../controllers/exam-component.controller.js";
import { RequestHandler } from "express";

const router = Router();

// Exam Component routes
router.post("/", createExamComponent as RequestHandler);
router.get("/", getAllExamComponents as RequestHandler);
router.get("/:id", getExamComponentById as RequestHandler);
router.put("/:id", updateExamComponent as RequestHandler);
router.delete("/:id", deleteExamComponent as RequestHandler);

export default router;
