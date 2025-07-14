import { Router } from "express";
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} from "../controllers/subject.controller";
import { RequestHandler } from "express";

const router = Router();

// Subject routes
router.post("/", createSubject as RequestHandler);
router.get("/", getAllSubjects as RequestHandler);
router.get("/:id", getSubjectById as RequestHandler);
router.put("/:id", updateSubject as RequestHandler);
router.delete("/:id", deleteSubject as RequestHandler);

export default router;
