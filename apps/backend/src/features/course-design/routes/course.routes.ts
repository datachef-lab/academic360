import { Router } from "express";
import {
  createCourseHandler,
  getAllCoursesHandler,
  getCourseByIdHandler,
  updateCourseHandler,
  deleteCourseHandler,
  bulkUploadCoursesHandler,
} from "../controllers/course.controller.js";
import { RequestHandler } from "express";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

// Course routes
router.post("/", createCourseHandler as RequestHandler);
router.post("/bulk-upload", uploadExcelMiddleware, bulkUploadCoursesHandler as RequestHandler);
router.get("/", getAllCoursesHandler as RequestHandler);
router.get("/:id", getCourseByIdHandler as RequestHandler);
router.put("/:id", updateCourseHandler as RequestHandler);
router.delete("/:id", deleteCourseHandler as RequestHandler);

export default router;
