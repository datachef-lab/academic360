import { Router } from "express";
import {
  createCourseType,
  getAllCourseTypes,
  getCourseTypeById,
  updateCourseType,
  deleteCourseType,
} from "../controllers/course-type.controller";
import { RequestHandler } from "express";

const router = Router();

// CourseType routes
router.post("/", createCourseType as RequestHandler);
router.get("/", getAllCourseTypes as RequestHandler);
router.get("/:id", getCourseTypeById as RequestHandler);
router.put("/:id", updateCourseType as RequestHandler);
router.delete("/:id", deleteCourseType as RequestHandler);

export default router;
