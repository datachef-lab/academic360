import express from "express";
import {
  createBookReissueController,
  deleteBookReissueController,
  getAllBookReissuesController,
  getBookReissueByIdController,
  updateBookReissueController,
} from "@/features/library/controllers/book-reissue.controller.js";

const router = express.Router();

router.post("/", createBookReissueController);
router.get("/", getAllBookReissuesController);
router.get("/:id", getBookReissueByIdController);
router.put("/:id", updateBookReissueController);
router.delete("/:id", deleteBookReissueController);

export default router;
