import express from "express";
import {
  createAuthorDetailController,
  deleteAuthorDetailController,
  getAllAuthorDetailsController,
  getAuthorDetailByIdController,
  updateAuthorDetailController,
} from "@/features/library/controllers/author-detail.controller.js";

const router = express.Router();

router.post("/", createAuthorDetailController);
router.get("/", getAllAuthorDetailsController);
router.get("/:id", getAuthorDetailByIdController);
router.put("/:id", updateAuthorDetailController);
router.delete("/:id", deleteAuthorDetailController);

export default router;
