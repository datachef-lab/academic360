import express from "express";
import {
  createBorrowingTypeController,
  deleteBorrowingTypeController,
  getAllBorrowingTypesController,
  getBorrowingTypeByIdController,
  updateBorrowingTypeController,
} from "@/features/library/controllers/borrowing-type.controller.js";

const router = express.Router();

router.post("/", createBorrowingTypeController);
router.get("/", getAllBorrowingTypesController);
router.get("/:id", getBorrowingTypeByIdController);
router.put("/:id", updateBorrowingTypeController);
router.delete("/:id", deleteBorrowingTypeController);

export default router;
