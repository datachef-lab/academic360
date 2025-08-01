import { Router } from "express";
import {
  createSubjectType,
  getAllSubjectTypes,
  getSubjectTypeById,
  updateSubjectType,
  deleteSubjectType,
  bulkUploadSubjectTypesHandler
} from "../controllers/subject-type.controller.js";
import { RequestHandler } from "express";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

// Subject Type routes
router.post("/", createSubjectType as RequestHandler);
router.post("/bulk-upload", uploadExcelMiddleware, bulkUploadSubjectTypesHandler as RequestHandler);
router.get("/", getAllSubjectTypes as RequestHandler);
router.get("/:id", getSubjectTypeById as RequestHandler);
router.put("/:id", updateSubjectType as RequestHandler);
router.delete("/:id", deleteSubjectType as RequestHandler);

export default router;
