import { Router } from "express";
import {
  createSubjectController,
  getAllSubjectsController,
  getSubjectByIdController,
  updateSubjectController,
  deleteSubjectController,
  bulkUploadSubjectsController,
} from "../controllers/subject.controller.js";
import { RequestHandler } from "express";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

// Subject routes
router.post("/", createSubjectController as RequestHandler);
router.post(
  "/bulk-upload",
  uploadExcelMiddleware,
  bulkUploadSubjectsController as RequestHandler,
);
router.get("/", getAllSubjectsController as RequestHandler);
router.get("/:id", getSubjectByIdController as RequestHandler);
router.put("/:id", updateSubjectController as RequestHandler);
router.delete("/:id", deleteSubjectController as RequestHandler);

export default router;
