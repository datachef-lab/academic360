import { Router } from "express";
import {
  createSubjectHandler,
  getAllSubjectsHandler,
  getSubjectByIdHandler,
  updateSubjectHandler,
  deleteSubjectHandler,
  bulkUploadSubjectsHandler,
} from "../controllers/subject.controller.js";
import { RequestHandler } from "express";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

// Subject routes
router.post("/", createSubjectHandler as RequestHandler);
router.post("/bulk-upload", uploadExcelMiddleware, bulkUploadSubjectsHandler as RequestHandler);
router.get("/", getAllSubjectsHandler as RequestHandler);
router.get("/:id", getSubjectByIdHandler as RequestHandler);
router.put("/:id", updateSubjectHandler as RequestHandler);
router.delete("/:id", deleteSubjectHandler as RequestHandler);

export default router;
