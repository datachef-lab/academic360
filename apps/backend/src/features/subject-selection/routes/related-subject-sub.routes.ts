import { Router, RequestHandler } from "express";
import {
  createRelatedSubjectSubHandler,
  deleteRelatedSubjectSubHandler,
  getAllRelatedSubjectSubsHandler,
  getRelatedSubjectSubByIdHandler,
  getRelatedSubjectSubsByMainIdHandler,
  updateRelatedSubjectSubHandler,
  bulkUploadRelatedSubjectSubsHandler,
} from "../controllers/related-subject-sub.controller.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

router.post("/", createRelatedSubjectSubHandler as RequestHandler);
router.post(
  "/bulk-upload",
  uploadExcelMiddleware,
  bulkUploadRelatedSubjectSubsHandler as RequestHandler,
);
router.get("/", getAllRelatedSubjectSubsHandler as RequestHandler);
router.get(
  "/main/:mainId",
  getRelatedSubjectSubsByMainIdHandler as RequestHandler,
);
router.get("/:id", getRelatedSubjectSubByIdHandler as RequestHandler);
router.put("/:id", updateRelatedSubjectSubHandler as RequestHandler);
router.delete("/:id", deleteRelatedSubjectSubHandler as RequestHandler);

export default router;
