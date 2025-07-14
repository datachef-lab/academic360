import { Router } from "express";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from "../controllers/course.controller";
import { RequestHandler } from "express";

const router = Router();

// Course routes
router.post("/", createCourse as RequestHandler);
router.get("/", getAllCourses as RequestHandler);
router.get("/:id", getCourseById as RequestHandler);
router.put("/:id", updateCourse as RequestHandler);
router.delete("/:id", deleteCourse as RequestHandler);

export default router;
