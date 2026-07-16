import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createPatronCategoryController,
  deletePatronCategoryController,
  getPatronCategoryByIdController,
  getPatronCategoryListController,
  updatePatronCategoryController,
} from "@/features/library/controllers/patron-category.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getPatronCategoryListController);
router.get("/:id", getPatronCategoryByIdController);
router.post("/", createPatronCategoryController);
router.put("/:id", updatePatronCategoryController);
router.delete("/:id", deletePatronCategoryController);

export default router;
