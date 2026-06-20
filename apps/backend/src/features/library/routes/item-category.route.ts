import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createItemCategoryController,
  deleteItemCategoryController,
  getItemCategoryByIdController,
  getItemCategoryListController,
  updateItemCategoryController,
} from "@/features/library/controllers/item-category.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getItemCategoryListController);
router.get("/:id", getItemCategoryByIdController);
router.post("/", createItemCategoryController);
router.put("/:id", updateItemCategoryController);
router.delete("/:id", deleteItemCategoryController);

export default router;
