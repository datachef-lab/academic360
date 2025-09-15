import { Router } from "express";
import {
  createBoardSubjectHandler,
  getAllBoardSubjectsHandler,
  getBoardSubjectByIdHandler,
  getBoardSubjectsByBoardIdHandler,
  updateBoardSubjectHandler,
  deleteBoardSubjectHandler,
  bulkUploadBoardSubjectsHandler,
} from "../controllers/board-subject.controller";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware";

const router = Router();

// Board Subject routes
router.post("/", createBoardSubjectHandler);
router.get("/", getAllBoardSubjectsHandler);
router.get("/:id", getBoardSubjectByIdHandler);
router.get("/board/:boardId", getBoardSubjectsByBoardIdHandler);
router.put("/:id", updateBoardSubjectHandler);
router.delete("/:id", deleteBoardSubjectHandler);
router.post(
  "/bulk-upload",
  uploadExcelMiddleware,
  bulkUploadBoardSubjectsHandler,
);

export default router;
