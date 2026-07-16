import { Router } from "express";
import {
  getStudentSubjectSelections,
  getStudentMandatoryPapers,
  getStudentUniversitySubjectsController,
} from "../controllers/student-subjects.controller.js";

const router = Router();

// GET /api/subject-selection/students/:studentId/selections
router.get("/students/:studentId/selections", getStudentSubjectSelections);

// GET /api/subject-selection/students/:studentId/mandatory-papers
router.get("/students/:studentId/mandatory-papers", getStudentMandatoryPapers);

// GET /api/subject-selection/students/:studentId/university-subjects
router.get(
  "/students/:studentId/university-subjects",
  getStudentUniversitySubjectsController,
);

export default router;
