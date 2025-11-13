import { Router, RequestHandler } from "express";
import {
  createExamType,
  deleteExamType,
  getAllExamTypes,
  getExamTypeById,
  updateExamType,
} from "../controllers/exam-type.controller.js";

const router = Router();

router.post("/", createExamType as RequestHandler);
router.get("/", getAllExamTypes as RequestHandler);
router.get("/:id", getExamTypeById as RequestHandler);
router.put("/:id", updateExamType as RequestHandler);
router.delete("/:id", deleteExamType as RequestHandler);

export default router;
