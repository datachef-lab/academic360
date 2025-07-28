import { Router, RequestHandler } from "express";
import {
  createProgramCourseHandler,
  deleteProgramCourseHandler,
  getAllProgramCoursesHandler,
  getProgramCourseByIdHandler,
  updateProgramCourseHandler,
  bulkUploadProgramCoursesHandler
} from "../controllers/program-course.controller";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware";

const router = Router();

router.post("/", createProgramCourseHandler as RequestHandler);
router.post("/bulk-upload", uploadExcelMiddleware, bulkUploadProgramCoursesHandler as RequestHandler);
router.get("/", getAllProgramCoursesHandler as RequestHandler);
router.get("/:id", getProgramCourseByIdHandler as RequestHandler);
router.put("/:id", updateProgramCourseHandler as RequestHandler);
router.delete("/:id", deleteProgramCourseHandler as RequestHandler);

export default router;
