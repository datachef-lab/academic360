import { Router } from "express";
import {
  getStudentSubjectSelections,
  getStudentMandatoryPapers,
} from "../controllers/student-subjects.controller.js";

const router = Router();

// GET /api/subject-selection/students/:studentId/selections
router.get("/students/:studentId/selections", getStudentSubjectSelections);

// GET /api/subject-selection/students/:studentId/mandatory-papers
router.get("/students/:studentId/mandatory-papers", getStudentMandatoryPapers);

export default router;
