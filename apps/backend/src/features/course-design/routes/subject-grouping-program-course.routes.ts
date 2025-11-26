import { Router, RequestHandler } from "express";
import {
  createSubjectGroupingProgramCourseHandler,
  deleteSubjectGroupingProgramCourseHandler,
  getAllSubjectGroupingProgramCoursesHandler,
  getSubjectGroupingProgramCourseByIdHandler,
  updateSubjectGroupingProgramCourseHandler,
} from "../controllers/subject-grouping-program-course.controller.js";

const router = Router();

router.post("/", createSubjectGroupingProgramCourseHandler as RequestHandler);
router.get("/", getAllSubjectGroupingProgramCoursesHandler as RequestHandler);
router.get(
  "/:id",
  getSubjectGroupingProgramCourseByIdHandler as RequestHandler,
);
router.put("/:id", updateSubjectGroupingProgramCourseHandler as RequestHandler);
router.delete(
  "/:id",
  deleteSubjectGroupingProgramCourseHandler as RequestHandler,
);

export default router;
