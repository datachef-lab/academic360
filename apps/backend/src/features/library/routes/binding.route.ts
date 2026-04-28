import express from "express";
import {
  createBindingController,
  deleteBindingController,
  getAllBindingsController,
  getBindingByIdController,
  updateBindingController,
} from "@/features/library/controllers/binding.controller.js";

const router = express.Router();

router.post("/", createBindingController);
router.get("/", getAllBindingsController);
router.get("/:id", getBindingByIdController);
router.put("/:id", updateBindingController);
router.delete("/:id", deleteBindingController);

export default router;
