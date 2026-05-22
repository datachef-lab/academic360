import express from "express";
import {
  createAuthorController,
  deleteAuthorController,
  getAllAuthorsController,
  getAuthorByIdController,
  updateAuthorController,
} from "@/features/library/controllers/author.controller.js";

const router = express.Router();

router.post("/", createAuthorController);
router.get("/", getAllAuthorsController);
router.get("/:id", getAuthorByIdController);
router.put("/:id", updateAuthorController);
router.delete("/:id", deleteAuthorController);

export default router;
