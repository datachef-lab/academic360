import { Router, RequestHandler } from "express";
import {
  createSubjectSpecificPassingHandler,
  deleteSubjectSpecificPassingHandler,
  getAllSubjectSpecificPassingsHandler,
  getSubjectSpecificPassingByIdHandler,
  getSubjectSpecificPassingBySubjectIdHandler,
  updateSubjectSpecificPassingHandler,
  bulkUploadSubjectSpecificPassingsHandler,
} from "../controllers/subject-specific-passing.controller.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

router.post("/", createSubjectSpecificPassingHandler as RequestHandler);
router.post(
  "/bulk-upload",
  uploadExcelMiddleware,
  bulkUploadSubjectSpecificPassingsHandler as RequestHandler,
);
router.get("/", getAllSubjectSpecificPassingsHandler as RequestHandler);
router.get(
  "/subject/:subjectId",
  getSubjectSpecificPassingBySubjectIdHandler as RequestHandler,
);
router.get("/:id", getSubjectSpecificPassingByIdHandler as RequestHandler);
router.put("/:id", updateSubjectSpecificPassingHandler as RequestHandler);
router.delete("/:id", deleteSubjectSpecificPassingHandler as RequestHandler);

export default router;
