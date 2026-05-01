import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createBookController,
  deleteBookController,
  downloadBookExcelController,
  getBookByIdController,
  getBookListController,
  getBooksMetaController,
  uploadBookCoverMiddleware,
  updateBookController,
} from "@/features/library/controllers/book.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/meta", getBooksMetaController);
router.get("/download", downloadBookExcelController);
router.get("/", getBookListController);
router.get("/:id", getBookByIdController);
router.post("/", uploadBookCoverMiddleware, createBookController);
router.put("/:id", uploadBookCoverMiddleware, updateBookController);
router.delete("/:id", deleteBookController);

export default router;
