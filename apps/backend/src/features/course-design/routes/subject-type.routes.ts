import { Router } from "express";
import {
  createSubjectType,
  getAllSubjectTypes,
  getSubjectTypeById,
  updateSubjectType,
  deleteSubjectType,
} from "../controllers/subject-type.controller";
import { RequestHandler } from "express";

const router = Router();

// Subject Type routes
router.post("/", createSubjectType as RequestHandler);
router.get("/", getAllSubjectTypes as RequestHandler);
router.get("/:id", getSubjectTypeById as RequestHandler);
router.put("/:id", updateSubjectType as RequestHandler);
router.delete("/:id", deleteSubjectType as RequestHandler);

export default router;
