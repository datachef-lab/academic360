import { Router } from "express";
import {
  createCourseHandler,
  getAllCoursesHandler,
  getCourseByIdHandler,
  updateCourseHandler,
  deleteCourseHandler,
} from "../controllers/course.controller.js";
import { RequestHandler } from "express";

const router = Router();

// Course routes
  router.post("/", createCourseHandler);
router.get("/", getAllCoursesHandler);
router.get("/:id", getCourseByIdHandler);
router.put("/:id", updateCourseHandler);
router.delete("/:id", deleteCourseHandler);

export default router;
