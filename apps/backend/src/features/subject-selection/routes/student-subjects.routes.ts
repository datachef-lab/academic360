import { Router } from "express";
import { getStudentSubjectSelections } from "../controllers/student-subjects.controller.js";

const router = Router();

// GET /api/subject-selection/students/:studentId/selections
router.get("/students/:studentId/selections", getStudentSubjectSelections);

export default router;
