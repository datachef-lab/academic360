import express from "express";
import {
  createAuthorTypeController,
  deleteAuthorTypeController,
  getAllAuthorTypesController,
  getAuthorTypeByIdController,
  updateAuthorTypeController,
} from "@/features/library/controllers/author-type.controller.js";

const router = express.Router();

router.post("/", createAuthorTypeController);
router.get("/query", getAllAuthorTypesController);
router.get("/:id", getAuthorTypeByIdController);
router.put("/:id", updateAuthorTypeController);
router.delete("/:id", deleteAuthorTypeController);

export default router;
