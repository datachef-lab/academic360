import { Router } from "express";
import {
  createCourseLevel,
  getAllCourseLevels,
  getCourseLevelById,
  updateCourseLevel,
  deleteCourseLevel,
} from "../controllers/course-level.controller";
import { RequestHandler } from "express";

const router = Router();

// CourseLevel routes
router.post("/", createCourseLevel as RequestHandler);
router.get("/", getAllCourseLevels as RequestHandler);
router.get("/:id", getCourseLevelById as RequestHandler);
router.put("/:id", updateCourseLevel as RequestHandler);
router.delete("/:id", deleteCourseLevel as RequestHandler);

export default router;
