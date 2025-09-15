import { Router, RequestHandler } from "express";
import {
  createRelatedSubjectMainHandler,
  deleteRelatedSubjectMainHandler,
  getAllRelatedSubjectMainsHandler,
  getRelatedSubjectMainByIdHandler,
  updateRelatedSubjectMainHandler,
  bulkUploadRelatedSubjectMainsHandler,
} from "../controllers/related-subject-main.controller.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

router.post("/", createRelatedSubjectMainHandler as RequestHandler);
router.post(
  "/bulk-upload",
  uploadExcelMiddleware,
  bulkUploadRelatedSubjectMainsHandler as RequestHandler,
);
router.get("/", getAllRelatedSubjectMainsHandler as RequestHandler);
router.get("/:id", getRelatedSubjectMainByIdHandler as RequestHandler);
router.put("/:id", updateRelatedSubjectMainHandler as RequestHandler);
router.delete("/:id", deleteRelatedSubjectMainHandler as RequestHandler);

export default router;
