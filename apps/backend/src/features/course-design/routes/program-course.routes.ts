import { Router } from "express";
import {
  createProgramCourse,
  getAllProgramCourses,
  getProgramCourseById,
  updateProgramCourse,
  deleteProgramCourse,
} from "../controllers/program-course.controller";
import { RequestHandler } from "express";

const router = Router();

// ProgramCourse routes
router.post("/", createProgramCourse as RequestHandler);
router.get("/", getAllProgramCourses as RequestHandler);
router.get("/:id", getProgramCourseById as RequestHandler);
router.put("/:id", updateProgramCourse as RequestHandler);
router.delete("/:id", deleteProgramCourse as RequestHandler);

export default router;
