import { Router, RequestHandler } from "express";
import {
  createRestrictedGroupingProgramCourseHandler,
  deleteRestrictedGroupingProgramCourseHandler,
  getAllRestrictedGroupingProgramCoursesHandler,
  getRestrictedGroupingProgramCourseByIdHandler,
  getRestrictedGroupingProgramCoursesByMainIdHandler,
  updateRestrictedGroupingProgramCourseHandler,
  bulkUploadRestrictedGroupingProgramCoursesHandler,
} from "../controllers/restricted-grouping-program-course.controller.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

router.post(
  "/",
  createRestrictedGroupingProgramCourseHandler as RequestHandler,
);
router.post(
  "/bulk-upload",
  uploadExcelMiddleware,
  bulkUploadRestrictedGroupingProgramCoursesHandler as RequestHandler,
);
router.get(
  "/",
  getAllRestrictedGroupingProgramCoursesHandler as RequestHandler,
);
router.get(
  "/main/:mainId",
  getRestrictedGroupingProgramCoursesByMainIdHandler as RequestHandler,
);
router.get(
  "/:id",
  getRestrictedGroupingProgramCourseByIdHandler as RequestHandler,
);
router.put(
  "/:id",
  updateRestrictedGroupingProgramCourseHandler as RequestHandler,
);
router.delete(
  "/:id",
  deleteRestrictedGroupingProgramCourseHandler as RequestHandler,
);

export default router;
