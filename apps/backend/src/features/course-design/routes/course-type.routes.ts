import { Router } from "express";
import {
  createCourseTypeHandler,
  getAllCourseTypesHandler,
  getCourseTypeByIdHandler,
  updateCourseTypeHandler,
  deleteCourseTypeHandler,
} from "../controllers/course-type.controller.js";
import { RequestHandler } from "express";

const router = Router();

// CourseType routes
router.post("/", createCourseTypeHandler as RequestHandler);
router.get("/", getAllCourseTypesHandler as RequestHandler);
router.get("/:id", getCourseTypeByIdHandler as RequestHandler);
router.put("/:id", updateCourseTypeHandler as RequestHandler);
router.delete("/:id", deleteCourseTypeHandler as RequestHandler);

export default router;
