import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createAuthorTypeController,
  deleteAuthorTypeController,
  getAuthorTypeByIdController,
  getAuthorTypeListController,
  updateAuthorTypeController,
} from "@/features/library/controllers/author-type.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getAuthorTypeListController);
router.get("/:id", getAuthorTypeByIdController);
router.post("/", createAuthorTypeController);
router.put("/:id", updateAuthorTypeController);
router.delete("/:id", deleteAuthorTypeController);

export default router;
