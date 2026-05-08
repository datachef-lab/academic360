import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createStatusController,
  deleteStatusController,
  getStatusByIdController,
  getStatusListController,
  updateStatusController,
} from "@/features/library/controllers/status.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getStatusListController);
router.get("/:id", getStatusByIdController);
router.post("/", createStatusController);
router.put("/:id", updateStatusController);
router.delete("/:id", deleteStatusController);

export default router;
