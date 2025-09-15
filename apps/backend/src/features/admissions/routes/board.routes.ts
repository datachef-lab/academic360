import { Router } from "express";
import {
  createBoardHandler,
  getAllBoardsHandler,
  getBoardByIdHandler,
  updateBoardHandler,
  deleteBoardHandler,
  bulkUploadBoardsHandler,
} from "../controllers/board.controller";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware";

const router = Router();

// Board routes
router.post("/", createBoardHandler);
router.get("/", getAllBoardsHandler);
router.get("/:id", getBoardByIdHandler);
router.put("/:id", updateBoardHandler);
router.delete("/:id", deleteBoardHandler);
router.post("/bulk-upload", uploadExcelMiddleware, bulkUploadBoardsHandler);

export default router;
