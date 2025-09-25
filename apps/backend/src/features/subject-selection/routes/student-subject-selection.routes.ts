import { Router, RequestHandler } from "express";
import {
  listStudentSubjectSelections,
  getStudentSubjectSelection,
  createStudentSubjectSelectionController,
  updateStudentSubjectSelectionController,
  deleteStudentSubjectSelectionController,
} from "../controllers/student-subject-selection.controller.js";

const router = Router();

// /api/subject-selection/student-subject-selections
router.get(
  "/student-subject-selections",
  listStudentSubjectSelections as RequestHandler,
);
router.get(
  "/student-subject-selections/:id",
  getStudentSubjectSelection as RequestHandler,
);
router.post(
  "/student-subject-selections",
  createStudentSubjectSelectionController as RequestHandler,
);
router.put(
  "/student-subject-selections/:id",
  updateStudentSubjectSelectionController as RequestHandler,
);
router.delete(
  "/student-subject-selections/:id",
  deleteStudentSubjectSelectionController as RequestHandler,
);

export default router;
