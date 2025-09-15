import { Router } from "express";
import {
  createBoardSubjectNameHandler,
  getAllBoardSubjectNamesHandler,
  getBoardSubjectNameByIdHandler,
  updateBoardSubjectNameHandler,
  deleteBoardSubjectNameHandler,
  bulkUploadBoardSubjectNamesHandler,
} from "../controllers/board-subject-name.controller";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware";

const router = Router();

// Board Subject Name routes
router.post("/", createBoardSubjectNameHandler);
router.get("/", getAllBoardSubjectNamesHandler);
router.get("/:id", getBoardSubjectNameByIdHandler);
router.put("/:id", updateBoardSubjectNameHandler);
router.delete("/:id", deleteBoardSubjectNameHandler);
router.post(
  "/bulk-upload",
  uploadExcelMiddleware,
  bulkUploadBoardSubjectNamesHandler,
);

export default router;
