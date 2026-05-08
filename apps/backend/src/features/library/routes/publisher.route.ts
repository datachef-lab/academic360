import express from "express";
import {
  createPublisherController,
  deletePublisherController,
  getAllPublishersController,
  getPublisherByIdController,
  updatePublisherController,
} from "@/features/library/controllers/publisher.controller.js";

const router = express.Router();

router.post("/", createPublisherController);
router.get("/", getAllPublishersController);
router.get("/:id", getPublisherByIdController);
router.put("/:id", updatePublisherController);
router.delete("/:id", deletePublisherController);

export default router;
