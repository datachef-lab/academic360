import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createLibraryArticleController,
  deleteLibraryArticleController,
  getLibraryArticleByIdController,
  getLibraryArticleListController,
  updateLibraryArticleController,
} from "@/features/library/controllers/library-article.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getLibraryArticleListController);
router.get("/:id", getLibraryArticleByIdController);
router.post("/", createLibraryArticleController);
router.put("/:id", updateLibraryArticleController);
router.delete("/:id", deleteLibraryArticleController);

export default router;
