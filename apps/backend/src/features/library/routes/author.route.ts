import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createAuthorController,
  deleteAuthorController,
  getAuthorByIdController,
  getAuthorListController,
  updateAuthorController,
} from "@/features/library/controllers/author.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getAuthorListController);
router.get("/:id", getAuthorByIdController);
router.post("/", createAuthorController);
router.put("/:id", updateAuthorController);
router.delete("/:id", deleteAuthorController);

export default router;
