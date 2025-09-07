import { Router } from "express";
import {
  createCourseLevel,
  getAllCourseLevels,
  getCourseLevelById,
  updateCourseLevel,
  deleteCourseLevel,
  bulkUploadCourseLevels,
} from "../controllers/course-level.controller.js";
import { RequestHandler } from "express";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

// CourseLevel routes
router.post("/", createCourseLevel as RequestHandler);
router.post(
  "/bulk-upload",
  uploadExcelMiddleware,
  bulkUploadCourseLevels as RequestHandler,
);
router.get("/", getAllCourseLevels as RequestHandler);
router.get("/:id", getCourseLevelById as RequestHandler);
router.put("/:id", updateCourseLevel as RequestHandler);
router.delete("/:id", deleteCourseLevel as RequestHandler);

export default router;
